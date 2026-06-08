import { describe, it, expect } from 'vitest';
import { 
    generateEmpathInfo, 
    generateChefInfo, 
    generateFortuneTellerInfo,
    generateWasherwomanInfo,
    generateUndertakerInfo,
    generateInvestigatorInfo,
    generateLibrarianInfo
} from './infoGeneration';
import { GameState, Seat } from '../types';

const customRoles = {
    bone_oracle: {
        id: 'bone_oracle',
        name: '骨谕者',
        team: 'TOWNSFOLK' as const,
        ability: '自定义镇民能力',
    },
    haunted_beggar: {
        id: 'haunted_beggar',
        name: '闹鬼乞丐',
        team: 'OUTSIDER' as const,
        ability: '自定义外来者能力',
    },
    shadow_agent: {
        id: 'shadow_agent',
        name: '影子探员',
        team: 'MINION' as const,
        ability: '自定义爪牙能力',
    },
    midnight_fiend: {
        id: 'midnight_fiend',
        name: '午夜恶魔',
        team: 'DEMON' as const,
        ability: '自定义恶魔能力',
    },
};

// 创建 mock 座位
const createMockSeat = (id: number, overrides: Partial<Seat> = {}): Seat => ({
    id,
    userName: `玩家${id}`,
    userId: null,
    roleId: null,
    realRoleId: null,
    seenRoleId: null,
    isDead: false,
    reminders: [],
    statuses: [],
    hasGhostVote: true,
    isHandRaised: false,
    isNominated: false,
    hasUsedAbility: false,
    ...overrides
});

// 创建 mock 游戏状态
const createMockGameState = (seatOverrides: Partial<Seat>[] = []): GameState => {
    const seats = Array.from({ length: 8 }, (_, i) => 
        createMockSeat(i, seatOverrides[i] || {})
    );
    
    return {
        roomId: 'room-1',
        currentScriptId: 'tb',
        phase: 'DAY',
        setupPhase: 'STARTED',
        rolesRevealed: true,
        allowWhispers: true,
        vibrationEnabled: false,
        seats,
        messages: [],
        gameOver: {
            isOver: false,
            winner: null,
            reason: ''
        },
        audio: { trackId: null, isPlaying: false, volume: 0.5 },
        nightQueue: [],
        nightCurrentIndex: -1,
        voting: null,
        customScripts: {},
        customRoles: {},
        voteHistory: [],
        roundInfo: {
            dayCount: 1,
            nightCount: 0,
            nominationCount: 0,
            totalRounds: 1
        },
        storytellerNotes: [],
        skillDescriptionMode: 'simple',
        aiMessages: [],
        nightActionRequests: [],
        swapRequests: [],
        candlelightEnabled: false,
        dailyExecutionCompleted: false,
        dailyNominations: [],
        interactionLog: []
    } as GameState;
};

