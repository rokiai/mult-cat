import { getMicrosoftToken } from './ms-auth.js';
import {
  isEnglishHeadword,
  isSingleEnglishWord,
  lookupBingDict,
  pickEnglishHeadword,
  youdaoVoiceUrl,
} from './providers/bing-dict.js';
import { getAdapter } from './providers/index.js';
import { TranslateError } from './types.js';
import type { DictResult, TranslateRequest, TranslateResult } from './types.js';

const parseJson = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new TranslateError(`Invalid JSON response (${response.status}): ${text.slice(0, 200)}`);
  }
};

const isEnglishTarget = (to: string): boolean => {
  const t = to.trim().toLowerCase();
  return t === 'en' || t.startsWith('en-') || t === 'english';
};

const isChineseTarget = (to: string): boolean => {
  const t = to.trim().toLowerCase();
  return t.startsWith('zh') || t === 'chinese' || t === 'cht' || t === 'chs';
};

const translateViaEngine = async (request: TranslateRequest, text: string): Promise<TranslateResult> => {
  const adapter = getAdapter(request.provider);
  const auth = request.provider === 'microsoft' ? await getMicrosoftToken() : undefined;
  const { url, init } = await adapter.buildRequest(request, auth);
  const response = await fetch(url, init);

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new TranslateError(`${request.provider} HTTP ${response.status}: ${body.slice(0, 200)}`, request.provider);
  }

  const data = await parseJson(response);
  const { to: mappedTo } = adapter.mapLang(request.from, request.to);
  return adapter.parseResponse(data, text, mappedTo);
};

const lookupDictSafe = async (headword: string): Promise<DictResult | null> => {
  try {
    return await lookupBingDict(headword);
  } catch (error) {
    console.warn('[MultCat] dict lookup failed', error);
    return null;
  }
};

/**
 * Translate a single text via the selected provider. Must run in background (has fetch + CORS).
 * When `rich` is set:
 * - Always run the translation engine for the primary line
 * - Single English source word → attach IPA / senses on the source
 * - Target English short result → attach IPA / senses on the translation
 */
export const translate = async (request: TranslateRequest): Promise<TranslateResult> => {
  const text = request.text?.trim() ?? '';
  if (!text) {
    return { text: '', sameLang: true };
  }

  try {
    const result = await translateViaEngine(request, text);

    if (!request.rich) {
      return result;
    }

    // EN → ZH (etc.): enrich single English *source* with phonetics; keep engine Chinese as text
    if (isSingleEnglishWord(text) && !isEnglishTarget(request.to)) {
      const dict = await lookupDictSafe(text);
      if (dict && (dict.explanations.length > 0 || dict.pronunciations.length > 0)) {
        return {
          text: result.text || dict.text,
          sameLang: result.sameLang,
          dict: { ...dict, query: text },
          audioUrl: dict.pronunciations[0]?.audioUrl || youdaoVoiceUrl(text),
        };
      }
      return {
        ...result,
        audioUrl: result.audioUrl || youdaoVoiceUrl(text),
      };
    }

    // ZH → EN: enrich English *translation* with phonetics
    if (isEnglishTarget(request.to)) {
      const englishHead = pickEnglishHeadword(result.text);
      if (englishHead && (isSingleEnglishWord(englishHead) || isEnglishHeadword(englishHead))) {
        const dict = await lookupDictSafe(englishHead);
        if (dict && (dict.explanations.length > 0 || dict.pronunciations.length > 0)) {
          return {
            text: result.text,
            sameLang: result.sameLang,
            dict: { ...dict, query: englishHead },
            audioUrl: dict.pronunciations[0]?.audioUrl || youdaoVoiceUrl(englishHead),
          };
        }
        return {
          ...result,
          audioUrl: result.audioUrl || youdaoVoiceUrl(englishHead),
        };
      }
    }

    // English source phrase (not single word): still allow TTS on source when useful
    if (isEnglishHeadword(text) && isChineseTarget(request.to)) {
      return { ...result, audioUrl: result.audioUrl || youdaoVoiceUrl(text.split(/\s+/)[0] ?? text) };
    }

    return result;
  } catch (error) {
    if (error instanceof TranslateError) throw error;
    throw new TranslateError(error instanceof Error ? error.message : String(error), request.provider, error);
  }
};
