import type { ProviderAdapter, TranslateRequest, TranslateResult } from '../types.js';

const DEFAULT_BASE = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini';

const resolveChatUrl = (apiUrl?: string): string => {
  const base = (apiUrl || DEFAULT_BASE).trim().replace(/\/$/, '');
  if (/\/chat\/completions$/i.test(base)) return base;
  return `${base}/chat/completions`;
};

const langLabel = (code: string): string => {
  if (!code || code === 'auto') return 'the source language (auto-detect)';
  const map: Record<string, string> = {
    en: 'English',
    'zh-CN': 'Simplified Chinese',
    'zh-TW': 'Traditional Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    fr: 'French',
    de: 'German',
    es: 'Spanish',
    ru: 'Russian',
  };
  return map[code] ?? code;
};

type OpenAIChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

export const openaiAdapter: ProviderAdapter = {
  id: 'openai',

  mapLang(from, to) {
    return { from, to };
  },

  buildRequest(input: TranslateRequest) {
    if (!input.apiKey?.trim()) {
      throw new Error('LLM API token is required. Set it in Settings.');
    }

    const { from, to } = this.mapLang(input.from, input.to);
    const system = [
      'You are a professional translator.',
      `Translate the user message from ${langLabel(from)} to ${langLabel(to)}.`,
      'Return ONLY the translation text.',
      'Preserve meaning, tone, and inline placeholders like [0], [1].',
      'Do not wrap the answer in quotes or markdown.',
    ].join(' ');

    return {
      url: resolveChatUrl(input.apiUrl),
      init: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${input.apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: input.model?.trim() || DEFAULT_MODEL,
          temperature: 0.2,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: input.text },
          ],
        }),
      },
    };
  },

  parseResponse(data: unknown, originalText: string): TranslateResult {
    const res = data as OpenAIChatResponse;
    const text = (res.choices?.[0]?.message?.content ?? '').trim();
    const sameLang = !text || text === originalText;
    return { text, sameLang };
  },
};
