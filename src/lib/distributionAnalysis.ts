import { Seat, RoleDef, ScriptDefinition } from '../types';
import { getRoleDefinition, getScriptDefinition } from './scriptRoleUtils';

export interface DistributionAnalysisResult {
    isValid: boolean;
    playerCount: number;
    roleCount: number;
    warnings: string[];
    strategyEvaluation: {
        name: string;
        description: string;
        icon: string;
        confidence: number; // 0-1
    };
    composition: {
        townsfolk: number;
        outsider: number;
        minion: number;
        demon: number;
    };
    standardComposition: {
        townsfolk: number;
        outsider: number;
        minion: number;
        demon: number;
    } | null;
}

export interface DistributionAnalysisOptions {
    customRoles?: Record<string, RoleDef>;
    customScripts?: Record<string, ScriptDefinition>;
}

// 角色强度分类（基于暗流涌动剧本）
const ROLE_STRENGTH = {
    strong: ['fortune_teller', 'empath', 'virgin', 'monk', 'soldier'],
    mediumStrong: ['undertaker', 'ravenkeeper', 'investigator', 'chef', 'librarian'],
    medium: ['butler', 'recluse', 'washerwoman', 'saint'],
    misinformation: ['drunk', 'poisoner', 'spy', 'recluse', 'fortune_teller'] // 会产生假信息的角色
};

const STRATEGIES = [
    {
        id: 'balanced',
        name: '平衡打法',
        description: '善恶双方势均力敌，标准开局',
        icon: '⚖️',
        criteria: (roles: string[]) => {
            const strong = roles.filter(r => ROLE_STRENGTH.strong.includes(r)).length;
            const mediumStrong = roles.filter(r => ROLE_STRENGTH.mediumStrong.includes(r)).length;
            return (strong >= 1 && strong <= 2) && (mediumStrong >= 2 && mediumStrong <= 3);
        }
    },
    {
        id: 'evil_favored',
        name: '邪恶优势',
        description: '好人信息较少，邪恶方有强力爪牙',
        icon: '😈',
        criteria: (roles: string[]) => {
            const strong = roles.filter(r => ROLE_STRENGTH.strong.includes(r)).length;
            const misinformation = roles.filter(r => ROLE_STRENGTH.misinformation.includes(r)).length;
            return strong <= 1 && misinformation >= 2;
        }
    },
    {
        id: 'good_favored',
        name: '好人优势',
        description: '好人拥有强力信息位，适合新手',
        icon: '🛡️',
        criteria: (roles: string[]) => {
            const strong = roles.filter(r => ROLE_STRENGTH.strong.includes(r)).length;
            return strong >= 3;
        }
    },
    {
        id: 'chaotic',
        name: '混乱模式',
        description: '充满干扰信息和特殊规则',
        icon: '🌀',
        criteria: (roles: string[]) => {
            const misinformation = roles.filter(r => ROLE_STRENGTH.misinformation.includes(r)).length;
            return misinformation >= 3;
        }
    }
];

export const getStandardComposition = (players: number) => {
    const rules: Record<number, { townsfolk: number; outsider: number; minion: number; demon: number }> = {
        5: { townsfolk: 3, outsider: 0, minion: 1, demon: 1 },
        6: { townsfolk: 3, outsider: 1, minion: 1, demon: 1 },
        7: { townsfolk: 5, outsider: 0, minion: 1, demon: 1 },
        8: { townsfolk: 5, outsider: 1, minion: 1, demon: 1 },
        9: { townsfolk: 5, outsider: 2, minion: 1, demon: 1 },
        10: { townsfolk: 7, outsider: 0, minion: 2, demon: 1 },
        11: { townsfolk: 7, outsider: 1, minion: 2, demon: 1 },
        12: { townsfolk: 7, outsider: 2, minion: 2, demon: 1 },
        13: { townsfolk: 9, outsider: 0, minion: 3, demon: 1 },
        14: { townsfolk: 9, outsider: 1, minion: 3, demon: 1 },
        15: { townsfolk: 9, outsider: 2, minion: 3, demon: 1 }
    };
    // 超出范围时返回 null，调用者需要自己做边界检查
    return rules[players] ?? null;
};

