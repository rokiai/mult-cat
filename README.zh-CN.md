<p align="center">
  <img src="chrome-extension/public/icon-128.png" width="112" alt="MultCat" />
</p>

<h1 align="center">MultCat</h1>

<p align="center"><a href="./README.md">English</a> · <strong>中文</strong></p>

<p align="center"><strong>多语翻译猫</strong> — 浏览器翻译扩展（Chrome / Chromium / Firefox），源码公开，禁止商业使用。</p>

<p align="center">网页双语对照、划词翻译、多引擎切换，设置与数据均保存在本地。</p>

## 下载安装

推送形如 `v0.5.0` 的 git tag 后，GitHub Actions 会自动构建并发布到 **Releases**。

<!-- release-download:start -->
<p align="center">
  <a href="https://github.com/rokiai/mult-cat/releases/latest"><img alt="Latest Release" src="https://img.shields.io/github/v/release/rokiai/mult-cat?label=release&style=flat-square" /></a>
</p>

**当前版本：[v0.5.1](https://github.com/rokiai/mult-cat/releases/tag/v0.5.1)** · [全部 Releases](https://github.com/rokiai/mult-cat/releases)

| 浏览器 | 最新安装包 | 本版本 |
| --- | --- | --- |
| Chrome / Edge / Chromium | [MultCat-chrome.zip](https://github.com/rokiai/mult-cat/releases/latest/download/MultCat-chrome.zip) | [v0.5.1](https://github.com/rokiai/mult-cat/releases/download/v0.5.1/MultCat-0.5.1-chrome.zip) |
| Firefox | [MultCat-firefox.xpi](https://github.com/rokiai/mult-cat/releases/latest/download/MultCat-firefox.xpi) | [v0.5.1](https://github.com/rokiai/mult-cat/releases/download/v0.5.1/MultCat-0.5.1-firefox.xpi) |

安装（Chrome）：下载 zip → 解压 → 打开 `chrome://extensions` → 开启开发者模式 → **加载已解压的扩展程序** → 选择解压后的文件夹。
<!-- release-download:end -->

## 功能

| 功能 | 说明 |
| --- | --- |
| **网页双语翻译** | 一键双语对照；按可视区域懒加载翻译，滚动时继续加载，可随时还原 |
| **划词翻译** | 选中网页文字即可翻译（可在设置中开关） |
| **弹窗文本翻译** | 在 Popup 输入/粘贴文本，`⌘/Ctrl + Enter` 快速翻译 |
| **多翻译引擎** | Google、Microsoft、Yandex、腾讯交互翻译，以及 OpenAI 兼容大模型 |
| **大模型接入** | 支持 OpenAI、Kimi、DeepSeek、智谱、通义、豆包、硅基流动、OpenRouter 及自定义网关 |
| **免翻区域** | Popup 点选、用户 CSS 规则、导入/导出，以及仓库内自维护的免翻 JSON（欢迎 PR） |
| **词典详情 + 发音** | 划词 / Popup 短词显示音标、词性释义，并支持发音播放 |
| **多语言界面** | 中文、英文、日语、韩语等本地化界面 |
| **本地存储** | API Token 与偏好仅保存在浏览器本地，不经过第三方中转 |

## 截图

### Popup

翻译服务、本地语言、网页双语、免翻点选与文本翻译。

<p align="center">
  <img src="docs/screenshots/popup.png" width="320" alt="MultCat Popup" />
</p>

### 设置页 · 使用教程

欢迎引导、快速上手六步与侧栏设置入口。

<p align="center">
  <img src="docs/screenshots/settings-guide.png" width="720" alt="MultCat Settings Guide" />
</p>

### 划词翻译

选中文字即可查看译文、音标与释义，并支持发音。

<p align="center">
  <img src="docs/screenshots/selection-translate.png" width="560" alt="MultCat Selection Translate" />
</p>

## 更新日志

完整记录见 [`CHANGELOG.md`](./CHANGELOG.md)。

### 0.5.1 — 2026-07-18

- 修复：双语模式下划词弹层不再被二次对照

### 0.5.0 — 2026-07-18

- MultCat 品牌与全新设置页 / Popup 视觉
- 网页双语：视口懒加载，滚动继续翻译，可还原
- 划词 / Popup：短词音标、释义与发音
- 多引擎：Google / Microsoft / Yandex / 腾讯，及 OpenAI 兼容大模型
- 免翻区域：点选、自定义选择器、内置站点规则（可 PR）
- 多语言界面与本地存储偏好

## 快速开始（开发）

```bash
# 需要 Node.js（见 .nvmrc）与 pnpm
pnpm install
pnpm dev          # Chrome 开发构建 → dist/
# pnpm dev:firefox
```

1. 打开 `chrome://extensions`
2. 开启 **开发者模式**
3. **加载已解压的扩展程序** → 选择项目里的 `dist` 目录

生产构建 / 本地打 zip：

```bash
pnpm build
pnpm zip          # → dist-zip/
# pnpm zip:firefox
```

### 发版（GitHub Release）

发版前先手工写好更新日志（CI **不会**自动改这两处）：

1. **`CHANGELOG.md`**：按 [Keep a Changelog](https://keepachangelog.com/) 在顶部加新版本（`新增` / `变更` / `修复` 等）
2. **`pages/options/src/changelog.ts`**：同步精简亮点到设置页「更新日志」（`zh` / `en` 各一条）
3. （可选）`README.md` / `README.zh-CN.md`「更新日志」小节补一句摘要

然后对齐版本、提交并打 tag：

```bash
# 将 0.5.1 换成目标版本
pnpm update-version 0.5.1

git add CHANGELOG.md pages/options/src/changelog.ts README.md README.zh-CN.md package.json
# 若 update-version 还改了子包 package.json，一并加入
git add -u

git commit -m "chore: release v0.5.1"
git tag v0.5.1
git push origin HEAD
git push origin v0.5.1
```

推送 `v*` tag 后，[`.github/workflows/release.yml`](.github/workflows/release.yml) 会：

1. 构建 Chrome zip / Firefox xpi
2. 创建 GitHub Release 并上传安装包（`generate_release_notes` 会按 commit 生成 Release 说明，**不等于**仓库 `CHANGELOG.md`）
3. 自动更新 `README.md` 与 `README.zh-CN.md` 下载链接并推回默认分支

## 使用说明（用户）

1. 安装并固定 MultCat 到工具栏
2. 打开 Popup，选择翻译引擎与目标语言
3. 点击 **翻译页面** 进行双语阅读；需要时可 **还原**
4. 在网页上选中文字使用划词翻译
5. 导航、代码等不想翻的区域：Popup → **点击选择免翻区域**，或到设置页配置选择器；也可导入/导出本地规则；改进内置站点规则可改 `packages/storage/lib/impl/builtin-site-rules.json` 提 PR
6. 使用大模型时：设置页 → 翻译引擎选 OpenAI 兼容 → 填写厂商 / 模型 / Token

更完整的步骤见扩展内：**Popup → 使用教程**（跳转到设置页教程）。

## 贡献免翻规则

内置免翻规则（仅 skip / exclude，无「包含翻译区域」）：

```
packages/storage/lib/impl/builtin-site-rules.json
```

示例：

```json
{
  "matches": ["example.com", "*.example.com"],
  "excludeSelectors": ["nav", "code", "pre", ".sidebar"]
}
```

- `matches`：主机匹配（`*`、`*.domain.com`）
- `excludeSelectors`：不翻译的 CSS 选择器（与用户自定义叠加）

运行时优先拉取 `main` 上的远程规则（缓存 24 小时），失败则回退到扩展内打包的 JSON。说明见 [`packages/storage/lib/impl/SITE_RULES_SOURCE.md`](packages/storage/lib/impl/SITE_RULES_SOURCE.md)。

## 技术栈

- Manifest V3、React、TypeScript、Vite、Turborepo、Ant Design
- 翻译核心：`packages/translate`
- 设置存储：`packages/storage`
- 内容脚本：`pages/content`（DOM 双语、划词、免翻点选）
- 界面：`pages/popup`、`pages/options`

## 项目结构（简要）

```
chrome-extension/     # manifest、background、公共静态资源
pages/
  popup/              # 弹窗
  options/            # 设置 + 使用教程
  content/            # 页面注入脚本
packages/
  translate/          # 各翻译引擎 adapter
  storage/            # 设置与免翻规则
  i18n/               # 扩展名称等文案
  ui/                 # 共享 UI（如引擎 Logo）
```

## 许可协议

本项目采用 **[PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0)**（非商业许可）。

- **允许**：个人学习、研究、爱好、教育 / 公益等非商业用途；可修改、可再分发（须保留许可与版权声明）
- **不允许**：任何商业用途（含售卖、商业产品内嵌、商业 SaaS 等）

完整条款见 [LICENSE](./LICENSE)。第三方依赖仍遵循各自原有许可。

## 贡献

欢迎 Issue / PR：修 bug、加引擎、改进 UI 与文档均可（须遵守非商业许可）。提交前建议运行：

```bash
pnpm lint
pnpm type-check
pnpm build
```
