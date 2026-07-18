import { translationSkipStorage } from '@extension/storage';
import { buildStableSelector } from '@src/matches/all/build-stable-selector';

const OVERLAY_ID = 'ceb-skip-pick-overlay';
const HIGHLIGHT_ATTR = 'data-ceb-skip-hover';

type SkipPickResult = {
  selector: string;
  host: string;
};

let active = false;
let hovered: HTMLElement | null = null;

const clearHover = () => {
  if (hovered) {
    hovered.removeAttribute(HIGHLIGHT_ATTR);
    hovered = null;
  }
};

const ensureOverlayStyle = () => {
  if (document.getElementById(OVERLAY_ID)) return;
  const style = document.createElement('style');
  style.id = OVERLAY_ID;
  style.textContent = `
    [${HIGHLIGHT_ATTR}] {
      outline: 2px solid #2563eb !important;
      outline-offset: 2px !important;
      cursor: crosshair !important;
    }
    #ceb-skip-pick-toast {
      position: fixed;
      z-index: 2147483647;
      left: 50%;
      bottom: 24px;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.92);
      color: #fff;
      padding: 8px 14px;
      border-radius: 8px;
      font: 13px/1.4 system-ui, sans-serif;
      pointer-events: none;
    }
  `;
  document.documentElement.appendChild(style);
};

const showToast = (message: string) => {
  document.getElementById('ceb-skip-pick-toast')?.remove();
  const toast = document.createElement('div');
  toast.id = 'ceb-skip-pick-toast';
  toast.textContent = message;
  document.documentElement.appendChild(toast);
  window.setTimeout(() => toast.remove(), 2200);
};

const onMove = (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.id === 'ceb-skip-pick-toast' || target.id === OVERLAY_ID) return;
  if (hovered === target) return;
  clearHover();
  hovered = target;
  hovered.setAttribute(HIGHLIGHT_ATTR, 'true');
};

const stopPickMode = () => {
  if (!active) return;
  active = false;
  document.removeEventListener('mousemove', onMove, true);
  document.removeEventListener('click', onClick, true);
  document.removeEventListener('keydown', onKeyDown, true);
  clearHover();
};

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    stopPickMode();
    showToast('Cancelled skip pick');
  }
};

const onClick = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();

  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    stopPickMode();
    return;
  }

  const selector = buildStableSelector(target);
  const host = location.hostname;
  target.setAttribute('data-ceb-skip', 'true');

  void translationSkipStorage.addForHost(host, selector).then(() => {
    showToast(`Skip saved: ${selector}`);
  });

  stopPickMode();
};

/**
 * Enter element-pick mode to record a per-host skip selector.
 * Popup usually closes after this message; work continues in-page.
 */
export const startSkipPickMode = (): { ok: true } => {
  ensureOverlayStyle();
  if (active) {
    showToast('Click an element to skip (Esc to cancel)');
    return { ok: true };
  }

  active = true;
  document.addEventListener('mousemove', onMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeyDown, true);
  showToast('Click an element to skip · Esc cancel');
  return { ok: true };
};

export const isSkipPickActive = (): boolean => active;

export type { SkipPickResult };
