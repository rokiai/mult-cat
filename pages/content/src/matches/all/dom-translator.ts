import { translateTextViaBackground } from '@extension/shared';
import {
  BUILTIN_SKIP_SELECTORS,
  isBuiltinSiteRulesCacheStale,
  loadBuiltinSiteRules,
  resolveBuiltinSiteRules,
  translationSettingsStorage,
  translationSkipStorage,
} from '@extension/storage';
import type { ProviderId } from '@extension/translate';

const BILINGUAL_ATTR = 'data-ceb-bilingual';
const BLOCK_ATTR = 'data-ceb-translated';
const CUSTOM_TAG = 'ceb-bilingual';

/** Semantic tags that are almost always translation units. */
const SEMANTIC_BLOCK_SELECTOR = [
  'p',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'dd',
  'blockquote',
  'figcaption',
  'td',
  'th',
  'caption',
  'summary',
  'dt',
].join(',');

/**
 * Tags that are often inline by default but sites restyle as block/flex/grid
 * (e.g. <span style="display:flex">).
 */
const STYLED_BLOCK_CANDIDATE_SELECTOR = [
  'div',
  'span',
  'a',
  'label',
  'section',
  'article',
  'main',
  'header',
  'footer',
  'aside',
  'nav',
  'ul',
  'ol',
].join(',');

/** Computed display values treated as layout / paragraph hosts. */
const BLOCKISH_DISPLAY = new Set([
  'block',
  'flex',
  'inline-flex',
  'grid',
  'inline-grid',
  'list-item',
  'table-cell',
  'table-caption',
  'flow-root',
  'inline-block',
]);

const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEMPLATE',
  'SVG',
  'MATH',
  'IMG',
  'VIDEO',
  'AUDIO',
  'IFRAME',
  'CANVAS',
  'INPUT',
  'TEXTAREA',
  'SELECT',
  'BUTTON',
  'CODE',
  'PRE',
  'KBD',
  'SAMP',
]);

/** Inline nodes preserved as placeholders (not walked for text). Links are walked so their text is translated. */
const KEEP_TAGS = new Set(['CODE', 'IMG', 'BR', 'SVG', 'MATH', 'KBD', 'SAMP']);

const tagUpper = (el: Element): string => el.tagName.toUpperCase();

const CONCURRENCY = 4;
const MIN_TEXT_LENGTH = 2;
/** Prefer inline only when both source and translation stay roughly this short. */
const INLINE_SOURCE_MAX = 36;
const INLINE_TRANS_MAX = 48;
/** Preload blocks slightly outside the viewport. */
const VIEWPORT_ROOT_MARGIN = '240px 0px';
const MUTATION_SCAN_DEBOUNCE_MS = 200;

type ExtractedBlock = {
  element: HTMLElement;
  plainText: string;
  placeholders: Node[];
  maskedText: string;
};

type BilingualLayout = 'inline' | 'block' | 'flex-row' | 'grid-row';

const getDisplay = (el: HTMLElement): string => window.getComputedStyle(el).display;

const isBlockishDisplay = (display: string): boolean => BLOCKISH_DISPLAY.has(display);

const getLineHeightPx = (el: HTMLElement): number => {
  const style = window.getComputedStyle(el);
  const lh = style.lineHeight;
  if (lh === 'normal') {
    return (parseFloat(style.fontSize) || 14) * 1.2;
  }
  const parsed = parseFloat(lh);
  return Number.isFinite(parsed) ? parsed : (parseFloat(style.fontSize) || 14) * 1.2;
};

/** Host visually occupies about one line before we inject translation. */
const isSingleLineHost = (el: HTMLElement): boolean => {
  const height = el.getBoundingClientRect().height;
  if (height <= 0) return true;
  return height <= getLineHeightPx(el) * 1.75;
};

/**
 * Line-box budget: walk up past inline ancestors to the nearest width-bearing box.
 * Shrink-wrapped spans have no useful width of their own.
 */
