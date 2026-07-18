import { SPEAKER_ICON_SVG } from '@extension/shared';
import type { TranslateResult } from '@extension/translate';

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

/** Shared HTML for selection popup rich result (vanilla DOM). */
export const buildRichResultHtml = (result: TranslateResult, meta: string): string => {
  const audioBtn = (url: string) =>
    url
      ? `<button type="button" class="ceb-sel-audio" data-ceb-sel="audio" data-url="${escapeHtml(url)}" title="Play">${SPEAKER_ICON_SVG}</button>`
      : '';

  const dict = result.dict;
  if (!dict) {
    return `
      <div class="ceb-sel-meta">${escapeHtml(meta)}</div>
      <div class="ceb-sel-head">
        <div class="ceb-sel-text">${escapeHtml(result.text || '(empty)')}</div>
        ${audioBtn(result.audioUrl ?? '')}
      </div>
    `;
  }

  const query = escapeHtml(dict.query);
  const prons = dict.pronunciations
    .map(p => {
      const ipa = p.symbol ? `<span class="ceb-sel-ipa">/${escapeHtml(p.symbol)}/</span>` : '';
      return `<span class="ceb-sel-pron"><span class="ceb-sel-region">${escapeHtml(p.region)}</span>${ipa}${audioBtn(p.audioUrl ?? '')}</span>`;
    })
    .join('');

  const rows = dict.explanations
    .map(ex => {
      const trait = escapeHtml(ex.trait || '·');
      const body = escapeHtml(ex.explains.join('; '));
      return `<div class="ceb-sel-row"><span class="ceb-sel-trait">${trait}</span><span class="ceb-sel-explains">${body}</span></div>`;
    })
    .join('');

  let pronsHtml = prons;
  if (!pronsHtml && result.audioUrl) {
    pronsHtml = `<span class="ceb-sel-pron"><span class="ceb-sel-region">US</span>${audioBtn(result.audioUrl)}</span>`;
  }

  const engineLine =
    result.text?.trim() && result.text.trim() !== dict.query.trim()
      ? `<div class="ceb-sel-engine">${escapeHtml(result.text)}</div>`
      : '';

  return `
    <div class="ceb-sel-meta">${escapeHtml(meta)}</div>
    <div class="ceb-sel-word">${query}</div>
    ${pronsHtml ? `<div class="ceb-sel-prons">${pronsHtml}</div>` : ''}
    ${engineLine}
    <div class="ceb-sel-defs">${rows || `<div class="ceb-sel-text">${escapeHtml(result.text)}</div>`}</div>
  `;
};

export const playAudioUrl = (url: string): void => {
  try {
    const audio = new Audio(url);
    audio.preload = 'auto';
    const play = audio.play();
    if (play && typeof play.catch === 'function') {
      play.catch(error => console.warn('[MultCat] audio play failed', error));
    }
  } catch (error) {
    console.warn('[MultCat] audio play failed', error);
  }
};
