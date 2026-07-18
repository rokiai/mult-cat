type Copy = {
  title: string;
  tagline: string;
  pageBilingual: string;
  translatePage: string;
  restore: string;
  pageTranslating: string;
  restored: string;
  skipPick: string;
  skipPickStarted: string;
  swapLanguages: string;
  sourcePlaceholder: string;
  translate: string;
  translateShortcut: string;
  result: string;
  footerHint: string;
  uiLocale: string;
  provider: string;
  guide: string;
};

const en: Copy = {
  title: 'MultCat',
  tagline: 'Multi-language translation cat',
  pageBilingual: 'Page bilingual',
  translatePage: 'Translate page',
  restore: 'Restore',
  pageTranslating: 'Page translating…',
  restored: 'Restored',
  skipPick: 'Click to pick skip area',
  skipPickStarted: 'Click an element on the page to skip',
  swapLanguages: 'Swap languages',
  sourcePlaceholder: 'Type or paste text…',
  translate: 'Translate',
  translateShortcut: '⌘ / Ctrl + Enter',
  result: 'Result',
  footerHint: 'Select text on page to translate',
  uiLocale: 'Interface language',
  provider: 'Translation service',
  guide: 'Usage guide',
};

const zh_CN: Copy = {
  title: 'MultCat',
  tagline: '多语翻译猫',
  pageBilingual: '网页双语对照',
  translatePage: '翻译页面',
  restore: '还原',
  pageTranslating: '正在翻译页面…',
  restored: '已还原',
  skipPick: '点击选择免翻区域',
  skipPickStarted: '请在页面上点击不翻译的元素',
  swapLanguages: '交换语言',
  sourcePlaceholder: '输入或粘贴文本…',
  translate: '翻译',
  translateShortcut: '⌘ / Ctrl + Enter',
  result: '译文',
  footerHint: '划词也可翻译，支持快速对照阅读',
  uiLocale: '本地语言',
  provider: '翻译服务',
  guide: '使用教程',
};

const zh_TW: Copy = {
  ...zh_CN,
  title: 'MultCat',
  tagline: '多語翻譯貓',
  pageBilingual: '網頁雙語對照',
  translatePage: '翻譯頁面',
  restore: '還原',
  pageTranslating: '正在翻譯頁面…',
  restored: '已還原',
  skipPick: '點擊選擇略過區域',
  skipPickStarted: '請在頁面上點擊不翻譯的元素',
  swapLanguages: '交換語言',
  sourcePlaceholder: '輸入或貼上文字…',
  translate: '翻譯',
  result: '譯文',
  footerHint: '劃詞也可翻譯，支援快速對照閱讀',
  uiLocale: '本地語言',
  provider: '翻譯服務',
  guide: '使用教學',
};

const ja: Copy = {
  ...en,
  title: 'MultCat',
  tagline: 'マルチ言語翻訳ネコ',
  pageBilingual: 'ページ対訳',
  translatePage: 'ページを翻訳',
  restore: '元に戻す',
  pageTranslating: '翻訳中…',
  restored: '復元しました',
  skipPick: '翻訳除外エリアを選択',
  skipPickStarted: 'ページ上で除外する要素をクリック',
  swapLanguages: '言語を入れ替え',
  sourcePlaceholder: 'テキストを入力…',
  translate: '翻訳',
  result: '結果',
  footerHint: '選択テキストも翻訳できます',
  uiLocale: '表示言語',
  provider: '翻訳サービス',
  guide: '使い方',
};

const ko: Copy = {
  ...en,
  title: 'MultCat',
  tagline: '다국어 번역 고양이',
  pageBilingual: '페이지 이중 언어',
  translatePage: '페이지 번역',
  restore: '복원',
  pageTranslating: '번역 중…',
  restored: '복원됨',
  skipPick: '번역 제외 영역 선택',
  skipPickStarted: '페이지에서 제외할 요소를 클릭하세요',
  swapLanguages: '언어 바꾸기',
  sourcePlaceholder: '텍스트 입력…',
  translate: '번역',
  result: '결과',
  footerHint: '선택 텍스트도 번역할 수 있습니다',
  uiLocale: '표시 언어',
  provider: '번역 서비스',
  guide: '사용 가이드',
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

export const getPopupCopy = (locale: string): Copy => COPY_BY_LOCALE[locale] ?? en;

export type PopupCopy = Copy;
