import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createLogger, defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filteredLogger = createLogger();
const originalWarnOnce = filteredLogger.warnOnce;

filteredLogger.warnOnce = (message, options) => {
  if (message.includes('A PostCSS plugin did not pass the `from` option to `postcss.parse`')) {
    return;
  }

  originalWarnOnce(message, options);
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    customLogger: filteredLogger,
    server: {
      port: 3000,
      // Default to localhost for test runners; override with VITE_DEV_HOST if needed.
      host: env.VITE_DEV_HOST || '127.0.0.1',
    },
    plugins: [react()],
    define: {
      // Hash admin password at build time so plaintext never appears in the bundle.
      // The raw VITE_ADMIN_PASSWORD is consumed here only; source code uses the hash.
      '__ADMIN_PASSWORD_HASH__': JSON.stringify(
        env.VITE_ADMIN_PASSWORD
          ? crypto.createHash('sha256').update(env.VITE_ADMIN_PASSWORD).digest('hex')
          : ''
      ),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    build: {
      // 代码分割策略
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (!id.includes('node_modules')) return undefined;

            // React 基础与轻量状态层合并，避免 state <-> react-vendor 循环 chunk
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/scheduler/') ||
              id.includes('/zustand/') ||
              id.includes('/immer/')
            ) {
              return 'react-vendor';
            }

            // UI 与动效分离，避免单个超大 chunk
            if (id.includes('/@radix-ui/')) {
              return 'radix';
            }
            if (id.includes('/framer-motion/')) {
              return 'motion';
            }
            // 画布渲染
            if (id.includes('/react-konva/') || id.includes('/konva/')) {
              return 'canvas';
            }

            // 物理引擎
            if (id.includes('/matter-js/')) {
              return 'physics';
            }

            // 后端服务
            if (id.includes('/@supabase/supabase-js/')) {
              return 'backend';
            }

            return undefined;
          },
        },
        // 增强 tree-shaking
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
        },
      },
      // 压缩优化 - 使用 esbuild (更快)
      minify: 'esbuild',
      // 生产环境移除 console
      esbuildOptions: {
        drop: mode === 'production' ? ['console', 'debugger'] : [],
      },
      // 资源内联阈值
      assetsInlineLimit: 4096,
      // 源码映射 (生产环境关闭)
      sourcemap: mode !== 'production',
      // chunk 大小警告阈值
      chunkSizeWarningLimit: 400,
    },
    // 依赖预构建优化
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'zustand',
        'immer',
        'framer-motion',
        'lucide-react',
      ],
    },
  };
});
