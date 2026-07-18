import type { UiLocaleId } from '@extension/storage';

type GuideStep = {
  title: string;
  body: string;
};

type Copy = {
  brandName: string;
  brandTagline: string;
  pageTitle: string;
  pageDesc: string;
  engineTitle: string;
  engineType: string;
  llmVendor: string;
  llmModel: string;
  llmModelTip: string;
  customModel: string;
  customModelPlaceholder: string;
  apiToken: string;
  apiTokenTip: string;
  apiBaseUrl: string;
  apiBaseUrlTip: string;
  selectionTranslate: string;
  selectionTranslateTip: string;
  languageTitle: string;
  uiLocale: string;
  uiLocaleTip: string;
  fromLang: string;
  fromLangTip: string;
  toLang: string;
  currentPair: string;
  appearanceTitle: string;
  theme: string;
  themeLight: string;
  themeDark: string;
  skipTitle: string;
  skipDesc: string;
  skipBuiltin: string;
  skipGlobal: string;
  skipSite: string;
  skipAdd: string;
  skipEmpty: string;
  skipNoSite: string;
  skipExport: string;
  skipImport: string;
  skipExportOk: string;
  skipImportOk: string;
  skipImportFail: string;
  guideTitle: string;
  guideDesc: string;
  guideSteps: GuideStep[];
  welcomeTitle: string;
  welcomeDesc: string;
  guideQuickTitle: string;
  tipTitle: string;
  tipBody: string;
  tipAction: string;
  navGuide: string;
  navLanguage: string;
  navEngine: string;
  navAppearance: string;
  navSkip: string;
  navChangelog: string;
  navAbout: string;
  aboutTitle: string;
  aboutBody: string;
  aboutGithub: string;
  aboutFeedback: string;
  changelogTitle: string;
  changelogHint: string;
  builtinSitesTitle: string;
  builtinSitesDesc: string;
  builtinSitesEmpty: string;
};

const en: Copy = {
  brandName: 'MultCat',
  brandTagline: 'AI Translator',
  pageTitle: 'Settings',
  pageDesc: 'Configure translation engine, interface language, appearance, and skip rules.',
  engineTitle: 'Translation engine',
  engineType: 'Engine',
  llmVendor: 'LLM vendor',
  llmModel: 'Model',
  llmModelTip: 'Pick a preset model, or choose a custom model id.',
  customModel: 'Custom model ID…',
  customModelPlaceholder: 'Enter model id, e.g. gpt-4o-mini',
  apiToken: 'API Token',
  apiTokenTip: 'OpenAI-compatible Bearer token. Stored locally only.',
  apiBaseUrl: 'API Base URL',
  apiBaseUrlTip: 'Filled when you switch vendor; you can override it.',
  selectionTranslate: 'Selection translate',
  selectionTranslateTip: 'Show a translate button when you select text on a page',
  languageTitle: 'Language',
  uiLocale: 'Interface language',
  uiLocaleTip: 'Language for this settings page and the popup UI',
  fromLang: 'Source language',
  fromLangTip: 'Use Auto detect for unknown pages',
  toLang: 'Target language',
  currentPair: 'Current pair',
  appearanceTitle: 'Appearance',
  theme: 'Theme',
  themeLight: 'Light',
  themeDark: 'Dark',
  skipTitle: 'Skip rules',
  skipDesc: 'CSS selectors that should not be translated. Built-in rules always apply.',
  skipBuiltin: 'Built-in',
  skipGlobal: 'Global selectors',
  skipSite: 'Per-site rules',
  skipAdd: 'Add',
  skipEmpty: 'None yet',
  skipNoSite: 'No site rules',
  skipExport: 'Export',
  skipImport: 'Import',
  skipExportOk: 'Skip rules exported',
  skipImportOk: 'Skip rules merged',
  skipImportFail: 'Could not import skip rules. Check the JSON file.',
  guideTitle: 'Usage guide',
  guideDesc: 'Quick start for MultCat.',
  guideSteps: [
    {
      title: 'Pick an engine',
      body: 'Google / Microsoft / Yandex / Tencent, or an OpenAI-compatible LLM.',
    },
    {
      title: 'Set languages',
      body: 'Choose source (or Auto) and target. UI language is separate.',
    },
    {
      title: 'Bilingual page',
      body: 'Popup → Translate page. Scroll to load more. Restore anytime.',
    },
    {
      title: 'Selection translate',
      body: 'Select text for quick lookup with IPA and audio on short words.',
    },
    {
      title: 'Skip areas',
      body: 'Pick elements in Popup, or add CSS selectors here / via PR JSON.',
    },
    {
      title: 'Shortcuts',
      body: 'In Popup text box: ⌘ / Ctrl + Enter to translate.',
    },
  ],
  welcomeTitle: 'Welcome to MultCat!',
  welcomeDesc: 'Make world languages accessible — bilingual pages, selection lookup, and multi-engine support.',
  guideQuickTitle: 'Quick start',
  tipTitle: 'Tip',
  tipBody: 'Prefer a clean UI language and a reliable free engine first, then plug in an LLM if you need it.',
  tipAction: 'Language settings',
  navGuide: 'Guide',
  navLanguage: 'Language',
  navEngine: 'Engine',
  navAppearance: 'Appearance',
  navSkip: 'Skip areas',
  navChangelog: 'Changelog',
  navAbout: 'About',
  aboutTitle: 'About MultCat',
  aboutBody:
    'Free bilingual translator for Chrome for non-commercial use (PolyForm Noncommercial). Settings stay local. Contribute skip rules via builtin-site-rules.json.',
  aboutGithub: 'GitHub repository',
  aboutFeedback: 'Report an issue',
  changelogTitle: 'Changelog',
  changelogHint: 'Recent MultCat releases. Full notes also live in the repo CHANGELOG.md.',
  builtinSitesTitle: 'Builtin skip rules',
  builtinSitesDesc:
    'Prefer remote rules from the MultCat GitHub repo (cached 24h). Falls back to the bundled JSON if offline. Contribute via PR to builtin-site-rules.json.',
  builtinSitesEmpty: 'No builtin rules',
};

