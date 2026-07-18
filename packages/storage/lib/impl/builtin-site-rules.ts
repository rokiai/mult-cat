import type { SiteRule } from './site-rules.js';
import { resolveSiteRules } from './site-rules.js';
import builtinSiteRulesJson from './builtin-site-rules.json' with { type: 'json' };

/** Builtin skip rules. Edit `builtin-site-rules.json` and open a PR to contribute. */
export const BUILTIN_SITE_RULES = builtinSiteRulesJson as SiteRule[];

export const resolveBuiltinSiteRules = (hostname: string) =>
  resolveSiteRules(hostname, BUILTIN_SITE_RULES);