export const analyzeDistribution = (
    seats: Seat[],
    playerCount: number,
    options: DistributionAnalysisOptions = {}
): DistributionAnalysisResult => {
    const warnings: string[] = [];
    
    // 1. 角色数量检查
    // 统计已分配的角色（优先使用 realRoleId，回退到 seenRoleId 以兼容旧数据）
    const assignedRoles = seats
        .map(s => s.realRoleId ?? s.seenRoleId)
        .filter((id): id is string => !!id);
        
    const roleCount = assignedRoles.length;

    if (roleCount !== playerCount) {
        warnings.push(`角色数量 (${String(roleCount)}) 与玩家人数 (${String(playerCount)}) 不匹配`);
    }

    // 2. 团队配比检查
    const composition = {
        townsfolk: 0,
        outsider: 0,
        minion: 0,
        demon: 0
    };

    assignedRoles.forEach(id => {
        const role = getRoleDefinition(id, options.customRoles);
        if (role) {
            if (role.team === 'TOWNSFOLK') composition.townsfolk++;
            else if (role.team === 'OUTSIDER') composition.outsider++;
            else if (role.team === 'MINION') composition.minion++;
            else if (role.team === 'DEMON') composition.demon++;
        }
    });

    const standard = getStandardComposition(playerCount);
    if (standard) {
        if (composition.demon !== standard.demon) warnings.push(`恶魔数量异常: 当前 ${String(composition.demon)} (建议 ${String(standard.demon)})`);
        if (composition.minion !== standard.minion) warnings.push(`爪牙数量异常: 当前 ${String(composition.minion)} (建议 ${String(standard.minion)})`);
        if (composition.outsider !== standard.outsider) warnings.push(`外来者数量异常: 当前 ${String(composition.outsider)} (建议 ${String(standard.outsider)})`);
        // 镇民数量通常是填充位，如果其他都对，镇民不对可能是因为总数不对，已在上面提示
    } else if (playerCount >= 5 && playerCount <= 15) {
        // Should have standard composition but failed to get it? Unlikely with hardcoded map
    } else {
        warnings.push(`当前人数 (${String(playerCount)}) 超出标准规则建议范围 (5-15人)`);
    }

    // 3. 策略评估
    const defaultStrategy = STRATEGIES[0]; // Default to balanced
    if (!defaultStrategy) {
        throw new Error('STRATEGIES array is empty');
    }
    let bestStrategy = defaultStrategy;

    // 简单评分逻辑：满足条件得1分，否则0分。
    // 改进：可以计算匹配度。这里简化处理，按优先级匹配。
    // 优先级：混乱 > 邪恶 > 好人 > 平衡 (默认)
    const chaoticStrategy = STRATEGIES[3];
    const evilStrategy = STRATEGIES[1];
    const goodStrategy = STRATEGIES[2];
    
    if (chaoticStrategy?.criteria(assignedRoles)) bestStrategy = chaoticStrategy; // Chaotic
    else if (evilStrategy?.criteria(assignedRoles)) bestStrategy = evilStrategy; // Evil
    else if (goodStrategy?.criteria(assignedRoles)) bestStrategy = goodStrategy; // Good
    else bestStrategy = defaultStrategy; // Balanced

    return {
        isValid: warnings.length === 0,
        playerCount,
        roleCount,
        warnings,
        strategyEvaluation: {
            name: bestStrategy.name,
            description: bestStrategy.description,
            icon: bestStrategy.icon,
            confidence: 0.8 // 模拟置信度
        },
        composition,
        standardComposition: standard
    };
};

/**
 * 验证分配的有效性
 * 返回验证结果，包括是否有效和错误/警告信息
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    /** 详细的规则检查结果 */
    ruleChecks: RuleCheckResult[];
}

export interface RuleCheckResult {
    rule: string;
    passed: boolean;
    message: string;
    severity: 'error' | 'warning' | 'info';
}

/**
 * 增强的规则合规性检查
 * 检查游戏设置是否符合官方规则
 */
