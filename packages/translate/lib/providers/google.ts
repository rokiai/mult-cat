import { mapGoogleLang } from './lang-map.js';
import type { ProviderAdapter, TranslateRequest, TranslateResult } from '../types.js';

const GOOGLE_URL = 'https://translate.googleapis.com/translate_a/single';

type GoogleResponse = {
  src?: string;
  sentences?: Array<{ trans?: string }>;
};

export const googleAdapter: ProviderAdapter = {
  id: 'google',

  mapLang(from, to) {
    return { from: mapGoogleLang(from), to: mapGoogleLang(to) };
  },

  buildRequest(input: TranslateRequest) {
    const { from, to } = this.mapLang(input.from, input.to);
    const params = new URLSearchParams({
      client: 'gtx',
      dt: 't',
      dj: '1',
      ie: 'UTF-8',
      sl: from,
      tl: to,
      q: input.text,
    });

    return {
      url: `${GOOGLE_URL}?${params.toString()}`,
      init: {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    };
  },

  parseResponse(data: unknown, originalText: string, mappedTo: string): TranslateResult {
    const res = data as GoogleResponse;
    const text = (res.sentences ?? []).map(s => s.trans ?? '').join('');
    const sameLang = !text || text === originalText || (!!res.src && res.src === mappedTo);

    return { text, sameLang };
  },
};
