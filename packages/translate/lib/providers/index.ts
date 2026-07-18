import { googleAdapter } from './google.js';
import { microsoftAdapter } from './microsoft.js';
import { openaiAdapter } from './openai.js';
import { tencentAdapter } from './tencent.js';
import { yandexAdapter } from './yandex.js';
import type { ProviderAdapter, ProviderId } from '../types.js';

const adapters: Record<ProviderId, ProviderAdapter> = {
  google: googleAdapter,
  microsoft: microsoftAdapter,
  yandex: yandexAdapter,
  tencent: tencentAdapter,
  openai: openaiAdapter,
};

export const getAdapter = (provider: ProviderId): ProviderAdapter => {
  const adapter = adapters[provider];
  if (!adapter) {
    throw new Error(`Unknown translation provider: ${provider}`);
  }
  return adapter;
};

export { googleAdapter, microsoftAdapter, openaiAdapter, tencentAdapter, yandexAdapter };
export { mapGoogleLang, mapMicrosoftLang, mapTencentLang, mapYandexLang } from './lang-map.js';