export const checkRuleCompliance = (
    seats: Seat[],
    scriptId: string,
    playerCount: number,
    options: DistributionAnalysisOptions = {}
): RuleCheckResult[] => {
    const checks: RuleCheckResult[] = [];
    const standard = getStandardComposition(playerCount);
    
    // 统计当前分配
    const roleIds = seats.map(s => s.realRoleId ?? s.seenRoleId).filter((id): id is string => !!id);
    const composition = { townsfolk: 0, outsider: 0, minion: 0, demon: 0 };
    const duplicateCheck = new Map<string, number>();
    
    roleIds.forEach(id => {
        duplicateCheck.set(id, (duplicateCheck.get(id) ?? 0) + 1);
        const role = getRoleDefinition(id, options.customRoles);
        if (role) {
            if (role.team === 'TOWNSFOLK') composition.townsfolk++;
            else if (role.team === 'OUTSIDER') composition.outsider++;
            else if (role.team === 'MINION') composition.minion++;
            else if (role.team === 'DEMON') composition.demon++;
        }
    });
    
    // 规则1: 必须有且仅有一个恶魔
    checks.push({
        rule: 'DEMON_COUNT',
        passed: composition.demon === 1,
        message: composition.demon === 0
            ? '游戏必须有一个恶魔角色'
            : composition.demon === 1
                ? '恶魔数量正确 (1个)'
                : `恶魔数量异常: ${String(composition.demon)}个 (应为1个)`,
        severity: composition.demon === 1 ? 'info' : 'error'
    });
    
    // 规则2: 爪牙数量检查
    if (standard) {
        checks.push({
            rule: 'MINION_COUNT',
            passed: composition.minion === standard.minion,
            message: composition.minion === standard.minion
                ? `爪牙数量正确 (${String(standard.minion)}个)`
                : `爪牙数量: ${String(composition.minion)}个 (标准: ${String(standard.minion)}个)`,
            severity: composition.minion === standard.minion ? 'info' : 'warning'
        });

        // 规则3: 外来者数量检查
        checks.push({
            rule: 'OUTSIDER_COUNT',
            passed: composition.outsider === standard.outsider,
            message: composition.outsider === standard.outsider
                ? `外来者数量正确 (${String(standard.outsider)}个)`
                : `外来者数量: ${String(composition.outsider)}个 (标准: ${String(standard.outsider)}个)`,
            severity: composition.outsider === standard.outsider ? 'info' : 'warning'
        });

        // 规则4: 镇民数量检查
        checks.push({
            rule: 'TOWNSFOLK_COUNT',
            passed: composition.townsfolk === standard.townsfolk,
            message: composition.townsfolk === standard.townsfolk
                ? `镇民数量正确 (${String(standard.townsfolk)}个)`
                : `镇民数量: ${String(composition.townsfolk)}个 (标准: ${String(standard.townsfolk)}个)`,
            severity: composition.townsfolk === standard.townsfolk ? 'info' : 'warning'
        });
    }
    
    // 规则5: 不应有重复角色
    const duplicates = Array.from(duplicateCheck.entries()).filter(([, count]) => count > 1);
    checks.push({
        rule: 'NO_DUPLICATES',
        passed: duplicates.length === 0,
        message: duplicates.length === 0
            ? '无重复角色'
            : `发现重复角色: ${duplicates.map(([id]) => getRoleDefinition(id, options.customRoles)?.name ?? id).join(', ')}`,
        severity: duplicates.length === 0 ? 'info' : 'error'
    });
    
    // 规则6: 所有座位都应分配角色
    // 只检查有玩家或虚拟玩家的座位，如果没有这样的座位则检查所有座位
    const activeSeats = seats.filter(s => s.userId ?? s.isVirtual);
    const seatsToCheck = activeSeats.length > 0 ? activeSeats : seats;
    const unassignedCount = seatsToCheck.filter(s => !(s.realRoleId ?? s.seenRoleId)).length;
    checks.push({
        rule: 'ALL_ASSIGNED',
        passed: unassignedCount === 0,
        message: unassignedCount === 0
            ? '所有座位已分配角色'
            : `${String(unassignedCount)}个座位未分配角色`,
        severity: unassignedCount === 0 ? 'info' : 'warning'
    });
    
    // 规则7: 角色应属于当前剧本
    const script = getScriptDefinition(scriptId, options.customScripts);
    if (script) {
        const scriptRoleSet = new Set(script.roles);
        const invalidRoles = roleIds.filter(id => !scriptRoleSet.has(id));
        checks.push({
            rule: 'SCRIPT_ROLES',
            passed: invalidRoles.length === 0,
            message: invalidRoles.length === 0
                ? '所有角色属于当前剧本'
                : `以下角色不属于当前剧本: ${invalidRoles.map(id => getRoleDefinition(id, options.customRoles)?.name ?? id).join(', ')}`,
            severity: invalidRoles.length === 0 ? 'info' : 'warning'
        });
    }
    
    // 规则8: 玩家数量检查
    // 如果没有活跃座位（测试情况），使用传入的 playerCount
    const activePlayerLength = seats.filter(s => s.userId ?? s.isVirtual).length;
    const activePlayerCount = activePlayerLength > 0 ? activePlayerLength : playerCount;
    checks.push({
        rule: 'PLAYER_COUNT',
        passed: activePlayerCount >= 5 && activePlayerCount <= 15,
        message: activePlayerCount >= 5 && activePlayerCount <= 15
            ? `玩家数量合适 (${String(activePlayerCount)}人)`
            : activePlayerCount < 5
                ? `玩家数量过少 (${String(activePlayerCount)}人, 最少5人)`
                : `玩家数量过多 (${String(activePlayerCount)}人, 最多15人)`,
        severity: (activePlayerCount >= 5 && activePlayerCount <= 15) ? 'info' : 'error'
    });
    
    // 规则9: 检查特殊角色限制 (如男爵增加外来者)
    const hasGodfather = roleIds.includes('godfather');
    const hasBaron = roleIds.includes('baron');
    const hasDrunk = roleIds.includes('drunk');
    const hasLunatic = roleIds.includes('lunatic');
    const hasMarionette = roleIds.includes('marionette');
    
    if (hasBaron && standard) {
        const expectedOutsiders = standard.outsider + 2;
        checks.push({
            rule: 'BARON_OUTSIDERS',
            passed: composition.outsider === expectedOutsiders,
            message: composition.outsider === expectedOutsiders
                ? `男爵效果: 外来者+2 已正确调整`
                : `男爵在场时, 外来者应为 ${String(expectedOutsiders)}个 (当前: ${String(composition.outsider)}个)`,
            severity: composition.outsider === expectedOutsiders ? 'info' : 'warning'
        });
    }
    if (hasGodfather && standard) {
        // 教父可能减少外来者
        checks.push({
            rule: 'GODFATHER_EFFECT',
            passed: true,
            message: '教父在场: 注意可能影响外来者数量',
            severity: 'info'
        });
    }
    
    // 规剃10: 检查“表里不一”角色 (酒鬼/疑子/魔偶)
    if (hasDrunk || hasLunatic || hasMarionette) {
        const misledRoles: string[] = [];
        if (hasDrunk) misledRoles.push('酒鬼');
        if (hasLunatic) misledRoles.push('疑子');
        if (hasMarionette) misledRoles.push('魔偶');
        
        checks.push({
            rule: 'MISLED_ROLES',
            passed: true,
            message: `存在“表里不一”角色: ${misledRoles.join(', ')} - 他们看到的角色与真实身份不同`,
            severity: 'info'
        });
    }
    
    return checks;
};

