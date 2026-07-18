import { mapTencentLang } from './lang-map.js';
import type { ProviderAdapter, TranslateRequest, TranslateResult } from '../types.js';

const TENCENT_URL = 'https://transmart.qq.com/api/imt';

type TencentResponse = {
  header?: { ret_code?: string; type?: string };
  message?: string;
  auto_translation?: string | string[];
};

export const tencentAdapter: ProviderAdapter = {
  id: 'tencent',

  mapLang(from, to) {
    return { from: mapTencentLang(from), to: mapTencentLang(to) };
  },

  buildRequest(input: TranslateRequest) {
    const { from, to } = this.mapLang(input.from, input.to);

    return {
      url: TENCENT_URL,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          header: {
            fn: 'auto_translation',
            client_key: 'browser-chrome-110.0.0-Windows-1',
            session: '',
            user: '',
          },
          type: 'plain',
          model_category: 'normal',
          source: {
            lang: from || 'auto',
            text_list: [input.text],
          },
          target: {
            lang: to,
          },
        }),
      },
    };
  },

  parseResponse(data: unknown, originalText: string, _mappedTo: string): TranslateResult {
    const res = data as TencentResponse;
    if (res.header?.ret_code && res.header.ret_code !== 'succ') {
      throw new Error(res.message || `Tencent error: ${res.header.ret_code}`);
    }
    const raw = res.auto_translation;
    const text = Array.isArray(raw) ? raw.join('') : (raw ?? '');
    const sameLang = !text || text === originalText;
    return { text, sameLang };
  },
};
