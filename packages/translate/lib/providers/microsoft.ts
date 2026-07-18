import { mapMicrosoftLang } from './lang-map.js';
import type { ProviderAdapter, TranslateRequest, TranslateResult } from '../types.js';

const MICROSOFT_URL = 'https://api-edge.cognitive.microsofttranslator.com/translate';

type MicrosoftItem = {
  translations?: Array<{ text?: string }>;
};

export const microsoftAdapter: ProviderAdapter = {
  id: 'microsoft',

  mapLang(from, to) {
    return { from: mapMicrosoftLang(from), to: mapMicrosoftLang(to) };
  },

  buildRequest(input: TranslateRequest, auth?: string) {
    const { from, to } = this.mapLang(input.from, input.to);
    const params = new URLSearchParams({
      'api-version': '3.0',
      to,
    });
    if (from) {
      params.set('from', from);
    }

    return {
      url: `${MICROSOFT_URL}?${params.toString()}`,
      init: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth ?? ''}`,
        },
        body: JSON.stringify([{ Text: input.text }]),
      },
    };
  },

  parseResponse(data: unknown, originalText: string): TranslateResult {
    const res = data as MicrosoftItem[];
    const text = (res ?? []).map(item => (item.translations ?? []).map(t => t.text ?? '').join('')).join('');
    const sameLang = !text || text === originalText;

    return { text, sameLang };
  },
};
