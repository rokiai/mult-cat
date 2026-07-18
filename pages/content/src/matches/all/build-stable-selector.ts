/**
 * Build a reasonably stable CSS selector for skip-rule recording.
 *
 * Avoids build-time hashes such as CSS Modules
 * `styles-module__contextCrumbLast__tI2e3` → prefer `[class*="contextCrumbLast"]`.
 */

/** css-loader / vite css-modules: file__local__hash */
const CSS_MODULE_CLASS = /^(?:.+?__)([A-Za-z][\w-]*)__([A-Za-z0-9_-]+)$/;

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
export const extractCssModuleLocalName = (className: string): string | null => {
  const matched = className.match(CSS_MODULE_CLASS);
  if (!matched?.[1]) return null;
  const local = matched[1];
  // Ignore useless locals
  if (local.length < 2 || /^(root|container|wrapper|item)$/i.test(local)) return null;
  return local;
};

const buildStructuralSelector = (el: HTMLElement): string => {
  const parts: string[] = [];
  let current: HTMLElement | null = el;
  let depth = 0;

  while (current && current !== document.body && depth < 4) {
    const parent: HTMLElement | null = current.parentElement;
    if (!parent) break;
    const siblings = Array.from(parent.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement && child.tagName === current!.tagName,
    );
    const index = siblings.indexOf(current) + 1;
    const tag = current.tagName.toLowerCase();
    parts.unshift(siblings.length > 1 ? `${tag}:nth-of-type(${index})` : tag);
    current = parent;
    depth += 1;
  }

  return parts.join(' > ') || el.tagName.toLowerCase();
};

export const buildStableSelector = (el: HTMLElement): string => {
  const tag = el.tagName.toLowerCase();

  if (el.id && /^[A-Za-z][\w-]*$/.test(el.id)) {
    return `#${CSS.escape(el.id)}`;
  }

  for (const attr of ['data-testid', 'data-test', 'data-cy', 'name', 'aria-label'] as const) {
    const value = el.getAttribute(attr);
    if (value && value.length > 0 && value.length < 80) {
      return `${tag}[${attr}="${CSS.escape(value)}"]`;
    }
  }

  const classList = Array.from(el.classList);

  // Prefer CSS Module local name: hash may change across builds, local usually won't
  for (const className of classList) {
    const local = extractCssModuleLocalName(className);
    if (local) {
      return `${tag}[class*="${CSS.escape(local)}"]`;
    }
  }

  // Only keep non-hashed utility / BEM-like classes
  const stableClasses = classList
    .filter(className => !isUnstableClass(className) && !CSS_MODULE_CLASS.test(className) && className.length < 48)
    .slice(0, 2);

  if (stableClasses.length > 0) {
    return `${tag}.${stableClasses.map(className => CSS.escape(className)).join('.')}`;
  }

  return buildStructuralSelector(el);
};
