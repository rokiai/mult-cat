/** Map extension language codes to provider-specific codes. */

const MICROSOFT_LANG: Record<string, string> = {
  auto: '',
  'zh-CN': 'zh-Hans',
  'zh-TW': 'zh-Hant',
};

const YANDEX_LANG: Record<string, string> = {
  auto: '',
  'zh-CN': 'zh',
  'zh-TW': 'zh',
};

const TENCENT_LANG: Record<string, string> = {
  auto: 'auto',
  'zh-CN': 'zh',
  'zh-TW': 'zh',
};

export const mapGoogleLang = (code: string): string => code;

export const mapMicrosoftLang = (code: string): string => MICROSOFT_LANG[code] ?? code;

export const mapYandexLang = (code: string): string => YANDEX_LANG[code] ?? code;

export const mapTencentLang = (code: string): string => TENCENT_LANG[code] ?? code;