const zh_CN: Copy = {
  brandName: 'MultCat',
  brandTagline: '多语翻译猫',
  pageTitle: '设置',
  pageDesc: '配置翻译引擎、本地语言、外观与免翻规则。',
  engineTitle: '翻译引擎',
  engineType: '引擎类型',
  llmVendor: '大模型厂商',
  llmModel: '模型',
  llmModelTip: '可选择厂商预设模型，或填写自定义模型 ID。',
  customModel: '自定义模型 ID…',
  customModelPlaceholder: '输入自定义模型 ID，例如 gpt-4o-mini',
  apiToken: 'API Token',
  apiTokenTip: 'OpenAI 兼容接口的 Bearer token，仅保存在本地',
  apiBaseUrl: 'API Base URL',
  apiBaseUrlTip: '切换厂商会自动填充；也可手动改成兼容网关地址',
  selectionTranslate: '划词翻译',
  selectionTranslateTip: '在页面选中文字时显示翻译按钮',
  languageTitle: '语言设置',
  uiLocale: '本地语言',
  uiLocaleTip: '设置页与弹窗等扩展界面的显示语言',
  fromLang: '原文语言',
  fromLangTip: '未知页面可使用自动检测',
  toLang: '翻译目标语言',
  currentPair: '当前语言对',
  appearanceTitle: '外观设置',
  theme: '主题',
  themeLight: '浅色',
  themeDark: '深色',
  skipTitle: '免翻区域',
  skipDesc: '不翻译的 CSS 选择器。内置规则始终生效。',
  skipBuiltin: '内置',
  skipGlobal: '全局选择器',
  skipSite: '按站点规则',
  skipAdd: '添加',
  skipEmpty: '暂无',
  skipNoSite: '暂无站点规则',
  skipExport: '导出',
  skipImport: '导入',
  skipExportOk: '已导出免翻规则',
  skipImportOk: '已合并导入免翻规则',
  skipImportFail: '导入失败，请检查 JSON 文件格式',
  guideTitle: '使用教程',
  guideDesc: 'MultCat 快速上手。',
  guideSteps: [
    {
      title: '选择引擎',
      body: 'Google / Microsoft / Yandex / 腾讯，或 OpenAI 兼容大模型。',
    },
    {
      title: '设置语言',
      body: '选择原文（可自动）与目标语言；界面语言单独配置。',
    },
    {
      title: '双语对照',
      body: '弹窗「翻译页面」；按可视区域懒加载，可随时还原。',
    },
    {
      title: '划词翻译',
      body: '选中文字即可翻译；短词支持音标与发音。',
    },
    {
      title: '免翻区域',
      body: '弹窗点选，或在此添加选择器；内置规则可 PR。',
    },
    {
      title: '快捷键',
      body: '弹窗文本框：⌘ / Ctrl + Enter 翻译。',
    },
  ],
  welcomeTitle: '欢迎使用 MultCat！',
  welcomeDesc: '让世界语言触手可及 — 网页双语、划词查词、多引擎随心切换。',
  guideQuickTitle: '快速上手',
  tipTitle: '小贴士',
  tipBody: '建议先选好界面语言和免费引擎，需要时再接入大模型。',
  tipAction: '去语言设置',
  navGuide: '使用教程',
  navLanguage: '语言设置',
  navEngine: '翻译引擎',
  navAppearance: '外观设置',
  navSkip: '免翻区域',
  navChangelog: '更新日志',
  navAbout: '关于我们',
  aboutTitle: '关于 MultCat',
  aboutBody:
    '免费双语翻译扩展，仅限非商业用途（PolyForm Noncommercial）。设置仅保存在本地。欢迎通过 builtin-site-rules.json 贡献免翻规则。',
  aboutGithub: 'GitHub 仓库',
  aboutFeedback: '问题反馈',
  changelogTitle: '更新日志',
  changelogHint: '近期版本变更。完整记录见仓库 CHANGELOG.md。',
  builtinSitesTitle: '内置免翻规则',
  builtinSitesDesc:
    '优先从 GitHub 仓库拉取（缓存 24 小时）；离线时回退到扩展内打包的 JSON。欢迎 PR 贡献 builtin-site-rules.json。',
  builtinSitesEmpty: '暂无内置规则',
};