export const validateDistribution = (
    seats: Seat[],
    scriptId: string,
    playerCount: number,
    options: DistributionAnalysisOptions = {}
): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const ruleChecks = checkRuleCompliance(seats, scriptId, playerCount, options);
    
    // 从规则检查结果中提取错误和警告
    ruleChecks.forEach(check => {
        if (!check.passed) {
            if (check.severity === 'error') {
                errors.push(check.message);
            } else if (check.severity === 'warning') {
                warnings.push(check.message);
            }
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        ruleChecks
    };
};

/**
 * 建议分配修复方案
 */
export const suggestDistributionFixes = (
    seats: Seat[],
    scriptId: string,
    playerCount: number,
    options: DistributionAnalysisOptions = {}
): string[] => {
    const validation = validateDistribution(seats, scriptId, playerCount, options);
    
    if (validation.isValid) {
        return [];
    }
    
    const suggestions: string[] = [];
    const standard = getStandardComposition(playerCount);
    
    // 根据规则检查结果生成建议
    validation.ruleChecks.forEach(check => {
        if (!check.passed) {
            if (check.rule === 'DEMON_COUNT') {
                if (check.message.includes('必须有')) {
                    suggestions.push('建议添加一个恶魔角色（如小鬼）');
                } else if (check.message.includes('异常')) {
                    suggestions.push('建议移除多余的恶魔角色');
                }
            }
            if (check.rule === 'MINION_COUNT' && standard) {
                const match = /爪牙数量:\s*(\d+)/.exec(check.message);
                const current = match?.[1] ? parseInt(match[1], 10) : 0;
                if (current < standard.minion) {
                    suggestions.push(`建议添加爪牙角色至 ${String(standard.minion)} 个`);
                } else if (current > standard.minion) {
                    suggestions.push(`建议移除多余的爪牙角色，保留 ${String(standard.minion)} 个`);
                }
            }
            if (check.rule === 'NO_DUPLICATES') {
                suggestions.push('建议移除重复角色，确保每个角色只出现一次');
            }
            if (check.rule === 'ALL_ASSIGNED') {
                suggestions.push('建议为所有座位分配角色');
            }
        }
    });
    
    return suggestions;
};
