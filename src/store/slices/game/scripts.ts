import { StoreSlice, GameSlice } from '../../types';
import { addSystemMessage } from '../../utils';
import { ROLES } from '@/constants';
import { getScriptDefinition, normalizeRoleTeam } from '@/lib/scriptRoleUtils';
import type { RoleDef, ScriptDefinition } from '@/types';

interface ParsedScriptImport {
    script: ScriptDefinition;
    customRoles: Record<string, RoleDef>;
}

const buildScriptDefinition = (value: {
    id: string;
    name?: string;
    author?: string;
    description?: string;
    roles: string[];
    meta?: Record<string, unknown>;
}): ScriptDefinition => ({
    id: value.id,
    name: value.name?.trim() || value.id,
    author: value.author,
    description: value.description,
    roles: value.roles,
    meta: value.meta,
    isCustom: true,
});

const parseScriptDefinition = (value: unknown): ParsedScriptImport | null => {
    if (!value || typeof value !== 'object') return null;
    const script = value as Partial<ScriptDefinition>;
    if (typeof script.id !== 'string') return null;
    if (!Array.isArray(script.roles)) return null;

    const roles = parseScriptRoleIds(script.roles);
    if (roles.length === 0) return null;

    const customRoles = Object.fromEntries(
        script.roles
            .map(parseRoleDefinition)
            .filter((role): role is RoleDef => Boolean(role))
            .map(role => [role.id, role])
    );

    return {
        script: buildScriptDefinition({
            id: script.id,
            name: typeof script.name === 'string' ? script.name : script.id,
            author: typeof script.author === 'string' ? script.author : undefined,
            description: typeof script.description === 'string' ? script.description : undefined,
            roles,
            meta: script.meta,
        }),
        customRoles,
    };
};

const parseRoleDefinition = (item: unknown): RoleDef | null => {
    if (!item || typeof item !== 'object') return null;
    const record = item as Record<string, unknown>;
    const id = record.id;
    if (typeof id !== 'string' || id === '_meta' || ROLES[id]) return null;

    const team = normalizeRoleTeam(record.team);
    if (!team) return null;

    const name = typeof record.name === 'string' && record.name.trim() ? record.name.trim() : id;
    const ability = typeof record.ability === 'string'
        ? record.ability
        : typeof record.firstNightReminder === 'string'
            ? record.firstNightReminder
            : typeof record.otherNightReminder === 'string'
                ? record.otherNightReminder
                : '';

    return {
        id,
        name,
        team,
        ability,
        detailedDescription: typeof record.ability === 'string' ? record.ability : undefined,
        firstNight: Boolean(record.firstNight || record.firstNightReminder),
        otherNight: Boolean(record.otherNight || record.otherNightReminder),
        icon: typeof record.icon === 'string' ? record.icon : undefined,
        reminders: Array.isArray(record.reminders)
            ? record.reminders.filter((reminder): reminder is string => typeof reminder === 'string')
            : undefined,
    };
};

const parseScriptRoleIds = (items: unknown[]): string[] => items.flatMap((item) => {
    if (typeof item === 'string') return [item];
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const roleId = record.id;
    if (typeof roleId !== 'string' || roleId === '_meta') return [];
    return [roleId];
});

const parseScriptArray = (value: unknown[]): ParsedScriptImport | null => {
    const roles = parseScriptRoleIds(value);
    if (roles.length === 0) return null;

    const metaEntry = value.find((item) => {
        if (!item || typeof item !== 'object') return false;
        const record = item as Record<string, unknown>;
        if (record.id === '_meta') return true;
        return typeof record.name === 'string' && !('id' in record);
    }) as Record<string, unknown> | undefined;

    const name = typeof metaEntry?.name === 'string' ? metaEntry.name : 'Custom Script';
    const author = typeof metaEntry?.author === 'string' ? metaEntry.author : undefined;
    const description = typeof metaEntry?.description === 'string' ? metaEntry.description : undefined;
    const metaId = typeof metaEntry?.id === 'string' && metaEntry.id !== '_meta' ? metaEntry.id : undefined;

    const customRoles = Object.fromEntries(
        value
            .map(parseRoleDefinition)
            .filter((role): role is RoleDef => Boolean(role))
            .map(role => [role.id, role])
    );

    return {
        script: buildScriptDefinition({
            id: metaId ?? `custom_${Date.now()}`,
            name,
            author,
            description,
            roles,
            meta: metaEntry,
        }),
        customRoles,
    };
};

export const createGameScriptsSlice: StoreSlice<Pick<GameSlice, 'setScript' | 'importScript' | 'saveCustomScript' | 'deleteCustomScript' | 'loadCustomScript'>> = (set, get) => ({
    setScript: (scriptId) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                state.gameState.currentScriptId = scriptId;
                const script = getScriptDefinition(scriptId, state.gameState.customScripts);
                addSystemMessage(state.gameState, `剧本已切换为: ${script?.name ?? scriptId}`);
            }
        });
        get().sync();
    },

    importScript: (jsonContent) => {
        if (!get().user?.isStoryteller) return;
        try {
            const parsed: unknown = JSON.parse(jsonContent);
            const result = Array.isArray(parsed)
                ? parseScriptArray(parsed)
                : parseScriptDefinition(parsed);
            if (!result) {
                throw new Error("Invalid script format");
            }
            const { script, customRoles } = result;

            set((state) => {
                if (state.gameState) {
                    state.gameState.customScripts[script.id] = script;
                    Object.assign(state.gameState.customRoles, customRoles);
                }
            });
            get().sync();
        } catch (error) {
            console.error("Import script failed", error);
        }
    },

    saveCustomScript: (script) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                state.gameState.customScripts[script.id] = script;
            }
        });
        get().sync();
    },

    deleteCustomScript: (scriptId) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                const { [scriptId]: _removed, ...rest } = state.gameState.customScripts;
                state.gameState.customScripts = rest;
            }
        });
        get().sync();
    },

    loadCustomScript: (scriptId) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                state.gameState.currentScriptId = scriptId;
            }
        });
        get().sync();
    }
});
