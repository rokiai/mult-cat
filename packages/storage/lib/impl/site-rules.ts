type SiteRule = {
  /** Host patterns: `*`, `example.com`, `*.example.com`. */
  matches: string[];
  /** Hosts that should not use this rule even if matches. */
  excludeMatches?: string[];
  /** CSS selectors that must not be translated (MultCat skip rules only). */
  excludeSelectors: string[];
};

type ResolvedSiteRules = {
  excludeSelectors: string[];
  matchedRules: SiteRule[];
};

/** Match hostname against patterns (`*`, `example.com`, `*.example.com`). */
const matchHost = (hostname: string, pattern: string): boolean => {
  const host = hostname.trim().toLowerCase();
  const pat = pattern.trim().toLowerCase();
  if (!host || !pat) return false;
  if (pat === '*') return true;
  if (pat.startsWith('*.')) {
    const base = pat.slice(2);
    return host === base || host.endsWith(`.${base}`);
  }
  return host === pat;
};

const ruleMatchesHost = (rule: SiteRule, hostname: string): boolean => {
  const host = hostname.trim().toLowerCase();
  if (rule.excludeMatches?.some(p => matchHost(host, p))) return false;
  return rule.matches.some(p => matchHost(host, p));
};

const unique = (list: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const v = item.trim();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
};

/** Merge builtin skip selectors for a hostname (`*` + site-specific). */
const resolveSiteRules = (hostname: string, rules: readonly SiteRule[]): ResolvedSiteRules => {
  const matched = rules.filter(rule => ruleMatchesHost(rule, hostname));
  return {
    excludeSelectors: unique(matched.flatMap(r => r.excludeSelectors ?? [])),
    matchedRules: matched,
  };
};

/** Human-readable label for Settings (first non-* match, else Global). */
const siteRuleLabel = (rule: SiteRule): string => {
  const nonStar = rule.matches.filter(m => m !== '*');
  if (nonStar.length === 0) return '* (global)';
  return nonStar.slice(0, 3).join(', ') + (nonStar.length > 3 ? '…' : '');
};

export { matchHost, resolveSiteRules, siteRuleLabel };
export type { SiteRule, ResolvedSiteRules };
