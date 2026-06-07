
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import OpenAI from "https://esm.sh/openai@4.28.0";

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGIN') ?? 'https://grimoire-web.pages.dev,http://localhost:3000')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

const buildCorsHeaders = (req: Request): Record<string, string> => {
    const origin = req.headers.get('Origin') ?? '';
    const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] ?? '*';
    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Vary': 'Origin',
    };
};

// In-memory rate limit (resets on Edge Function cold start).
// Limit per authenticated user; cheap defense against credential-leak abuse.
const RATE_LIMIT_PER_MINUTE = 20;
const rateBuckets = new Map<string, { count: number; windowStart: number }>();

const checkRateLimit = (userId: string): { allowed: boolean; remaining: number } => {
    const now = Date.now();
    const bucket = rateBuckets.get(userId);
    if (!bucket || now - bucket.windowStart >= 60_000) {
        rateBuckets.set(userId, { count: 1, windowStart: now });
        return { allowed: true, remaining: RATE_LIMIT_PER_MINUTE - 1 };
    }
    if (bucket.count >= RATE_LIMIT_PER_MINUTE) {
        return { allowed: false, remaining: 0 };
    }
    bucket.count += 1;
    return { allowed: true, remaining: RATE_LIMIT_PER_MINUTE - bucket.count };
};

// AI Provider Configuration Mapping
// 环境变量名不再使用 VITE_ 前缀（服务端不需要）
interface ProviderConfig {
    envKey: string;
    baseURL: string;
    model: string;
}

const PROVIDER_CONFIG: Record<string, ProviderConfig> = {
    // === 官方 API ===
    deepseek: {
        envKey: 'DEEPSEEK_KEY',
        baseURL: 'https://api.deepseek.com',
        model: 'deepseek-chat',
    },
    gemini: {
        envKey: 'GEMINI_KEY',
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
        model: 'gemini-2.0-flash-exp',
    },
    kimi: {
        envKey: 'KIMI_KEY',
        baseURL: 'https://api.moonshot.cn/v1',
        model: 'moonshot-v1-8k',
    },
    glm: {
        envKey: 'GLM_KEY',
        baseURL: 'https://open.bigmodel.cn/api/paas/v4',
        model: 'glm-4.7',
    },
    // === 华为云 MaaS ===
    hw_deepseek_v3: {
        envKey: 'HW_MAAS_KEY',
        baseURL: 'https://api.modelarts-maas.com/v1',
        model: 'deepseek-v3.2',
    },
    hw_deepseek_r1: {
        envKey: 'HW_MAAS_KEY',
        baseURL: 'https://api.modelarts-maas.com/v1',
        model: 'DeepSeek-R1',
    },
    // === SiliconFlow 代理 ===
    sf_deepseek_v3_2: {
        envKey: 'SILICONFLOW_KEY',
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'deepseek-ai/DeepSeek-V3.2-Exp',
    },
    sf_minimax_m2: {
        envKey: 'SILICONFLOW_KEY',
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'MiniMaxAI/MiniMax-M2',
    },
    sf_qwen_3_vl: {
        envKey: 'SILICONFLOW_KEY',
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'Qwen/Qwen3-VL-32B-Instruct',
    },
    sf_glm_4_6: {
        envKey: 'SILICONFLOW_KEY',
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'zai-org/GLM-4.6',
    },
    sf_kimi_k2: {
        envKey: 'SILICONFLOW_KEY',
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'moonshotai/Kimi-K2-Thinking',
    },
    sf_kimi_k2_instruct: {
        envKey: 'SILICONFLOW_KEY',
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'moonshotai/Kimi-K2-Instruct-0905',
    },
};

serve(async (req: Request) => {
    const corsHeaders = buildCorsHeaders(req);

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Verify Authentication — validate the JWT, don't just accept any header.
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Server misconfigured: missing Supabase env');
        }

        const authClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { headers: { Authorization: authHeader } },
        });

        const { data: authData, error: authError } = await authClient.auth.getUser();
        if (authError || !authData?.user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        // 2. Rate limit per user — protects AI provider quota from credential abuse.
        const rate = checkRateLimit(authData.user.id);
        if (!rate.allowed) {
            return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again in a minute.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' },
                status: 429,
            });
        }

        // 3. Parse Request Body
        const { prompt, gameContext, aiProvider } = await req.json();

        if (!prompt) throw new Error('Missing prompt');
        if (!aiProvider || !PROVIDER_CONFIG[aiProvider]) throw new Error('Invalid or missing aiProvider');

        const config = PROVIDER_CONFIG[aiProvider];
        const apiKey = Deno.env.get(config.envKey);

        if (!apiKey) {
            console.error(`Missing API Key for ${aiProvider} (Env: ${config.envKey})`);
            throw new Error(`Server configuration error: Missing API Key for ${aiProvider}`);
        }

        // 4. Initialize OpenAI Client
        const openai = new OpenAI({
            apiKey: apiKey,
            baseURL: config.baseURL,
        });

        // 5. Build messages array with conversation history
        const systemPrompt = "你是《血染钟楼》的说书人助手。请简短、专业地回答规则问题。不要废话。";

        const messages: Array<{ role: string; content: string }> = [
            { role: "system", content: systemPrompt }
        ];

        // Add previous messages for multi-turn conversation
        if (gameContext?.previousMessages && Array.isArray(gameContext.previousMessages)) {
            for (const msg of gameContext.previousMessages) {
                if (msg.role && msg.content) {
                    messages.push({
                        role: msg.role === 'assistant' ? 'assistant' : 'user',
                        content: msg.content
                    });
                }
            }
        }

        // Add current prompt with context
        const contextInfo = gameContext ?
            `[游戏状态: 第${gameContext.dayCount || 1}天, ${gameContext.phase || 'DAY'}阶段, ${gameContext.alivePlayers || '?'}/${gameContext.seatCount || '?'}存活]` : '';

        messages.push({
            role: "user",
            content: contextInfo ? `${contextInfo}\n${prompt}` : prompt
        });

        // 6. Call AI API
        const completion = await openai.chat.completions.create({
            messages: messages as any,
            model: config.model,
        });

        let reply = completion.choices[0]?.message?.content || '';

        // Handle DeepSeek R1 "reasoning_content" if available
        // @ts-ignore
        const reasoning = completion.choices[0]?.message?.reasoning_content;
        if (reasoning) {
            reply = `<think>${reasoning}</think>\n${reply}`;
        }

        // 7. Return Response
        return new Response(JSON.stringify({ reply }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error('Error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
