import { TranslateError } from '../types.js';
import type { DictExplanation, DictPronunciation, DictResult } from '../types.js';

type YoudaoWord = {
  usphone?: string;
  ukphone?: string;
  trs?: Array<{ tr?: Array<{ l?: { i?: string[] } }> }>;
};

type YoudaoPayload = {
  ec?: { word?: YoudaoWord[] };
  simple?: { word?: Array<{ usphone?: string; ukphone?: string }> };
};

type FreeDictPhonetic = { text?: string; audio?: string };
type FreeDictMeaning = {
  partOfSpeech?: string;
  definitions?: Array<{ definition?: string }>;
};
type FreeDictEntry = {
  word?: string;
  phonetic?: string;
  phonetics?: FreeDictPhonetic[];
  meanings?: FreeDictMeaning[];
};

const POS_RE = /^(n|adj|adv|v|vt|vi|prep|conj|pron|num|art|int|aux|web|abbr)\.?\s+/i;

/** Whether text looks like a short dictionary lookup (not a sentence). */
const isDictionaryQuery = (text: string): boolean => {
  const t = text.trim();
  if (!t || t.length > 40) return false;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length > 3) return false;
  if (/[\u4e00-\u9fff]/.test(t) && t.length <= 8) return true;
  return /^[\w''\-.\s]+$/u.test(t);
};

/** Single English word / hyphenated lemma (for IPA dictionary). */
const isSingleEnglishWord = (text: string): boolean => {
  const t = text.trim();
  if (!t || t.length > 40) return false;
  if (/[\u4e00-\u9fff]/.test(t)) return false;
  return /^[A-Za-z]+(?:[''][A-Za-z]+)?(?:-[A-Za-z]+)*$/.test(t);
};

/** English / Latin headword suitable for IPA + TTS (not Chinese source). */
const isEnglishHeadword = (text: string): boolean => {
  const t = text.trim();
  if (!isDictionaryQuery(t)) return false;
  if (/[\u4e00-\u9fff]/.test(t)) return false;
  return /[A-Za-z]/.test(t);
};

/** Pick an English lemma from a translation string like `native; local`. */
const pickEnglishHeadword = (translated: string): string | null => {
  const parts = translated
    .split(/[;；,，、|/]/)
    .map(part => part.replace(POS_RE, '').trim())
    .filter(Boolean);
  for (const part of parts) {
    if (isEnglishHeadword(part)) return part;
  }
  const whole = translated.trim();
  return isEnglishHeadword(whole) ? whole : null;
};

const youdaoVoiceUrl = (text: string, type: 1 | 2 = 2): string =>
  `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text.trim())}&type=${type}`;

const splitPosExplain = (raw: string): { trait: string; explain: string } => {
  const text = raw.trim();
  const match = text.match(POS_RE);
  if (!match) return { trait: '·', explain: text };
  const trait = match[1].toLowerCase().replace(/\.$/, '') + '.';
  return { trait, explain: text.slice(match[0].length).trim() || text };
};

