import builtinSiteRulesJson from './builtin-site-rules.json' with { type: 'json' };
import { resolveSiteRules } from './site-rules.js';
import { createStorage, StorageEnum } from '../base/index.js';
import type { SiteRule } from './site-rules.js';

/** Bundled fallback. Edit `builtin-site-rules.json` and open a PR to contribute. */
const LOCAL_BUILTIN_SITE_RULES = builtinSiteRulesJson as SiteRule[];

/** Prefer this over the GitHub blob page URL — raw JSON for fetch. */
const BUILTIN_SITE_RULES_REMOTE_URL =
  'https://raw.githubusercontent.com/rokiai/mult-cat/main/packages/storage/lib/impl/builtin-site-rules.json';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 3000;

type BuiltinSiteRulesCache = {
  rules: SiteRule[];
  fetchedAt: number;
};

const builtinSiteRulesCacheStorage = createStorage<BuiltinSiteRulesCache | null>('builtin-site-rules-cache-key', null, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === 'string');

const isValidSiteRule = (value: unknown): value is SiteRule => {
  if (!value || typeof value !== 'object') return false;
  const rule = value as Record<string, unknown>;
  if (!isStringArray(rule.matches) || rule.matches.length === 0) return false;
  if (!isStringArray(rule.excludeSelectors)) return false;
  if (rule.excludeMatches !== undefined && !isStringArray(rule.excludeMatches)) return false;
  return true;
};

const parseRemoteRules = (payload: unknown): SiteRule[] | null => {
  if (!Array.isArray(payload) || payload.length === 0) return null;
  if (!payload.every(isValidSiteRule)) return null;
  return payload;
};

const isCacheFresh = (cache: BuiltinSiteRulesCache | null): boolean =>
  Boolean(cache?.rules?.length && Date.now() - cache.fetchedAt < CACHE_TTL_MS);

/**
 * Immediate rules for UI / translation: prefer cached remote, else local JSON.
 * Does not block on network.
 */
const loadBuiltinSiteRules = async (): Promise<SiteRule[]> => {
  const cache = await builtinSiteRulesCacheStorage.get();
  if (cache?.rules?.length) return cache.rules;
  return LOCAL_BUILTIN_SITE_RULES;
};

/** True when cache is missing or older than TTL — callers may kick a background refresh. */
const isBuiltinSiteRulesCacheStale = async (): Promise<boolean> => {
  const cache = await builtinSiteRulesCacheStorage.get();
  return !isCacheFresh(cache);
};

/**
 * Fetch remote JSON into chrome.storage. Returns rules on success, null on failure.
 */
const refreshBuiltinSiteRulesFromRemote = async (): Promise<SiteRule[] | null> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(BUILTIN_SITE_RULES_REMOTE_URL, {
      signal: controller.signal,
      cache: 'no-cache',
    });
    if (!response.ok) return null;
    const payload: unknown = await response.json();
    const rules = parseRemoteRules(payload);
    if (!rules) return null;
    await builtinSiteRulesCacheStorage.set({
      rules,
      fetchedAt: Date.now(),
    });
    return rules;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const resolveBuiltinSiteRules = (hostname: string, rules: readonly SiteRule[] = LOCAL_BUILTIN_SITE_RULES) =>
  resolveSiteRules(hostname, rules);

/** @deprecated Prefer loadBuiltinSiteRules(); kept for sync Options fallback. */
const BUILTIN_SITE_RULES = LOCAL_BUILTIN_SITE_RULES;

export {
  BUILTIN_SITE_RULES,
  BUILTIN_SITE_RULES_REMOTE_URL,
  LOCAL_BUILTIN_SITE_RULES,
  loadBuiltinSiteRules,
  isBuiltinSiteRulesCacheStale,
  refreshBuiltinSiteRulesFromRemote,
  resolveBuiltinSiteRules,
};
export type { BuiltinSiteRulesCache };
