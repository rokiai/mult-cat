import { CUSTOM_LLM_MODEL_VALUE, LLM_VENDORS, getLlmVendor } from './llm-vendors.js';
import { createStorage, StorageEnum } from '../base/index.js';
import type { LlmModelOption, LlmVendorId, LlmVendorOption } from './llm-vendors.js';
import type { UiLocaleId } from './ui-locale.js';
import type { BaseStorageType } from '../base/index.js';

type TranslationProviderId = 'google' | 'microsoft' | 'yandex' | 'tencent' | 'openai';

/** Source language; `auto` = detect. */
type TranslationFromLang = 'auto' | 'en' | 'zh-CN' | 'zh-TW' | 'ja' | 'ko' | 'fr' | 'de' | 'es' | 'ru';

/** Target language (must be concrete). */
type TranslationToLang = 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko' | 'fr' | 'de' | 'es' | 'ru';

type TranslationSettingsType = {
  provider: TranslationProviderId;
  enabled: boolean;
  fromLang: TranslationFromLang;
  toLang: TranslationToLang;
  /** Extension UI language (`auto` = follow browser). */
  uiLocale: UiLocaleId;
  /** Show floating translate UI when text is selected on the page. */
  selectionTranslateEnabled: boolean;
  /** LLM vendor preset (OpenAI / Kimi / …). */
  llmVendor: LlmVendorId;
  /** OpenAI-compatible API token for LLM provider. */
  llmApiKey: string;
  /** API base URL, e.g. https://api.openai.com/v1 */
  llmApiUrl: string;
  /** Model name, e.g. gpt-4o-mini */
  llmModel: string;
};

type TranslationSettingsStorageType = BaseStorageType<TranslationSettingsType> & {
  setProvider: (provider: TranslationProviderId) => Promise<void>;
  setEnabled: (enabled: boolean) => Promise<void>;
  setFromLang: (fromLang: TranslationFromLang) => Promise<void>;
  setToLang: (toLang: TranslationToLang) => Promise<void>;
  setUiLocale: (uiLocale: UiLocaleId) => Promise<void>;
  setSelectionTranslateEnabled: (enabled: boolean) => Promise<void>;
  setLlmVendor: (vendor: LlmVendorId) => Promise<void>;
  setLlmConfig: (
    config: Partial<Pick<TranslationSettingsType, 'llmApiKey' | 'llmApiUrl' | 'llmModel' | 'llmVendor'>>,
  ) => Promise<void>;
  patch: (partial: Partial<TranslationSettingsType>) => Promise<void>;
};

const defaultVendor = getLlmVendor('openai');

const storage = createStorage<TranslationSettingsType>(
  'translation-settings-storage-key',
  {
    provider: 'microsoft',
    enabled: false,
    fromLang: 'auto',
    toLang: 'zh-CN',
    uiLocale: 'auto',
    selectionTranslateEnabled: true,
    llmVendor: defaultVendor.id,
    llmApiKey: '',
    llmApiUrl: defaultVendor.baseUrl,
    llmModel: defaultVendor.defaultModel,
  },
  {
    storageEnum: StorageEnum.Local,
    liveUpdate: true,
  },
);

const translationSettingsStorage: TranslationSettingsStorageType = {
  ...storage,
  setProvider: async provider => {
    await storage.set(current => ({ ...current, provider }));
  },
  setEnabled: async enabled => {
    await storage.set(current => ({ ...current, enabled }));
  },
  setFromLang: async fromLang => {
    await storage.set(current => ({ ...current, fromLang }));
  },
  setToLang: async toLang => {
    await storage.set(current => ({ ...current, toLang }));
  },
  setUiLocale: async uiLocale => {
    await storage.set(current => ({ ...current, uiLocale }));
  },
  setSelectionTranslateEnabled: async selectionTranslateEnabled => {
    await storage.set(current => ({ ...current, selectionTranslateEnabled }));
  },
  setLlmVendor: async vendor => {
    const preset = getLlmVendor(vendor);
    await storage.set(current => ({
      ...current,
      llmVendor: preset.id,
      llmApiUrl: preset.baseUrl,
      llmModel: preset.defaultModel || current.llmModel,
    }));
  },
  setLlmConfig: async config => {
    await storage.set(current => ({ ...current, ...config }));
  },
  patch: async partial => {
    await storage.set(current => ({ ...current, ...partial }));
  },
};

const TRANSLATION_FROM_LANG_OPTIONS: Array<{ value: TranslationFromLang; label: string }> = [
  { value: 'auto', label: 'Auto detect' },
  { value: 'en', label: 'English' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'ru', label: 'Русский' },
];

const TRANSLATION_TO_LANG_OPTIONS: Array<{ value: TranslationToLang; label: string }> = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'ru', label: 'Русский' },
];

const TRANSLATION_PROVIDER_OPTIONS: Array<{
  value: TranslationProviderId;
  label: string;
}> = [
  { value: 'microsoft', label: 'Microsoft' },
  { value: 'google', label: 'Google' },
  { value: 'yandex', label: 'Yandex' },
  { value: 'tencent', label: '腾讯交互翻译' },
  { value: 'openai', label: '大模型 (LLM)' },
];

export {
  translationSettingsStorage,
  TRANSLATION_FROM_LANG_OPTIONS,
  TRANSLATION_TO_LANG_OPTIONS,
  TRANSLATION_PROVIDER_OPTIONS,
  CUSTOM_LLM_MODEL_VALUE,
  LLM_VENDORS,
  getLlmVendor,
};
export type {
  TranslationProviderId,
  TranslationFromLang,
  TranslationToLang,
  TranslationSettingsType,
  TranslationSettingsStorageType,
  LlmVendorId,
  LlmModelOption,
  LlmVendorOption,
};