const hasInlineRoom = (host: HTMLElement, plainText: string, translated: string): boolean => {
  const style = window.getComputedStyle(host);
  const fontSize = parseFloat(style.fontSize) || 14;
  const estimate = (text: string) => {
    let w = 0;
    for (const ch of text) {
      w += /[\u4e00-\u9fff]/.test(ch) ? fontSize : fontSize * 0.55;
    }
    return w;
  };

  let container: HTMLElement | null = host;
  while (container) {
    const d = getDisplay(container);
    if (d !== 'inline' && d !== 'contents') break;
    container = container.parentElement;
  }

  const containerWidth =
    container?.getBoundingClientRect().width || host.ownerDocument.documentElement.clientWidth || window.innerWidth;

  if (containerWidth < 8) return true;

  const needed = estimate(plainText) + estimate(` ${translated}`) + fontSize;
  return needed < containerWidth * 0.92;
};

const SEMANTIC_PREFER_BLOCK = /^(P|H[1-6]|LI|BLOCKQUOTE|DD|DT|FIGCAPTION|TD|TH)$/;
/** Nav / label chips — even if CSS sets display:block, short text reads better inline. */
const COMPACT_LABEL_TAGS = /^(SPAN|A|LABEL)$/;

const isInlineLevelDisplay = (display: string): boolean =>
  display === 'inline' || display === 'inline-block' || display === 'contents';

/**
 * Decide inline vs newline from host layout + geometry + text length.
 * Breadcrumb / nav chips (short span|a|label, often flex+padding) must stay inline —
 * do not require singleLine (padding inflates height and falsely triggers flex-row).
 */
const chooseBilingualLayout = (host: HTMLElement, plainText: string, translated: string): BilingualLayout => {
  const display = getDisplay(host);
  const singleLine = isSingleLineHost(host);
  const shortEnough =
    plainText.length <= INLINE_SOURCE_MAX && translated.length <= INLINE_TRANS_MAX && !plainText.includes('\n');

  // Short crumb/label text → always side-by-side (Dashboard 仪表板)
  if (COMPACT_LABEL_TAGS.test(host.tagName) && shortEnough) {
    return 'inline';
  }

  // Short list wrappers that still slipped through as host
  if (/^(LI|DT|DD)$/.test(host.tagName) && shortEnough) {
    return 'inline';
  }

  // Breadcrumb-like components (GitHub etc.)
  const component = host.getAttribute('data-component') ?? '';
  if (/breadcrumb/i.test(component) && shortEnough) {
    return 'inline';
  }

  // True inline / inline-block
  if (isInlineLevelDisplay(display)) {
    if (plainText.length > 80) return 'block';
    return 'inline';
  }

  // Short flex chip: inline sibling beats a full-row flex child (avoids wrap)
  if ((display === 'flex' || display === 'inline-flex') && shortEnough) {
    return 'inline';
  }

  if (display === 'flex' || display === 'inline-flex') return 'flex-row';
  if (display === 'grid' || display === 'inline-grid') return 'grid-row';

  if (!singleLine) return 'block';
  if (SEMANTIC_PREFER_BLOCK.test(host.tagName) && plainText.length > 20) return 'block';

  if (shortEnough && hasInlineRoom(host, plainText, translated)) {
    return 'inline';
  }

  return 'block';
};

const applyBilingualLayout = (node: HTMLElement, layout: BilingualLayout): void => {
  node.setAttribute('data-ceb-display', layout);
  node.style.flex = '';
  node.style.width = '';
  node.style.gridColumn = '';
  node.style.marginTop = '';
  node.style.marginLeft = '';

  switch (layout) {
    case 'flex-row':
      node.style.display = 'block';
      node.style.flex = '0 0 100%';
      node.style.width = '100%';
      node.style.marginTop = '0.35em';
      break;
    case 'grid-row':
      node.style.display = 'block';
      node.style.gridColumn = '1 / -1';
      node.style.marginTop = '0.35em';
      break;
    case 'inline':
      node.style.display = 'inline';
      node.style.marginLeft = '0.35em';
      node.style.lineHeight = 'inherit';
      break;
    case 'block':
    default:
      node.style.display = 'block';
      node.style.marginTop = '0.35em';
      break;
  }
};

