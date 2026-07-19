/**
 * Build a reasonably stable CSS selector for skip-rule recording.
 *
 * Prefer short selectors when unique on the page; otherwise tighten with
 * structural `:nth-of-type` ancestors so picking A does not skip B with the
 * same class / CSS Module local name.
 */

/** css-loader / vite css-modules: file__local__hash */
const CSS_MODULE_CLASS = /^(?:.+?__)([A-Za-z][\w-]*)__([A-Za-z0-9_-]+)$/;

const STRUCTURAL_MAX_DEPTH = 6;

const isUnstableClass = (className: string): boolean => {
  if (!className) return true;
  if (className.startsWith('ceb-') || className.startsWith('css-') || className.startsWith('svelte-')) return true;
  if (/^v-/.test(className)) return true;
  // Emotion / styled-components short hashes
  if (/^css-[a-z0-9]+$/i.test(className)) return true;
  if (/^sc-[a-zA-Z0-9]+$/.test(className)) return true;
  // Lone hash tokens
  if (/^[a-f0-9]{6,}$/i.test(className)) return true;
  return false;
};

/**
 * Extract a stable local name from hashed module classes.
 * `styles-module__contextCrumbLast__tI2e3` → `contextCrumbLast`
 */
const extractCssModuleLocalName = (className: string): string | null => {
  const matched = className.match(CSS_MODULE_CLASS);
  if (!matched?.[1]) return null;
  const local = matched[1];
  // Ignore useless locals
  if (local.length < 2 || /^(root|container|wrapper|item)$/i.test(local)) return null;
  return local;
};

const isUniqueSelector = (el: Element, selector: string): boolean => {
  try {
    const matches = document.querySelectorAll(selector);
    return matches.length === 1 && matches[0] === el;
  } catch {
    return false;
  }
};

/** Count how many elements a selector matches (0 on invalid). */
const countSelectorMatches = (selector: string): number => {
  try {
    return document.querySelectorAll(selector).length;
  } catch {
    return 0;
  }
};

const segmentForElement = (current: HTMLElement): string => {
  const parent = current.parentElement;
  const tag = current.tagName.toLowerCase();
  if (!parent) return tag;
  const siblings = Array.from(parent.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement && child.tagName === current.tagName,
  );
  const index = siblings.indexOf(current) + 1;
  return siblings.length > 1 ? `${tag}:nth-of-type(${index})` : tag;
};

/**
 * Structural path from ancestors down toward `el` (does not include `el`).
 */
const buildAncestorPath = (el: HTMLElement, depth: number): string => {
  const parts: string[] = [];
  let current: HTMLElement | null = el.parentElement;
  let walked = 0;

  while (current && current !== document.documentElement && walked < depth) {
    if (current === document.body) {
      parts.unshift(segmentForElement(current));
      break;
    }
    parts.unshift(segmentForElement(current));
    current = current.parentElement;
    walked += 1;
  }

  return parts.join(' > ');
};

const buildStructuralSelector = (el: HTMLElement, maxDepth = STRUCTURAL_MAX_DEPTH): string => {
  const parts: string[] = [];
  let current: HTMLElement | null = el;
  let depth = 0;

  while (current && current !== document.documentElement && depth < maxDepth) {
    parts.unshift(segmentForElement(current));
    if (current === document.body) break;
    current = current.parentElement;
    depth += 1;
  }

  return parts.join(' > ') || el.tagName.toLowerCase();
};

/**
 * If `candidate` uniquely matches `el`, return it.
 * Otherwise try prefixing longer ancestor paths, then fall back to pure structure.
 */
const tightenSelector = (el: HTMLElement, candidate: string): string => {
  if (isUniqueSelector(el, candidate)) return candidate;

  for (let depth = 1; depth <= STRUCTURAL_MAX_DEPTH; depth += 1) {
    const ancestorPath = buildAncestorPath(el, depth);
    if (!ancestorPath) continue;
    const combined = `${ancestorPath} > ${candidate}`;
    if (isUniqueSelector(el, combined)) return combined;
  }

  for (let depth = 1; depth <= STRUCTURAL_MAX_DEPTH; depth += 1) {
    const structural = buildStructuralSelector(el, depth);
    if (isUniqueSelector(el, structural)) return structural;
  }

  return buildStructuralSelector(el);
};

const buildStableSelector = (el: HTMLElement): string => {
  const tag = el.tagName.toLowerCase();

  if (el.id && /^[A-Za-z][\w-]*$/.test(el.id)) {
    const idSelector = `#${CSS.escape(el.id)}`;
    if (isUniqueSelector(el, idSelector)) return idSelector;
  }

  for (const attr of ['data-testid', 'data-test', 'data-cy', 'name', 'aria-label'] as const) {
    const value = el.getAttribute(attr);
    if (value && value.length > 0 && value.length < 80) {
      const attrSelector = `${tag}[${attr}="${CSS.escape(value)}"]`;
      const tightened = tightenSelector(el, attrSelector);
      if (isUniqueSelector(el, tightened)) return tightened;
    }
  }

  const classList = Array.from(el.classList);

  // CSS Modules: full hashed class first (unique when present), then local substring
  for (const className of classList) {
    const local = extractCssModuleLocalName(className);
    if (!local) continue;

    const fullClassSelector = `${tag}.${CSS.escape(className)}`;
    if (isUniqueSelector(el, fullClassSelector)) return fullClassSelector;

    const localSelector = `${tag}[class*="${CSS.escape(local)}"]`;
    const tightenedLocal = tightenSelector(el, localSelector);
    if (isUniqueSelector(el, tightenedLocal)) return tightenedLocal;
  }

  // Only keep non-hashed utility / BEM-like classes
  const stableClasses = classList
    .filter(className => !isUnstableClass(className) && !CSS_MODULE_CLASS.test(className) && className.length < 48)
    .slice(0, 2);

  if (stableClasses.length > 0) {
    const classSelector = `${tag}.${stableClasses.map(className => CSS.escape(className)).join('.')}`;
    return tightenSelector(el, classSelector);
  }

  return tightenSelector(el, tag);
};

export { extractCssModuleLocalName, buildStableSelector, isUniqueSelector, countSelectorMatches };
