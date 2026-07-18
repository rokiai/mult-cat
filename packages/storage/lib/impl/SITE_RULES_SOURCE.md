# Builtin site skip rules (MultCat)

Only **skip / exclude** selectors. No Immersive-style “include where to translate” rules.

## Runtime source

1. **Prefer remote** (cached 24h in `chrome.storage.local`):
   `https://raw.githubusercontent.com/rokiai/mult-cat/main/packages/storage/lib/impl/builtin-site-rules.json`
2. **Fallback**: bundled [`builtin-site-rules.json`](./builtin-site-rules.json) when cache is empty or remote fetch fails / times out (~3s).

Background refreshes on install / startup; content scripts and the settings page call `loadBuiltinSiteRules()` and may request `REFRESH_BUILTIN_SITE_RULES`.

`resolveBuiltinSiteRules(hostname, rules)` merges matched exclude selectors with `BUILTIN_SKIP_SELECTORS` and user rules in `translationSkipStorage`.

## Contribute

Edit [`builtin-site-rules.json`](./builtin-site-rules.json) and open a PR:

```json
{
  "matches": ["example.com", "*.example.com"],
  "excludeSelectors": ["nav", "code", "pre", ".sidebar"]
}
```

After merge to `main`, installed extensions pick up the new rules on the next successful remote refresh (within TTL).
