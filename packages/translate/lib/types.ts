export type ProviderId = 'google' | 'microsoft' | 'yandex' | 'tencent' | 'openai';

export type TranslateRequest = {
  text: string;
  from: string;
  to: string;
  provider: ProviderId;
  /** OpenAI-compatible API token (LLM). */
  apiKey?: string;
  /** Base URL e.g. https://api.openai.com/v1 or full .../chat/completions */
  apiUrl?: string;
  /** Model id e.g. gpt-4o-mini */
  model?: string;
  /**
   * When true (selection / popup), try dictionary detail for short queries.
   * Page bilingual translation should leave this unset/false.
   */
  rich?: boolean;
};

export type DictPronunciation = {
  region: string;
  symbol: string;
  audioUrl?: string;
};

export type DictExplanation = {
  trait: string;
  explains: string[];
};

export type DictResult = {
  query: string;
  text: string;
  pronunciations: DictPronunciation[];
  explanations: DictExplanation[];
};

export type TranslateResult = {
  text: string;
  sameLang: boolean;
  dict?: DictResult;
  /** Fallback TTS URL for plain translation (Youdao). */
  audioUrl?: string;
};

export type BuiltRequest = {
  url: string;
  init: RequestInit;
};

export type ProviderAdapter = {
  id: ProviderId;
  mapLang: (from: string, to: string) => { from: string; to: string };
  buildRequest: (input: TranslateRequest, auth?: string) => BuiltRequest | Promise<BuiltRequest>;
  parseResponse: (data: unknown, originalText: string, mappedTo: string) => TranslateResult;
};

export class TranslateError extends Error {
  constructor(
    message: string,
    readonly provider?: ProviderId,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'TranslateError';
  }
}
