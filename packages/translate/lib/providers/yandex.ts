import { mapYandexLang } from './lang-map.js';
import type { ProviderAdapter, TranslateRequest, TranslateResult } from '../types.js';

const YANDEX_URL = 'https://translate.yandex.net/api/v1/tr.json/translate';

type YandexResponse = {
  code?: number;
  text?: string[];
};

const requestId = (): string => {
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${uuid.replaceAll('-', '')}-0-0`;
};

export const yandexAdapter: ProviderAdapter = {
  id: 'yandex',

  mapLang(from, to) {
    return { from: mapYandexLang(from), to: mapYandexLang(to) };
  },

  buildRequest(input: TranslateRequest) {
    const { from, to } = this.mapLang(input.from, input.to);
    const lang = from ? `${from}-${to}` : to;
    const params = new URLSearchParams({
      id: requestId(),
      srv: 'tr-url-widget',
      lang,
      text: input.text,
    });

    return {
      url: `${YANDEX_URL}?${params.toString()}`,
      init: {
        method: 'GET',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    };
  },

  parseResponse(data: unknown, originalText: string): TranslateResult {
    const res = data as YandexResponse;
    if (res.code && res.code !== 200) {
      throw new Error(`Yandex error code ${res.code}`);
    }
    const text = (res.text ?? []).join('');
    const sameLang = !text || text === originalText;
    return { text, sameLang };
  },
};