const zh_TW: Copy = {
  ...zh_CN,
  brandTagline: '多語翻譯貓',
  pageTitle: '設定',
  pageDesc: '設定翻譯引擎、本地語言、外觀與略過規則。',
  languageTitle: '語言設定',
  appearanceTitle: '外觀設定',
  skipTitle: '略過區域',
  skipExport: '匯出',
  skipImport: '匯入',
  skipExportOk: '已匯出略過規則',
  skipImportOk: '已合併匯入略過規則',
  skipImportFail: '匯入失敗，請檢查 JSON 檔案格式',
  guideTitle: '使用教學',
  welcomeTitle: '歡迎使用 MultCat！',
  welcomeDesc: '讓世界語言觸手可及 — 網頁雙語、劃詞查詞、多引擎切換。',
  tipAction: '去語言設定',
  navGuide: '使用教學',
  navLanguage: '語言設定',
  navEngine: '翻譯引擎',
  navAppearance: '外觀設定',
  navSkip: '略過區域',
  navChangelog: '更新日誌',
  navAbout: '關於我們',
  aboutTitle: '關於 MultCat',
  aboutBody:
    '免費雙語翻譯擴充，僅限非商業用途（PolyForm Noncommercial）。設定僅保存在本機。歡迎透過 builtin-site-rules.json 貢獻略過規則。',
  aboutGithub: 'GitHub 倉庫',
  aboutFeedback: '問題回饋',
  changelogTitle: '更新日誌',
  changelogHint: '近期版本變更。完整記錄見倉庫 CHANGELOG.md。',
  builtinSitesTitle: '內建略過規則',
  builtinSitesDesc:
    '優先從 GitHub 倉庫拉取（快取 24 小時）；離線時回退到擴充內打包的 JSON。歡迎 PR 貢獻 builtin-site-rules.json。',
};

const ja: Copy = {
  ...en,
  brandTagline: 'AI Translator',
  pageTitle: '設定',
  navGuide: '使い方',
  navLanguage: '言語',
  navEngine: 'エンジン',
  navAppearance: '外観',
  navSkip: 'スキップ',
  navAbout: 'About',
  welcomeTitle: 'MultCat へようこそ！',
};

const ko: Copy = {
  ...en,
  pageTitle: '설정',
  navGuide: '가이드',
  navLanguage: '언어',
  navEngine: '엔진',
  navAppearance: '모양',
  navSkip: '건너뛰기',
  navAbout: '정보',
  welcomeTitle: 'MultCat에 오신 것을 환영합니다!',
};

const COPY_BY_LOCALE: Record<string, Copy> = {
  en,
  zh_CN,
  zh_TW,
  ja,
  ko,
  fr: en,
  de: en,
  es: en,
  ru: en,
  pt_BR: en,
  vi: en,
};

export const getOptionsCopy = (locale: string): Copy => COPY_BY_LOCALE[locale] ?? en;

export type OptionsCopy = Copy;
export type { GuideStep, UiLocaleId };
