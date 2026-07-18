# Changelog

MultCat（多语翻译猫）版本记录。

## [0.5.1] — 2026-07-18

### 修复

- 网页双语开启时，划词翻译弹层不再被二次双语对照

## [0.5.0] — 2026-07-18

### 新增

- **MultCat** 品牌与吉祥物：工具栏图标、Popup / 设置页视觉统一
- **网页双语翻译**：按可视区域懒加载，滚动继续翻译，可一键还原
- **划词翻译**：选中网页文字即可翻译；短词支持音标、词性释义与发音
- **弹窗文本翻译**：`⌘ / Ctrl + Enter` 快速翻译，富结果展示
- **多翻译引擎**：Google、Microsoft、Yandex、腾讯交互翻译
- **大模型接入**：OpenAI 兼容厂商（OpenAI、Kimi、DeepSeek、智谱、通义、豆包、硅基流动、OpenRouter 及自定义网关）
- **免翻区域**：Popup 点选、全局 / 按站点 CSS 选择器、仓库内 `builtin-site-rules.json`（欢迎 PR）
- **设置页**：使用教程、语言、引擎、外观、免翻、关于与更新日志
- **多语言界面**：中文、英文、日语、韩语等

### 体验

- Popup 网页翻译状态按当前标签页同步
- 语言对临时交换不影响全局设置
- 自定义加载动画替代脚手架默认 Spinner

---

格式参考 [Keep a Changelog](https://keepachangelog.com/)。版本号遵循 [SemVer](https://semver.org/)。
