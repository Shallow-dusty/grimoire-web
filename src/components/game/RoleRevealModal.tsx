import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store';
import { TEAM_COLORS } from '../../constants';
import { getRoleDefinition } from '../../lib/scriptRoleUtils';

export const RoleRevealModal: React.FC = () => {
    const { t } = useTranslation();
    const user = useStore(state => state.user);
    // 优化：只订阅需要的字段，减少不必要的重新渲染
    const rolesRevealed = useStore(state => state.gameState?.rolesRevealed);
    const roomId = useStore(state => state.gameState?.roomId);
    const seats = useStore(state => state.gameState?.seats);
    const customRoles = useStore(state => state.gameState?.customRoles);
    const isRoleRevealOpen = useStore(state => state.isRoleRevealOpen);
    const closeRoleReveal = useStore(state => state.closeRoleReveal);
    
    const [isVisible, setIsVisible] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    
    // 追踪 rolesRevealed 的变化，用于检测从 false -> true 的转换
    const prevRolesRevealedRef = useRef<boolean | undefined>(undefined);

    // 获取当前玩家的角色 - 使用 useMemo 优化
    const { role } = useMemo(() => {
        const seat = seats?.find(s => s.userId === user?.id);
        // 使用 seenRoleId 以支持酒鬼/疯子等机制
        // eslint-disable-next-line @typescript-eslint/no-deprecated -- Fallback for backward compatibility
        const rId = seat?.seenRoleId ?? seat?.roleId;
        const r = rId ? getRoleDefinition(rId, customRoles) : null;
        return { role: r };
    }, [customRoles, seats, user?.id]);

    // 监听手动打开请求
    useEffect(() => {
        if (isRoleRevealOpen && !isVisible && !isExiting && countdown === null) {
            setCountdown(3);
            setIsFlipped(false);
        }
    }, [isRoleRevealOpen, isVisible, isExiting, countdown]);

    // 监听自动打开请求 & 状态重置
    useEffect(() => {
        if (!roomId || !user) return;

        const storageKey = `grimoire_last_seen_role_${roomId}_${user.id}`;
        const lastSeenRoleId = localStorage.getItem(storageKey);
        
        // 检测 rolesRevealed 从 false -> true 的变化
        const wasRolesRevealedJustEnabled = rolesRevealed && prevRolesRevealedRef.current === false;

        // 更新 ref
        prevRolesRevealedRef.current = rolesRevealed;

        // 1. 如果 rolesRevealed 为 false，说明游戏重置或未开始，清除"已查看"记录
        if (!rolesRevealed) {
            if (lastSeenRoleId) {
                localStorage.removeItem(storageKey);
            }
            return;
        }

        // 2. 如果 rolesRevealed 刚刚变为 true，或者角色有变化，触发倒计时
        if (role && !isRoleRevealOpen) {
            // 条件1: rolesRevealed 刚从 false 变为 true（新游戏开始）
            // 条件2: 从未看过这个角色（新用户/角色变更）

            const shouldTrigger = wasRolesRevealedJustEnabled || lastSeenRoleId !== role.id;

            if (shouldTrigger && !isVisible && !isExiting && countdown === null) {
                setCountdown(3);
            }
        }
    }, [rolesRevealed, roomId, user?.id, role?.id, isVisible, isExiting, countdown, isRoleRevealOpen, role, user]);

    // 倒计时逻辑
    useEffect(() => {
        if (countdown === null) return;

        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => (c ?? 0) - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            // 倒计时结束 (0)，显示"GAME START"，然后显示卡片
            const timer = setTimeout(() => {
                setCountdown(null);
                setIsVisible(true);
            }, 800); 
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleConfirm = () => {
        if (!roomId || !user || !role) return;
        
        // 标记为已查看当前角色
        const storageKey = `grimoire_last_seen_role_${roomId}_${user.id}`;
        localStorage.setItem(storageKey, role.id);

        // 开始退出动画
        setIsExiting(true);
        
        // 动画结束后销毁组件
        setTimeout(() => {
            setIsVisible(false);
            setIsExiting(false);
            setIsFlipped(false);
            closeRoleReveal(); // 重置 store 状态
        }, 1000);
    };

    // 渲染倒计时
    if (countdown !== null) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={countdown}
                        initial={{ scale: 0.5, opacity: 0, rotateX: -90 }}
                        animate={{ scale: 1.5, opacity: 1, rotateX: 0 }}
                        exit={{ scale: 2, opacity: 0, filter: "blur(10px)" }}
                        transition={{ duration: 0.4, type: "spring", bounce: 0.5 }}
                        className="text-9xl font-cinzel font-bold text-[#d4af37] drop-shadow-[0_0_50px_rgba(212,175,55,0.6)] relative"
                    >
                        {countdown > 0 ? countdown : t('game.roleReveal.gameStart')}
                        <div className="absolute inset-0 text-[#d4af37] blur-lg opacity-50">{countdown > 0 ? countdown : t('game.roleReveal.gameStart')}</div>
                    </motion.div>
                </AnimatePresence>
            </div>
        );
    }

    if (!isVisible || !role) return null;

    const teamColor = TEAM_COLORS[role.team as keyof typeof TEAM_COLORS] || '#9ca3af';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
                    {/* 背景遮罩 */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isExiting ? 0 : 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/90 backdrop-blur-md pointer-events-auto"
                    >
                        <div className="absolute inset-0 bg-[url('/textures/dark-matter.png')] opacity-30"></div>
                    </motion.div>

                    {/* 卡片容器 */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 100 }}
                        animate={isExiting ? {
                            scale: 0.1,
                            x: -window.innerWidth / 2 + 50, // 飞向左下角 (大致位置)
                            y: window.innerHeight / 2 - 50,
                            opacity: 0,
                            rotate: -45
                        } : {
                            scale: 1,
                            x: 0,
                            y: 0,
                            opacity: 1,
                            rotate: 0
                        }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 200, 
                            damping: 20,
                            duration: isExiting ? 0.8 : 0.6
                        }}
                        className="relative w-[340px] h-[520px] perspective-[1200px] pointer-events-auto cursor-pointer group"
                        onClick={() => !isFlipped && setIsFlipped(true)}
                    >
                        <motion.div
                            className="w-full h-full relative transform-style-3d transition-all duration-700 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                        >
                            {/* 正面 (封面) */}
                            <div className="absolute inset-0 backface-hidden rounded-sm border-[3px] border-[#44403c] bg-[#1c1917] flex flex-col items-center justify-center overflow-hidden">
                                {/* 纹理层 */}
                                <div className="absolute inset-0 bg-[url('/textures/dark-leather.png')] opacity-60"></div>
                                <div className="absolute inset-0 bg-gradient-to-br from-[#292524] via-transparent to-black opacity-80"></div>
                                
                                {/* 装饰边框 */}
                                <div className="absolute inset-3 border border-[#57534e] opacity-50 rounded-sm"></div>
                                <div className="absolute inset-5 border border-[#44403c] opacity-30 rounded-sm"></div>

                                {/* 中心图标 */}
                                <motion.div 
                                    animate={{ 
                                        scale: [1, 1.05, 1],
                                        boxShadow: ["0 0 20px rgba(212,175,55,0.1)", "0 0 40px rgba(212,175,55,0.3)", "0 0 20px rgba(212,175,55,0.1)"]
                                    }}
                                    transition={{ repeat: Infinity, duration: 3 }}
                                    className="w-40 h-40 rounded-full border-4 border-[#57534e] flex items-center justify-center mb-10 bg-[#0c0a09] relative z-10 shadow-2xl"
                                >
                                    <div className="absolute inset-0 rounded-full border border-[#78716c] opacity-30 m-1"></div>
                                    <span className="text-7xl filter drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">👁️</span>
                                </motion.div>
                                
                                <h2 className="text-4xl font-cinzel font-bold text-[#d6d3d1] tracking-[0.2em] z-10 text-center px-4 drop-shadow-lg">
                                    {t('game.roleReveal.yourIdentity')}
                                </h2>
                                <div className="w-16 h-1 bg-[#57534e] my-4 z-10 rounded-full opacity-50"></div>
                                <p className="text-[#a8a29e] font-serif italic z-10 tracking-wide text-sm">{t('game.roleReveal.clickToOpen')}</p>
                            </div>

                            {/* 背面 (角色详情) */}
                            <div 
                                className="absolute inset-0 backface-hidden rotate-y-180 rounded-sm border-[3px] overflow-hidden flex flex-col bg-[#1c1917]"
                                style={{ borderColor: teamColor }}
                            >
                                {/* 顶部背景图 */}
                                <div className="h-40 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[#0c0a09]"></div>
                                    <div 
                                        className="absolute inset-0 opacity-40 bg-cover bg-center mix-blend-overlay"
                                        style={{ backgroundImage: `url('/img/roles/${role.id}.png')`, backgroundColor: teamColor }}
                                    ></div>
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1c1917]/50 to-[#1c1917]"></div>
                                    
                                    {/* 角色图标 */}
                                    <div className="absolute bottom-0 left-0 right-0 flex justify-center translate-y-1/3 z-20">
                                        <div 
                                            className="w-24 h-24 rounded-full border-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-center text-5xl bg-[#1c1917] relative"
                                            style={{ borderColor: teamColor, color: teamColor }}
                                        >
                                            {role.icon ?? '❓'}
                                        </div>
                                    </div>
                                </div>

                                {/* 内容区域 */}
                                <div className="flex-1 pt-14 px-8 pb-8 flex flex-col items-center text-center relative z-10">
                                    <div className="absolute inset-0 bg-[url('/textures/dark-matter.png')] opacity-10 pointer-events-none"></div>
                                    
                                    <h3 className="text-3xl font-bold font-cinzel mb-2 tracking-wide drop-shadow-md" style={{ color: teamColor }}>
                                        {role.name}
                                    </h3>
                                    <span className="text-xs px-3 py-1 rounded-full border border-[#44403c] text-[#78716c] mb-6 uppercase tracking-[0.2em] bg-[#0c0a09]/50">
                                        {role.team}
                                    </span>

                                    <div className="flex-1 flex items-center justify-center w-full">
                                        <div className="relative p-4 w-full">
                                            <span className="absolute top-0 left-0 text-4xl text-[#292524] font-serif leading-none">“</span>
                                            <p className="text-[#d6d3d1] font-serif leading-relaxed text-lg italic px-2">
                                                {role.ability}
                                            </p>
                                            <span className="absolute bottom-0 right-0 text-4xl text-[#292524] font-serif leading-none">”</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleConfirm();
                                        }}
                                        className="mt-6 w-full py-3.5 rounded-sm bg-[#292524] hover:bg-[#44403c] border border-[#57534e] text-[#e7e5e4] font-cinzel font-bold tracking-widest transition-all duration-300 flex items-center justify-center gap-3 group shadow-lg hover:shadow-[#d4af37]/10"
                                    >
                                        <span>{t('game.roleReveal.acknowledged')}</span>
                                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
        </AnimatePresence>
    );
};



