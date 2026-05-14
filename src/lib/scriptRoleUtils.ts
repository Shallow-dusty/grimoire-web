import { ROLES, SCRIPTS } from '@/constants';
import type { GameState, RoleDef, ScriptDefinition, Team } from '@/types';

const TEAM_ALIASES: Record<string, Team> = {
  TOWNSFOLK: 'TOWNSFOLK',
  TOWN: 'TOWNSFOLK',
  OUTSIDER: 'OUTSIDER',
  MINION: 'MINION',
  DEMON: 'DEMON',
  TRAVELER: 'TRAVELER',
  TRAVELLER: 'TRAVELER',
  FABLED: 'FABLED',
};

export function normalizeRoleTeam(value: unknown): Team | null {
  if (typeof value !== 'string') return null;
  const key = value.trim().replace(/[\s-]+/g, '_').toUpperCase();
  return TEAM_ALIASES[key] ?? null;
}

export function getRoleCatalog(customRoles?: Record<string, RoleDef>): Record<string, RoleDef> {
  return { ...ROLES, ...(customRoles ?? {}) };
}

export function getRoleDefinition(
  roleId: string | null | undefined,
  customRoles?: Record<string, RoleDef>
): RoleDef | null {
  if (!roleId) return null;
  return getRoleCatalog(customRoles)[roleId] ?? null;
}

export function getScriptDefinition(
  scriptId: string | null | undefined,
  customScripts?: Record<string, ScriptDefinition>
): ScriptDefinition | null {
  if (!scriptId) return null;
  return SCRIPTS[scriptId] ?? customScripts?.[scriptId] ?? null;
}

export function getScriptRoles(
  scriptId: string | null | undefined,
  customScripts?: Record<string, ScriptDefinition>,
  customRoles?: Record<string, RoleDef>
): RoleDef[] {
  const script = getScriptDefinition(scriptId, customScripts);
  if (!script) return [];

  const roleCatalog = getRoleCatalog(customRoles);
  return script.roles
    .map(roleId => roleCatalog[roleId])
    .filter((role): role is RoleDef => Boolean(role));
}

export function getGameScriptRoles(gameState: GameState): RoleDef[] {
  return getScriptRoles(gameState.currentScriptId, gameState.customScripts, gameState.customRoles);
}