/**
 * If we guessed inline but injection clearly wrapped the host to extra lines,
 * flip to block (measure-then-correct).
 * Skip compact label tags — their inline bilingual is intentional (Guide 指南).
 */
const refineInlineIfWrapped = (host: HTMLElement, node: HTMLElement, heightBefore: number): void => {
  if (node.getAttribute('data-ceb-display') !== 'inline') return;
  if (COMPACT_LABEL_TAGS.test(host.tagName) || isInlineLevelDisplay(getDisplay(host))) return;

  const heightAfter = host.getBoundingClientRect().height;
  const line = getLineHeightPx(host);
  if (heightAfter > heightBefore + line * 0.85) {
    applyBilingualLayout(node, 'block');
  }
};

const isVisible = (el: HTMLElement): boolean => {
  if (el.closest(`[${BILINGUAL_ATTR}]`)) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0 || el.offsetParent !== null;
};

const isMostlyChinese = (text: string): boolean => {
  const chars = text.replace(/\s/g, '');
  if (!chars) return false;
  const chinese = (chars.match(/[\u4e00-\u9fff]/g) ?? []).length;
  return chinese / chars.length > 0.5;
};

const isSkippableText = (text: string, toLang = 'zh-CN'): boolean => {
  const trimmed = text.trim();
  if (trimmed.length < MIN_TEXT_LENGTH) return true;
  if (/^[\d\s\p{P}\p{S}]+$/u.test(trimmed)) return true;
  // Raw HTML leaked from <noscript> / templates — never send to translator
  if (/<\/?[a-z][\w:-]*\b[^>]*>/i.test(trimmed)) return true;
  // Skip already-target-language content (zh pages when translating to zh)
  if (toLang.startsWith('zh') && isMostlyChinese(trimmed)) return true;
  return false;
};

const isInsideSkip = (el: Element): boolean => {
  let node: Element | null = el;
  while (node) {
    if (SKIP_TAGS.has(tagUpper(node)) || node.hasAttribute(BILINGUAL_ATTR)) return true;
    if (tagUpper(node) === CUSTOM_TAG.toUpperCase()) return true;
    node = node.parentElement;
  }
  return false;
};

const matchesAnySelector = (el: Element, selectors: readonly string[]): boolean => {
  for (const selector of selectors) {
    try {
      if (el.matches(selector) || el.closest(selector)) return true;
    } catch {
      // invalid user selector — ignore
    }
  }
  return false;
};

const loadSkipSelectors = async (): Promise<string[]> => {
  const host = location.hostname;
  const rules = await loadBuiltinSiteRules();
  const site = resolveBuiltinSiteRules(host, rules);
  const custom = await translationSkipStorage.listForHost(host);

  // Stale-while-revalidate: kick background refresh without blocking translation.
  void isBuiltinSiteRulesCacheStale().then(stale => {
    if (!stale) return;
    try {
      chrome.runtime.sendMessage({ type: 'REFRESH_BUILTIN_SITE_RULES' }, () => {
        void chrome.runtime.lastError;
      });
    } catch {
      // Extension context may be unavailable on some pages.
    }
  });

  return [...BUILTIN_SKIP_SELECTORS, ...site.excludeSelectors, ...custom];
};

const isExcludedByRules = (el: Element, selectors: readonly string[]): boolean => matchesAnySelector(el, selectors);

const elementOwnTextLength = (el: HTMLElement): number => {
  let length = 0;
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      length += (child.textContent ?? '').trim().length;
    }
  }
  return length;
};

/**
 * True if a descendant is itself a blockish text host — then we translate the
 * descendant instead of this ancestor (avoids nested duplicate translation).
 */
