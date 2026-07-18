# Builtin site skip rules (MultCat)

Only **skip / exclude** selectors. No Immersive-style “include where to translate” rules.

Edit [`builtin-site-rules.json`](./builtin-site-rules.json) and open a PR:

```json
{
  "matches": ["example.com", "*.example.com"],
  "excludeSelectors": ["nav", "code", "pre", ".sidebar"]
}
```

Runtime: `resolveBuiltinSiteRules(hostname)` → merged with `BUILTIN_SKIP_SELECTORS` and user rules in `translationSkipStorage`.
