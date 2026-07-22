---
name: release
description: >-
  Cut a MultCat extension release: changelog, version bump, tag, and push to
  GitHub/Gitee so GitHub Actions builds the Release. Use when the user asks to
  release, 发版, bump version, cut a tag, or publish MultCat.
---

# MultCat Release

发版触发器是推送 `v*` tag 到 **GitHub**（`origin`）。Gitee 只做源码镜像，**不**跑 Release CI。

## Owner

| 项 | 值 |
| --- | --- |
| 账号 / org | `rokiai` |
| GitHub | https://github.com/rokiai/mult-cat |
| Gitee | https://gitee.com/rokiai/mult-cat |
| Release URL 模板 | `https://github.com/rokiai/mult-cat/releases/tag/vX.Y.Z` |
| 本仓库 commit 作者 | `rokiai` \<`vnues.wgf@gmail.com`\> |
| GitHub SSH host | `github.com-rokiai` |

发版 commit / tag 必须用上述作者。提交前只读检查（**不要**改 git config）：

```bash
git config user.name    # 应为 rokiai
git config user.email   # 应为 vnues.wgf@gmail.com
```

## Preconditions

- 工作区干净，或仅含本次发版相关改动
- 用户已给出目标版本（SemVer，如 `0.5.5`），或同意根据变更推断 patch/minor/major
- 当前分支为 `main`（或用户指定的发版分支）
- identity 为 `rokiai <vnues.wgf@gmail.com>`

## Checklist

```
Release Progress:
- [ ] 1. 写 CHANGELOG.md
- [ ] 2. 同步 pages/options/src/changelog.ts（zh / en）
- [ ] 3. （可选）README「更新日志」摘要
- [ ] 4. pnpm update-version <version>
- [ ] 5. commit chore: release vX.Y.Z
- [ ] 6. git tag vX.Y.Z
- [ ] 7. push commits + tag → origin，再镜像 → gitee
- [ ] 8. 确认 GitHub Actions Release 跑通
```

## Step 1–3: Changelogs（CI 不会写）

1. **`CHANGELOG.md`**：在顶部插入新版本，Keep a Changelog 风格：

```markdown
## [X.Y.Z] — YYYY-MM-DD

### 新增 / 变更 / 修复 / 文档

- …
```

2. **`pages/options/src/changelog.ts`**：在 `zh` 与 `en` 数组**顶部**各加一条，精简亮点（设置页用）。
3. 可选：`README.md` / `README.zh-CN.md` 的「更新日志」小节补一句。

依据 `git log`（自上一 tag）与 diff 起草条目；不确定处问用户。

## Step 4: Bump version

```bash
pnpm update-version X.Y.Z
```

脚本会改各 `package.json` 的 `version`。核对根 `package.json` 与子包。

## Step 5–6: Commit & tag

```bash
git add CHANGELOG.md pages/options/src/changelog.ts README.md README.zh-CN.md package.json
git add -u   # 纳入 update-version 改过的子包 package.json

git commit -m "$(cat <<'EOF'
chore: release vX.Y.Z

EOF
)"

git tag vX.Y.Z
```

Message 固定为 `chore: release vX.Y.Z`。仅在用户明确要求发版时才 commit / tag。

## Step 7: Push（GitHub 触发 CI，Gitee 镜像）

```bash
git push origin HEAD
git push origin vX.Y.Z

git push gitee HEAD
git push gitee vX.Y.Z
```

缺 `gitee` remote 时：

```bash
git remote add gitee git@gitee.com:rokiai/mult-cat.git
```

保持 `main` 跟踪 `origin/main`：

```bash
git branch -u origin/main main
```

## Step 8: 验证

推送 `v*` 后，[`.github/workflows/release.yml`](../../.github/workflows/release.yml) 会：

1. 构建 Chrome zip / Firefox xpi
2. 创建 GitHub Release 并上传安装包
3. 自动更新 README 下载区块并推回默认分支（可能产生 `docs: update download links for vX.Y.Z`）

CI 结束后把 `gitee` 再推一次，避免落后于 bot README commit：

```bash
git pull origin main
git push gitee main
```

向用户给出：版本号、tag、GitHub Release URL（`https://github.com/rokiai/mult-cat/releases/tag/vX.Y.Z`）、Gitee 已同步。

## Do NOT

- 跳过 CHANGELOG / `changelog.ts` 直接打 tag
- 只推 Gitee 不推 GitHub（Release 不会触发）
- `--force` 改已推送的 release tag
- 把 `.env` 打进发版 commit