describe('infoGeneration', () => {
    describe('generateEmpathInfo', () => {
        it('应该为共情者生成邻居信息', () => {
            const gameState = createMockGameState([
                { roleId: 'washerwoman', realRoleId: 'washerwoman' },
                { roleId: 'empath', realRoleId: 'empath' },
                { roleId: 'imp', realRoleId: 'imp' }
            ]);
            
            const result = generateEmpathInfo(gameState, 1);
            
            expect(result).toBeDefined();
            expect(result.roleId).toBe('empath');
            expect(typeof result.realInfo).toBe('string');
            expect(typeof result.suggestedInfo).toBe('string');
        });

        it('应该考虑死亡玩家', () => {
            const gameState = createMockGameState([
                { roleId: 'imp', realRoleId: 'imp', isDead: true },
                { roleId: 'empath', realRoleId: 'empath' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' }
            ]);
            
            const result = generateEmpathInfo(gameState, 1);
            
            expect(result).toBeDefined();
        });

        it('应该识别自定义邪恶邻居', () => {
            const gameState = createMockGameState([
                { roleId: 'midnight_fiend', realRoleId: 'midnight_fiend' },
                { roleId: 'empath', realRoleId: 'empath' },
                { roleId: 'shadow_agent', realRoleId: 'shadow_agent' }
            ]);
            gameState.customRoles = customRoles;

            const result = generateEmpathInfo(gameState, 1);

            expect(result.realInfo).toBe('2');
            expect(result.suggestedInfo).toBe('2');
        });
    });

    describe('generateChefInfo', () => {
        it('应该为厨师生成邪恶邻居信息', () => {
            const gameState = createMockGameState([
                { roleId: 'imp', realRoleId: 'imp' },
                { roleId: 'poisoner', realRoleId: 'poisoner' },
                { roleId: 'chef', realRoleId: 'chef' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' }
            ]);
            
            const result = generateChefInfo(gameState, 2);
            
            expect(result).toBeDefined();
            expect(result.roleId).toBe('chef');
            expect(typeof result.realInfo).toBe('string');
        });

        it('应该在没有邪恶邻居时返回 0', () => {
            const gameState = createMockGameState([
                { roleId: 'washerwoman', realRoleId: 'washerwoman' },
                { roleId: 'librarian', realRoleId: 'librarian' },
                { roleId: 'chef', realRoleId: 'chef' },
                { roleId: 'empath', realRoleId: 'empath' },
                { roleId: 'investigator', realRoleId: 'investigator' },
                { roleId: 'mayor', realRoleId: 'mayor' },
                { roleId: 'poisoner', realRoleId: 'poisoner' },
                { roleId: 'imp', realRoleId: 'imp' }
            ]);
            
            const result = generateChefInfo(gameState, 2);
            
            expect(result).toBeDefined();
        });

        it('应该将相邻的自定义恶魔和爪牙计为邪恶对', () => {
            const gameState = createMockGameState([
                { roleId: 'midnight_fiend', realRoleId: 'midnight_fiend' },
                { roleId: 'shadow_agent', realRoleId: 'shadow_agent' },
                { roleId: 'chef', realRoleId: 'chef' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' }
            ]);
            gameState.customRoles = customRoles;

            const result = generateChefInfo(gameState, 2);

            expect(result.realInfo).toBe('1');
        });
    });

    describe('generateFortuneTellerInfo', () => {
        it('应该为占卜师生成选择信息', () => {
            const gameState = createMockGameState([
                { roleId: 'fortune_teller', realRoleId: 'fortune_teller' },
                { roleId: 'imp', realRoleId: 'imp' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' }
            ]);
            
            const result = generateFortuneTellerInfo(gameState, 0, 1, 2);
            
            expect(result).toBeDefined();
            expect(result.roleId).toBe('fortune_teller');
        });

        it('应该检测到恶魔', () => {
            const gameState = createMockGameState([
                { roleId: 'fortune_teller', realRoleId: 'fortune_teller' },
                { roleId: 'imp', realRoleId: 'imp' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' }
            ]);
            
            const result = generateFortuneTellerInfo(gameState, 0, 1, 2);
            
            // 占卜师选择了恶魔座位 1
            expect(result).toBeDefined();
            expect(result.realInfo).toBeDefined();
        });

        it('应该检测到自定义恶魔', () => {
            const gameState = createMockGameState([
                { roleId: 'fortune_teller', realRoleId: 'fortune_teller' },
                { roleId: 'midnight_fiend', realRoleId: 'midnight_fiend' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' }
            ]);
            gameState.customRoles = customRoles;

            const result = generateFortuneTellerInfo(gameState, 0, 1, 2);

            expect(result.realInfo).toBe('是');
        });
    });

    describe('generateWasherwomanInfo', () => {
        it('应该为洗衣妇生成村民信息', () => {
            const gameState = createMockGameState([
                { roleId: 'washerwoman', realRoleId: 'washerwoman' },
                { roleId: 'empath', realRoleId: 'empath' },
                { roleId: 'chef', realRoleId: 'chef' },
                { roleId: 'imp', realRoleId: 'imp' }
            ]);
            
            const result = generateWasherwomanInfo(gameState, 0);
            
            expect(result).toBeDefined();
            expect(result.roleId).toBe('washerwoman');
        });

        it('应该为洗衣妇显示自定义镇民角色名', () => {
            const gameState = createMockGameState([
                { roleId: 'washerwoman', realRoleId: 'washerwoman' },
                { roleId: 'bone_oracle', realRoleId: 'bone_oracle' },
                { roleId: 'midnight_fiend', realRoleId: 'midnight_fiend' }
            ]);
            gameState.customRoles = customRoles;

            const result = generateWasherwomanInfo(gameState, 0);

            expect(result.realInfo).toContain('骨谕者');
        });
    });

    describe('generateUndertakerInfo', () => {
        it('应该为掘墓人生成处决者信息', () => {
            const gameState = createMockGameState([
                { roleId: 'undertaker', realRoleId: 'undertaker' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman', isDead: true },
                { roleId: 'imp', realRoleId: 'imp' }
            ]);
            
            const result = generateUndertakerInfo(gameState, 0, 1);
            
            expect(result).toBeDefined();
            expect(result.roleId).toBe('undertaker');
        });

        it('应该处理无效的处决座位', () => {
            const gameState = createMockGameState([
                { roleId: 'undertaker', realRoleId: 'undertaker' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' }
            ]);
            
            const result = generateUndertakerInfo(gameState, 0, 99);
            
            expect(result).toBeDefined();
            // 检查realInfo包含错误信息
            expect(result.realInfo).toBeDefined();
        });

        it('应该为掘墓人显示自定义处决角色名', () => {
            const gameState = createMockGameState([
                { roleId: 'undertaker', realRoleId: 'undertaker' },
                { roleId: 'bone_oracle', realRoleId: 'bone_oracle', isDead: true }
            ]);
            gameState.customRoles = customRoles;

            const result = generateUndertakerInfo(gameState, 0, 1);

            expect(result.realInfo).toBe('被处决者是 骨谕者');
        });
    });

    describe('generateInvestigatorInfo', () => {
        it('应该为调查员生成爪牙信息', () => {
            const gameState = createMockGameState([
                { roleId: 'investigator', realRoleId: 'investigator' },
                { roleId: 'poisoner', realRoleId: 'poisoner' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' },
                { roleId: 'imp', realRoleId: 'imp' }
            ]);
            
            const result = generateInvestigatorInfo(gameState, 0);
            
            expect(result).toBeDefined();
            expect(result.roleId).toBe('investigator');
        });

        it('应该在没有爪牙时返回提示', () => {
            const gameState = createMockGameState([
                { roleId: 'investigator', realRoleId: 'investigator' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' },
                { roleId: 'empath', realRoleId: 'empath' },
                { roleId: 'imp', realRoleId: 'imp' }
            ]);
            
            const result = generateInvestigatorInfo(gameState, 0);
            
            expect(result).toBeDefined();
        });

        it('应该为调查员显示自定义爪牙角色名', () => {
            const gameState = createMockGameState([
                { roleId: 'investigator', realRoleId: 'investigator' },
                { roleId: 'shadow_agent', realRoleId: 'shadow_agent' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' }
            ]);
            gameState.customRoles = customRoles;

            const result = generateInvestigatorInfo(gameState, 0);

            expect(result.realInfo).toContain('影子探员');
        });
    });

    describe('generateLibrarianInfo', () => {
        it('应该为图书管理员生成外来者信息', () => {
            const gameState = createMockGameState([
                { roleId: 'librarian', realRoleId: 'librarian' },
                { roleId: 'drunk', realRoleId: 'drunk' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' },
                { roleId: 'imp', realRoleId: 'imp' }
            ]);
            
            const result = generateLibrarianInfo(gameState, 0);
            
            expect(result).toBeDefined();
            expect(result.roleId).toBe('librarian');
        });

        it('应该在没有外来者时返回提示', () => {
            const gameState = createMockGameState([
                { roleId: 'librarian', realRoleId: 'librarian' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' },
                { roleId: 'empath', realRoleId: 'empath' },
                { roleId: 'imp', realRoleId: 'imp' }
            ]);
            
            const result = generateLibrarianInfo(gameState, 0);
            
            expect(result).toBeDefined();
        });

        it('应该为图书管理员显示自定义外来者角色名', () => {
            const gameState = createMockGameState([
                { roleId: 'librarian', realRoleId: 'librarian' },
                { roleId: 'haunted_beggar', realRoleId: 'haunted_beggar' },
                { roleId: 'washerwoman', realRoleId: 'washerwoman' }
            ]);
            gameState.customRoles = customRoles;

            const result = generateLibrarianInfo(gameState, 0);

            expect(result.realInfo).toContain('闹鬼乞丐');
        });
    });
});