const hasBlockishTextDescendant = (el: HTMLElement): boolean => {
  for (const child of Array.from(el.querySelectorAll<HTMLElement>('*'))) {
    if (isInsideSkip(child)) continue;
    if (!isBlockishDisplay(getDisplay(child))) continue;
    const text = (child.innerText ?? child.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (text.length >= MIN_TEXT_LENGTH) return true;
  }
  return false;
};

/**
 * Breadcrumb / menu wrappers like <li><a><span>Dashboard</span></a></li>.
 * Translating the <li> forces block layout; prefer the inner a/span instead.
 */
const isThinLabelWrapper = (el: HTMLElement): boolean => {
  if (!/^(LI|DT|DD)$/.test(el.tagName)) return false;
  const text = (el.innerText ?? '').replace(/\s+/g, ' ').trim();
  if (text.length < MIN_TEXT_LENGTH || text.length > INLINE_SOURCE_MAX) return false;
  // Nested real content → keep as normal list item
  if (el.querySelector('p, ul, ol, h1, h2, h3, h4, h5, h6, table, li')) return false;
  // Must wrap a compact label host
  return !!el.querySelector('a, span, label');
};

/** Allow selecting inner a/span even when nested in a thin semantic wrapper (li). */
const isInsideBlockingSemantic = (el: HTMLElement): boolean => {
  const ancestor = el.closest(SEMANTIC_BLOCK_SELECTOR);
  if (!ancestor || !(ancestor instanceof HTMLElement)) return false;
  if (ancestor === el) return false;
  return !isThinLabelWrapper(ancestor);
};

/**
 * Leaf translation hosts:
 * 1) semantic blocks (p/li/h*) that contain no nested semantic block
 * 2) styled block/flex/grid hosts (span/div/…) that are leaves among blockish nodes
 * 3) short inline labels (including inside thin breadcrumb <li>)
 */
const queryLeafBlocks = (root: ParentNode = document, skipSelectors: readonly string[] = []): HTMLElement[] => {
  const seen = new Set<HTMLElement>();
  const results: HTMLElement[] = [];

  const push = (el: HTMLElement) => {
    if (seen.has(el)) return;
    if (isInsideSkip(el)) return;
    if (isExcludedByRules(el, skipSelectors)) return;
    if (el.hasAttribute(BLOCK_ATTR)) return;
    if (!isVisible(el)) return;
    seen.add(el);
    results.push(el);
  };

  for (const el of Array.from(root.querySelectorAll<HTMLElement>(SEMANTIC_BLOCK_SELECTOR))) {
    if (el.querySelector(SEMANTIC_BLOCK_SELECTOR)) continue;
    // Skip breadcrumb-like <li><a>Dashboard</a></li> — translate the link/span instead
    if (isThinLabelWrapper(el)) continue;
    push(el);
  }

  for (const el of Array.from(root.querySelectorAll<HTMLElement>(STYLED_BLOCK_CANDIDATE_SELECTOR))) {
    if (seen.has(el)) continue;
    if (isInsideBlockingSemantic(el)) continue;

    const display = getDisplay(el);
    if (!isBlockishDisplay(display)) continue;
    if (hasBlockishTextDescendant(el)) continue;

    const text = (el.innerText ?? '').replace(/\s+/g, ' ').trim();
    if (text.length < MIN_TEXT_LENGTH && elementOwnTextLength(el) < MIN_TEXT_LENGTH) continue;

    push(el);
  }

  for (const el of Array.from(root.querySelectorAll<HTMLElement>('span, a, label'))) {
    if (seen.has(el)) continue;
    if (isInsideBlockingSemantic(el)) continue;
    if (results.some(host => host.contains(el))) continue;

    const display = getDisplay(el);
    // Accept inline labels, and also block/flex short crumbs inside thin wrappers
    const text = (el.innerText ?? '').replace(/\s+/g, ' ').trim();
    if (text.length < MIN_TEXT_LENGTH || text.length > INLINE_SOURCE_MAX) continue;

    if (isInlineLevelDisplay(display)) {
      if (el.querySelector('span, a, label, div, p, li, h1, h2, h3, h4, h5, h6')) continue;
      push(el);
      continue;
    }

    // Short compact host inside breadcrumb li (display may be flex/block)
    if (COMPACT_LABEL_TAGS.test(el.tagName) && !hasBlockishTextDescendant(el)) {
      push(el);
    }
  }

  return results;
};

const extractWithPlaceholders = (element: HTMLElement, toLang = 'zh-CN'): ExtractedBlock | null => {
  const placeholders: Node[] = [];
  const parts: string[] = [];

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      parts.push(node.textContent ?? '');
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;
    if (el.hasAttribute(BILINGUAL_ATTR) || tagUpper(el) === CUSTOM_TAG.toUpperCase()) return;

    const tag = tagUpper(el);

    // Never extract script/style/noscript/template content (would leak raw HTML as text).
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEMPLATE') {
      return;
    }

    // Hidden fallback / aria-hidden decorative nodes
    if (el.getAttribute('aria-hidden') === 'true' || el.hidden) {
      if (KEEP_TAGS.has(tag)) {
        const index = placeholders.length;
        placeholders.push(el.cloneNode(true));
        parts.push(`[${index}]`);
      }
      return;
    }

    if (KEEP_TAGS.has(tag)) {
      const index = placeholders.length;
      placeholders.push(el.cloneNode(true));
      parts.push(`[${index}]`);
      return;
    }

    // Skip empty void / media nodes; never treat SVG path etc. as text hosts
    if (el.childNodes.length === 0) {
      return;
    }

    el.childNodes.forEach(walk);
  };

  element.childNodes.forEach(walk);

  const maskedText = parts.join('').replace(/\s+/g, ' ').trim();
  const plainText = maskedText
    .replace(/\[\d+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (isSkippableText(plainText, toLang)) return null;

  return { element, plainText, placeholders, maskedText };
};

const restorePlaceholders = (translated: string, placeholders: Node[]): DocumentFragment => {
  const fragment = document.createDocumentFragment();
  const pattern = /\[(\d+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(translated)) !== null) {
    if (match.index > lastIndex) {
      fragment.appendChild(document.createTextNode(translated.slice(lastIndex, match.index)));
    }
    const idx = Number(match[1]);
    const node = placeholders[idx];
    if (node) {
      fragment.appendChild(node.cloneNode(true));
    } else {
      fragment.appendChild(document.createTextNode(match[0]));
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < translated.length) {
    fragment.appendChild(document.createTextNode(translated.slice(lastIndex)));
  }

  return fragment;
};

/**
 * Build bilingual node; layout is chosen by {@link chooseBilingualLayout}.
 */
const createBilingualNode = (
  host: HTMLElement,
  translated: string,
  placeholders: Node[],
  plainText: string,
): HTMLElement => {
  const node = document.createElement(CUSTOM_TAG);
  node.setAttribute(BILINGUAL_ATTR, 'true');
  node.style.opacity = '0.85';
  node.style.color = 'inherit';
  node.appendChild(restorePlaceholders(translated, placeholders));

  const layout = chooseBilingualLayout(host, plainText, translated);
  applyBilingualLayout(node, layout);
  return node;
};

export class DomTranslator {
  private running = false;
  private generation = 0;
  private intersectionObserver: IntersectionObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private mutationTimer: number | null = null;
  private queue: HTMLElement[] = [];
  private queued = new WeakSet<HTMLElement>();
  private activeWorkers = 0;
  private skipSelectors: string[] = [];
  private provider: ProviderId = 'google';
  private fromLang = 'auto';
  private toLang = 'zh-CN';

  get isEnabled(): boolean {
    return this.running;
  }

  async start(): Promise<void> {
    this.restore();
    this.running = true;
    const generation = ++this.generation;
    this.queued = new WeakSet<HTMLElement>();
    this.queue = [];
    this.activeWorkers = 0;

    const settings = await translationSettingsStorage.get();
    if (!this.running || generation !== this.generation) return;

    this.provider = settings.provider as ProviderId;
    this.fromLang = settings.fromLang ?? 'auto';
    this.toLang = settings.toLang ?? 'zh-CN';
    this.skipSelectors = await loadSkipSelectors();

    this.intersectionObserver = new IntersectionObserver(
      entries => {
        if (!this.running || generation !== this.generation) return;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target;
          if (!(el instanceof HTMLElement)) continue;
          this.intersectionObserver?.unobserve(el);
          this.enqueue(el, generation);
        }
      },
      { root: null, rootMargin: VIEWPORT_ROOT_MARGIN, threshold: 0.01 },
    );

    this.observeLeaves(document, generation);

    this.mutationObserver = new MutationObserver(mutations => {
      if (!this.running || generation !== this.generation) return;
      let shouldScan = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldScan = true;
          break;
        }
      }
      if (!shouldScan) return;
      if (this.mutationTimer) window.clearTimeout(this.mutationTimer);
      this.mutationTimer = window.setTimeout(() => {
        this.mutationTimer = null;
        if (!this.running || generation !== this.generation) return;
        this.observeLeaves(document, generation);
      }, MUTATION_SCAN_DEBOUNCE_MS);
    });
    this.mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  private observeLeaves(root: ParentNode, generation: number): void {
    if (!this.running || generation !== this.generation || !this.intersectionObserver) return;
    for (const el of queryLeafBlocks(root, this.skipSelectors)) {
      if (el.hasAttribute(BLOCK_ATTR)) continue;
      if (this.queued.has(el)) continue;
      this.intersectionObserver.observe(el);
    }
  }

  private enqueue(el: HTMLElement, generation: number): void {
    if (!this.running || generation !== this.generation) return;
    if (el.hasAttribute(BLOCK_ATTR) || this.queued.has(el)) return;
    this.queued.add(el);
    this.queue.push(el);
    this.pump(generation);
  }

  private pump(generation: number): void {
    while (this.activeWorkers < CONCURRENCY && this.queue.length > 0) {
      if (!this.running || generation !== this.generation) return;
      const el = this.queue.shift();
      if (!el || el.hasAttribute(BLOCK_ATTR)) continue;
      this.activeWorkers += 1;
      void this.translateElement(el, generation).finally(() => {
        this.activeWorkers -= 1;
        this.pump(generation);
      });
    }
  }

  private async translateElement(el: HTMLElement, generation: number): Promise<void> {
    if (!this.running || generation !== this.generation) return;
    if (el.hasAttribute(BLOCK_ATTR)) return;
    if (!isVisible(el) || isExcludedByRules(el, this.skipSelectors)) return;

    const block = extractWithPlaceholders(el, this.toLang);
    if (!block) return;

    try {
      const result = await translateTextViaBackground({
        text: block.maskedText,
        from: this.fromLang,
        to: this.toLang,
        provider: this.provider,
      });

      if (!this.running || generation !== this.generation) return;
      if (result.sameLang || !result.text.trim()) return;
      if (el.hasAttribute(BLOCK_ATTR)) return;

      const heightBefore = el.getBoundingClientRect().height;
      const bilingual = createBilingualNode(el, result.text, block.placeholders, block.plainText);
      el.setAttribute(BLOCK_ATTR, 'true');
      el.appendChild(bilingual);
      refineInlineIfWrapped(el, bilingual, heightBefore);
    } catch (error) {
      console.warn('[CEB] translate block failed', error);
    }
  }

  restore(): void {
    this.running = false;
    this.generation += 1;
    this.queue = [];
    this.activeWorkers = 0;
    this.queued = new WeakSet<HTMLElement>();

    if (this.mutationTimer) {
      window.clearTimeout(this.mutationTimer);
      this.mutationTimer = null;
    }
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;

    document.querySelectorAll(`[${BILINGUAL_ATTR}]`).forEach(node => node.remove());
    document.querySelectorAll(`[${BLOCK_ATTR}]`).forEach(node => node.removeAttribute(BLOCK_ATTR));
  }
}

export const domTranslator = new DomTranslator();
