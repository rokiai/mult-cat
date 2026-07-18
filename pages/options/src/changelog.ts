type ChangelogItem = {
  version: string;
  date: string;
  highlights: string[];
};

const zh: ChangelogItem[] = [
  {
    version: '0.5.2',
    date: '2026-07-18',
    highlights: [
      '免翻规则支持导出与合并导入',
      '内置站点规则优先拉取线上 JSON，失败回退本地',
      '关于页增加 GitHub / Issues 入口；README 中英双语',
      'Popup 隐藏外层滚动条',
    ],
  },
  {
    version: '0.5.1',
    date: '2026-07-18',
    highlights: ['修复：双语模式下划词弹层不再被二次对照'],
  },
  {
    version: '0.5.0',
    date: '2026-07-18',
    highlights: [
      'MultCat 品牌与全新设置页 / Popup 视觉',
      '网页双语：视口懒加载，滚动继续翻译，可还原',
      '划词 / Popup：短词音标、释义与发音',
      '多引擎：Google / Microsoft / Yandex / 腾讯，及 OpenAI 兼容大模型',
      '免翻区域：点选、自定义选择器、内置站点规则（可 PR）',
      '多语言界面与本地存储偏好',
    ],
  },
];

const en: ChangelogItem[] = [
  {
    version: '0.5.2',
    date: '2026-07-18',
    highlights: [
      'Export / merge-import user skip rules (JSON)',
      'Builtin site rules prefer remote GitHub JSON with local fallback',
      'About links to GitHub / Issues; bilingual README',
      'Hide popup outer scrollbar',
    ],
  },
  {
    version: '0.5.1',
    date: '2026-07-18',
    highlights: ['Fix: selection popup is no longer bilingual-translated during page bilingual mode'],
  },
  {
    version: '0.5.0',
    date: '2026-07-18',
    highlights: [
      'MultCat branding and refreshed Settings / Popup UI',
      'Bilingual page translate with viewport lazy-load and restore',
      'Selection / Popup: IPA, definitions, and audio for short words',
      'Engines: Google / Microsoft / Yandex / Tencent + OpenAI-compatible LLMs',
      'Skip areas: pick mode, custom selectors, builtin site rules (PRs welcome)',
      'Localized UI and local-only preferences',
    ],
  },
];

const getChangelog = (locale: string): ChangelogItem[] => {
  if (locale.startsWith('zh')) return zh;
  return en;
};

export { getChangelog };
export type { ChangelogItem };
