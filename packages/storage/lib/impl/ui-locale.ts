/** Extension UI locale (Chrome `_locales` folder names). */

type UiLocaleId = 'auto' | 'zh_CN' | 'zh_TW' | 'en' | 'ja' | 'ko' | 'fr' | 'de' | 'es' | 'ru' | 'pt_BR' | 'vi';

type UiLocaleOption = {
  value: UiLocaleId;
  label: string;
};

/** Locales we ship under packages/i18n/locales. */
const UI_LOCALE_OPTIONS: UiLocaleOption[] = [
  { value: 'auto', label: '跟随浏览器 / Auto' },
  { value: 'zh_CN', label: '简体中文' },
  { value: 'zh_TW', label: '繁體中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'ru', label: 'Русский' },
  { value: 'pt_BR', label: 'Português (Brasil)' },
  { value: 'vi', label: 'Tiếng Việt' },
];

const IMPLEMENTED: Exclude<UiLocaleId, 'auto'>[] = [
  'zh_CN',
  'zh_TW',
  'en',
  'ja',
  'ko',
  'fr',
  'de',
  'es',
  'ru',
  'pt_BR',
  'vi',
];

/** Map browser language tag → our locale id. */
const resolveUiLocale = (uiLocale: UiLocaleId | string | undefined): Exclude<UiLocaleId, 'auto'> => {
  if (uiLocale && uiLocale !== 'auto' && IMPLEMENTED.includes(uiLocale as Exclude<UiLocaleId, 'auto'>)) {
    return uiLocale as Exclude<UiLocaleId, 'auto'>;
  }

  const raw = (typeof navigator !== 'undefined' ? navigator.language : 'en').replace('-', '_');
  const lower = raw.toLowerCase();

  if (lower.startsWith('zh')) {
    if (lower.includes('tw') || lower.includes('hk') || lower.includes('hant')) return 'zh_TW';
    return 'zh_CN';
  }

  const exact = IMPLEMENTED.find(id => id.toLowerCase() === lower);
  if (exact) return exact;

  const prefix = lower.split('_')[0] ?? 'en';
  const byPrefix = IMPLEMENTED.find(id => id.toLowerCase() === prefix || id.toLowerCase().startsWith(`${prefix}_`));
  return byPrefix ?? 'en';
};

export { UI_LOCALE_OPTIONS, resolveUiLocale };
export type { UiLocaleId, UiLocaleOption };
