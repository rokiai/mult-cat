import builtinSiteRulesJson from './builtin-site-rules.json' with { type: 'json' };
import { resolveSiteRules } from './site-rules.js';
import type { SiteRule } from './site-rules.js';

/** Builtin skip rules. Edit `builtin-site-rules.json` and open a PR to contribute. */
const BUILTIN_SITE_RULES = builtinSiteRulesJson as SiteRule[];

const resolveBuiltinSiteRules = (hostname: string) => resolveSiteRules(hostname, BUILTIN_SITE_RULES);

export { BUILTIN_SITE_RULES, resolveBuiltinSiteRules };
