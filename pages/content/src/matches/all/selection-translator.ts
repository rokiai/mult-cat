import { buildRichResultHtml, playAudioUrl } from './rich-result.js';
import { translateTextViaBackground } from '@extension/shared';
import { translationSettingsStorage } from '@extension/storage';
import type { TranslateResult } from '@extension/translate';

const ROOT_ID = 'ceb-selection-root';
const STYLE_ID = 'ceb-selection-style';

let root: HTMLDivElement | null = null;
let hideTimer: number | null = null;
let lastText = '';

/** Minimum pointer travel (mousedown → mouseup) to treat as drag-select (划词). */
const DRAG_SELECT_MIN_PX = 14;
let pressOrigin: { x: number; y: number } | null = null;

const pointerTravelSq = (event: MouseEvent): number => {
  if (!pressOrigin) return 0;
  const dx = event.clientX - pressOrigin.x;
  const dy = event.clientY - pressOrigin.y;
  return dx * dx + dy * dy;
};

const scheduleHideIfSelectionEmpty = () => {
  if (hideTimer) window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    if (!window.getSelection()?.toString().trim()) hide();
  }, 180);
};

const ensureStyle = () => {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${ROOT_ID} {
      position: fixed;
      z-index: 2147483646;
      max-width: min(380px, calc(100vw - 24px));
      font-family: "SF Pro Display", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Segoe UI", sans-serif;
      color: #0f172a;
      pointer-events: auto;
    }
    #${ROOT_ID} .ceb-sel-card {
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(16px) saturate(1.2);
      -webkit-backdrop-filter: blur(16px) saturate(1.2);
      border: 1px solid rgba(15, 23, 42, 0.08);
      border-radius: 14px;
      box-shadow:
        0 18px 40px rgba(15, 23, 42, 0.16),
        0 2px 6px rgba(15, 23, 42, 0.06);
      overflow: hidden;
    }
    #${ROOT_ID} .ceb-sel-actions {
      display: flex;
      gap: 6px;
      padding: 8px;
    }
    #${ROOT_ID} button {
      appearance: none;
      border: 0;
      cursor: pointer;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      padding: 8px 12px;
      line-height: 1;
    }
    #${ROOT_ID} .ceb-sel-primary {
      background: linear-gradient(135deg, #1677ff, #69b1ff);
      color: #fff;
      box-shadow: 0 8px 18px rgba(22, 119, 255, 0.28);
    }
    #${ROOT_ID} .ceb-sel-ghost {
      background: rgba(15, 23, 42, 0.05);
      color: #334155;
    }
    #${ROOT_ID} .ceb-sel-body {
      padding: 12px 14px 14px;
      border-top: 1px solid rgba(15, 23, 42, 0.06);
    }
    #${ROOT_ID} .ceb-sel-meta {
      font-size: 10px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    #${ROOT_ID} .ceb-sel-word {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.2;
      margin-bottom: 6px;
    }
    #${ROOT_ID} .ceb-sel-engine {
      margin: 6px 0 8px;
      font-size: 14px;
      font-weight: 650;
      line-height: 1.5;
      color: #0f172a;
    }
    #${ROOT_ID} .ceb-sel-prons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 12px;
      margin-bottom: 10px;
    }
    #${ROOT_ID} .ceb-sel-pron {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #64748b;
    }
    #${ROOT_ID} .ceb-sel-region {
      display: inline-flex;
      align-items: center;
      padding: 1px 6px;
      border: 1px solid #d0d5dd;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 650;
      color: #475569;
    }
    #${ROOT_ID} .ceb-sel-ipa {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    #${ROOT_ID} .ceb-sel-audio {
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      width: 24px !important;
      height: 24px !important;
      padding: 0 !important;
      border-radius: 999px !important;
      background: rgba(106, 109, 255, 0.1) !important;
      color: #6a6dff !important;
      line-height: 1 !important;
    }
    #${ROOT_ID} .ceb-sel-audio:hover {
      background: rgba(106, 109, 255, 0.18) !important;
      color: #4f46e5 !important;
    }
    #${ROOT_ID} .ceb-sel-audio svg {
      display: block;
    }
    #${ROOT_ID} .ceb-sel-defs {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    #${ROOT_ID} .ceb-sel-row {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      font-size: 13px;
      line-height: 1.55;
    }
    #${ROOT_ID} .ceb-sel-trait {
      flex-shrink: 0;
      margin-top: 1px;
      padding: 1px 6px;
      border-radius: 4px;
      background: #ecebff;
      color: #5b5bd6;
      font-size: 11px;
      font-weight: 650;
    }
    #${ROOT_ID} .ceb-sel-explains {
      color: #0f172a;
      word-break: break-word;
    }
    #${ROOT_ID} .ceb-sel-head {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    #${ROOT_ID} .ceb-sel-text {
      flex: 1;
      font-size: 13px;
      line-height: 1.55;
      white-space: pre-wrap;
      word-break: break-word;
      color: #0f172a;
    }
    #${ROOT_ID} .ceb-sel-loading {
      font-size: 12px;
      color: #64748b;
    }
  `;
  document.documentElement.appendChild(style);
};

const getRoot = (): HTMLDivElement => {
  ensureStyle();
  if (root && document.documentElement.contains(root)) return root;
  root = document.createElement('div');
  root.id = ROOT_ID;
  // Prevent page bilingual DomTranslator from re-translating this popup.
  root.setAttribute('data-ceb-skip', 'true');
  root.classList.add('notranslate');
  root.setAttribute('translate', 'no');
  document.documentElement.appendChild(root);
  return root;
};

const hide = () => {
  if (hideTimer) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }
  root?.remove();
  root = null;
  lastText = '';
};

const placeNearSelection = (el: HTMLElement) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const rect = selection.getRangeAt(0).getBoundingClientRect();
  const gap = 10;
  let top = rect.bottom + gap;
  let left = rect.left + rect.width / 2;

  el.style.left = '0px';
  el.style.top = '0px';
  const width = el.offsetWidth || 280;
  const height = el.offsetHeight || 48;

  left = Math.min(Math.max(12, left - width / 2), window.innerWidth - width - 12);
  if (top + height > window.innerHeight - 12) {
    top = Math.max(12, rect.top - height - gap);
  }
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
};

const bindAudioButtons = (el: HTMLElement) => {
  el.querySelectorAll<HTMLButtonElement>('[data-ceb-sel="audio"]').forEach(btn => {
    btn.addEventListener('click', event => {
      event.stopPropagation();
      const url = btn.dataset.url;
      if (url) playAudioUrl(url);
    });
  });
};

const renderCard = (opts: {
  mode: 'actions' | 'loading' | 'result' | 'error';
  text?: string;
  meta?: string;
  result?: TranslateResult;
}) => {
  const el = getRoot();
  const meta = opts.meta ?? '';
  if (opts.mode === 'actions') {
    el.innerHTML = `
      <div class="ceb-sel-card">
        <div class="ceb-sel-actions">
          <button type="button" class="ceb-sel-primary" data-ceb-sel="translate">Translate</button>
          <button type="button" class="ceb-sel-ghost" data-ceb-sel="close">✕</button>
        </div>
      </div>
    `;
  } else if (opts.mode === 'loading') {
    el.innerHTML = `
      <div class="ceb-sel-card">
        <div class="ceb-sel-body"><div class="ceb-sel-loading">Translating…</div></div>
      </div>
    `;
  } else if (opts.mode === 'error') {
    const msg = (opts.text ?? 'Failed').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    el.innerHTML = `
      <div class="ceb-sel-card">
        <div class="ceb-sel-body">
          <div class="ceb-sel-meta">Error</div>
          <div class="ceb-sel-text">${msg}</div>
        </div>
      </div>
    `;
  } else {
    const body = opts.result
      ? buildRichResultHtml(opts.result, meta)
      : `<div class="ceb-sel-meta">${meta}</div><div class="ceb-sel-text">${opts.text ?? ''}</div>`;
    el.innerHTML = `
      <div class="ceb-sel-card">
        <div class="ceb-sel-body">${body}</div>
      </div>
    `;
    bindAudioButtons(el);
  }

  el.querySelector('[data-ceb-sel="close"]')?.addEventListener('click', hide);
  el.querySelector('[data-ceb-sel="translate"]')?.addEventListener('click', () => {
    void translateSelection();
  });

  placeNearSelection(el);
};

const translateSelection = async () => {
  const text = lastText.trim();
  if (!text) return;

  renderCard({ mode: 'loading' });
  try {
    const settings = await translationSettingsStorage.get();
    const from = settings.fromLang ?? 'auto';
    const to = settings.toLang ?? 'zh-CN';
    const result = await translateTextViaBackground({
      text,
      from,
      to,
      provider: settings.provider,
      rich: true,
    });
    renderCard({
      mode: 'result',
      result,
      meta: `${from} → ${to}`,
    });
  } catch (error) {
    renderCard({
      mode: 'error',
      text: error instanceof Error ? error.message : String(error),
    });
  }
};

const onMouseDown = (event: MouseEvent) => {
  if (event.button !== 0) return;
  pressOrigin = { x: event.clientX, y: event.clientY };
};

const onMouseUp = async (event: MouseEvent) => {
  if ((event.target as Element | null)?.closest?.(`#${ROOT_ID}`)) {
    pressOrigin = null;
    return;
  }

  const minTravelSq = DRAG_SELECT_MIN_PX * DRAG_SELECT_MIN_PX;
  const draggedToSelect = pressOrigin !== null && pointerTravelSq(event) >= minTravelSq;
  pressOrigin = null;

  const text = window.getSelection()?.toString().trim() ?? '';
  if (!draggedToSelect || !text || text.length < 2) {
    scheduleHideIfSelectionEmpty();
    return;
  }

  const settings = await translationSettingsStorage.get();
  if (settings.selectionTranslateEnabled === false) {
    hide();
    return;
  }

  lastText = text;
  renderCard({ mode: 'actions' });
};

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') hide();
};

const onScroll = () => {
  if (root) hide();
};

export const initSelectionTranslate = (): void => {
  document.addEventListener('mousedown', onMouseDown, true);
  document.addEventListener('mouseup', onMouseUp, true);
  document.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('scroll', onScroll, true);
};