const uniquePronunciations = (list: DictPronunciation[]): DictPronunciation[] => {
  const seen = new Set<string>();
  const out: DictPronunciation[] = [];
  for (const item of list) {
    const key = `${item.region}|${item.symbol}|${item.audioUrl ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
};

const parseYoudao = (data: YoudaoPayload, query: string): DictResult | null => {
  const word = data.ec?.word?.[0];
  const simple = data.simple?.word?.[0];
  const us = (word?.usphone || simple?.usphone || '').trim();
  const uk = (word?.ukphone || simple?.ukphone || '').trim();

  const pronunciations = uniquePronunciations([
    ...(us ? [{ region: 'US', symbol: us, audioUrl: youdaoVoiceUrl(query, 2) }] : []),
    ...(uk ? [{ region: 'UK', symbol: uk, audioUrl: youdaoVoiceUrl(query, 1) }] : []),
  ]);

  const explanations: DictExplanation[] = [];
  for (const group of word?.trs ?? []) {
    for (const tr of group.tr ?? []) {
      for (const line of tr.l?.i ?? []) {
        if (!line?.trim()) continue;
        const { trait, explain } = splitPosExplain(line);
        const existing = explanations.find(e => e.trait === trait);
        if (existing) {
          if (!existing.explains.includes(explain)) existing.explains.push(explain);
        } else {
          explanations.push({ trait, explains: [explain] });
        }
      }
    }
  }

  if (pronunciations.length === 0 && explanations.length === 0) return null;

  const primaryText =
    explanations.map(e => `${e.trait === '·' ? '' : e.trait + ' '}${e.explains.join('；')}`).join(' / ') || query;

  return { query, text: primaryText, pronunciations, explanations };
};

const parseFreeDictionary = (data: FreeDictEntry[], query: string): DictResult | null => {
  const entry = data[0];
  if (!entry) return null;

  const pronunciations: DictPronunciation[] = [];
  for (const p of entry.phonetics ?? []) {
    const symbol = (p.text || entry.phonetic || '').replaceAll('/', '').trim();
    if (!symbol) continue;
    const audio = p.audio?.startsWith('http') ? p.audio : p.audio ? `https:${p.audio}` : youdaoVoiceUrl(query, 2);
    const region = /us/i.test(audio) ? 'US' : /uk|gb/i.test(audio) ? 'UK' : pronunciations.length ? 'UK' : 'US';
    pronunciations.push({ region, symbol, audioUrl: audio || youdaoVoiceUrl(query, 2) });
  }
  if (pronunciations.length === 0 && entry.phonetic) {
    pronunciations.push({
      region: 'US',
      symbol: entry.phonetic.replaceAll('/', '').trim(),
      audioUrl: youdaoVoiceUrl(query, 2),
    });
  }

  const explanations: DictExplanation[] = [];
  for (const meaning of entry.meanings ?? []) {
    const trait = (meaning.partOfSpeech || '·').replace(/\.$/, '') + (meaning.partOfSpeech ? '.' : '');
    const explains = (meaning.definitions ?? [])
      .map(d => d.definition?.trim() ?? '')
      .filter(Boolean)
      .slice(0, 2);
    if (explains.length === 0) continue;
    explanations.push({ trait: trait === '.' ? '·' : trait, explains });
  }

  if (pronunciations.length === 0 && explanations.length === 0) return null;

  return {
    query: entry.word || query,
    text: explanations.map(e => e.explains.join('; ')).join(' / ') || query,
    pronunciations: uniquePronunciations(pronunciations),
    explanations,
  };
};

const lookupYoudao = async (query: string): Promise<DictResult | null> => {
  const url = `https://dict.youdao.com/jsonapi?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new TranslateError(`Youdao dict HTTP ${response.status}`);
  }
  const data = (await response.json()) as YoudaoPayload;
  return parseYoudao(data, query);
};

const lookupFreeDictionary = async (query: string): Promise<DictResult | null> => {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`;
  const response = await fetch(url, { method: 'GET' });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new TranslateError(`FreeDictionary HTTP ${response.status}`);
  }
  const data = (await response.json()) as FreeDictEntry[];
  return parseFreeDictionary(data, query);
};

/**
 * Lookup a short word for phonetics + definitions.
 * Prefer Youdao (EN-ZH); fall back to Free Dictionary API.
 */
const lookupBingDict = async (text: string): Promise<DictResult | null> => {
  const query = text.trim();
  if (!query) return null;

  try {
    const youdao = await lookupYoudao(query);
    if (youdao && (youdao.explanations.length > 0 || youdao.pronunciations.length > 0)) {
      // Fill missing audio / IPA from free dictionary when needed
      if (youdao.pronunciations.length === 0) {
        try {
          const free = await lookupFreeDictionary(query);
          if (free?.pronunciations.length) {
            youdao.pronunciations = free.pronunciations;
          }
        } catch {
          // ignore
        }
      }
      if (youdao.pronunciations.length === 0) {
        youdao.pronunciations = [{ region: 'US', symbol: '', audioUrl: youdaoVoiceUrl(query, 2) }];
      }
      return youdao;
    }
  } catch (error) {
    console.warn('[MultCat] Youdao dict failed', error);
  }

  try {
    const free = await lookupFreeDictionary(query);
    if (!free) return null;
    // Ensure playable audio
    free.pronunciations = free.pronunciations.map(p => ({
      ...p,
      audioUrl: p.audioUrl || youdaoVoiceUrl(query, p.region === 'UK' ? 1 : 2),
    }));
    if (free.pronunciations.length === 0) {
      free.pronunciations = [{ region: 'US', symbol: '', audioUrl: youdaoVoiceUrl(query, 2) }];
    }
    return free;
  } catch (error) {
    console.warn('[MultCat] FreeDictionary failed', error);
    return null;
  }
};

export {
  isDictionaryQuery,
  isSingleEnglishWord,
  isEnglishHeadword,
  pickEnglishHeadword,
  youdaoVoiceUrl,
  lookupBingDict,
};
