import { SpeakerIcon } from '@extension/ui';
import type { TranslateResult } from '@extension/translate';

const playUrl = (url: string) => {
  try {
    const audio = new Audio(url);
    const play = audio.play();
    if (play && typeof play.catch === 'function') {
      play.catch(() => undefined);
    }
  } catch {
    // ignore
  }
};

type Props = {
  result: TranslateResult;
  meta?: string;
};

/** Popup rich translation / dictionary card (same layout as selection). */
export const RichTranslateResult = ({ result, meta }: Props) => {
  const dict = result.dict;

  if (!dict) {
    return (
      <div className="popup-result">
        {meta ? <div className="popup-result-label">{meta}</div> : null}
        <div className="popup-result-plain">
          <div className="popup-result-body">{result.text}</div>
          {result.audioUrl ? (
            <button type="button" className="popup-audio-btn" title="Play" onClick={() => playUrl(result.audioUrl!)}>
              <SpeakerIcon />
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  const showEngineLine = Boolean(result.text?.trim()) && result.text.trim() !== dict.query.trim();

  return (
    <div className="popup-result popup-result-dict">
      {meta ? <div className="popup-result-label">{meta}</div> : null}
      <div className="popup-dict-word">{dict.query}</div>
      <div className="popup-dict-prons">
        {dict.pronunciations.map(p => (
          <span key={`${p.region}-${p.symbol}-${p.audioUrl}`} className="popup-dict-pron">
            <span className="popup-dict-region">{p.region}</span>
            {p.symbol ? <span className="popup-dict-ipa">/{p.symbol}/</span> : null}
            {p.audioUrl ? (
              <button type="button" className="popup-audio-btn" title="Play" onClick={() => playUrl(p.audioUrl!)}>
                <SpeakerIcon />
              </button>
            ) : null}
          </span>
        ))}
        {dict.pronunciations.length === 0 && result.audioUrl ? (
          <span className="popup-dict-pron">
            <span className="popup-dict-region">US</span>
            <button type="button" className="popup-audio-btn" title="Play" onClick={() => playUrl(result.audioUrl!)}>
              <SpeakerIcon />
            </button>
          </span>
        ) : null}
      </div>
      {showEngineLine ? <div className="popup-dict-engine">{result.text}</div> : null}
      <div className="popup-dict-defs">
        {dict.explanations.length > 0 ? (
          dict.explanations.map(ex => (
            <div key={`${ex.trait}-${ex.explains.join('|')}`} className="popup-dict-row">
              <span className="popup-dict-trait">{ex.trait || '·'}</span>
              <span className="popup-dict-explains">{ex.explains.join('; ')}</span>
            </div>
          ))
        ) : (
          <div className="popup-result-body">{result.text}</div>
        )}
      </div>
    </div>
  );
};
