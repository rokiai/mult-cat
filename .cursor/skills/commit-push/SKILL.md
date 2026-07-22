---
name: commit-push
description: >-
  Commit MultCat changes and push to both GitHub (origin) and Gitee (gitee).
  Use when the user asks to commit, push, 提交, 推送, 同步到 Gitee/GitHub, or sync remotes.
---

# MultCat Commit & Push

双远程：`origin` = GitHub，`gitee` = Gitee。默认分支跟踪 `origin/main`。

## Owner

| 项 | 值 |
| --- | --- |
| 账号 / org | `rokiai` |
| GitHub | https://github.com/rokiai/mult-cat |
| Gitee | https://gitee.com/rokiai/mult-cat |
| 本仓库 commit 作者 | `rokiai` \<`vnues.wgf@gmail.com`\> |
| GitHub SSH host | `github.com-rokiai`（`~/.ssh/config` 别名） |

提交前确认本仓库 identity（只读检查，**不要**改 git config）：

```bash
git config user.name    # 应为 rokiai
git config user.email   # 应为 vnues.wgf@gmail.com
```

若不一致，告知用户用本地 `git config`（非 `--global`）自行修正后再继续。

## Remotes

| Remote | URL |
| --- | --- |
| `origin` | `git@github.com-rokiai:rokiai/mult-cat.git` |
| `gitee` | `git@gitee.com:rokiai/mult-cat.git` |

若缺少 `gitee`：

```bash
git remote add gitee git@gitee.com:rokiai/mult-cat.git
```

## Commit（仅在用户明确要求时）

1. 并行收集状态：

```bash
git status
git diff && git diff --staged
git log -5 --oneline
```

2. 草稿 1–2 句 commit message（偏 why；遵循近期风格，如 `feat:` / `fix:` / `docs:` / `chore:`）。
3. **不要**提交密钥（`.env`、credentials 等）；若用户点名要提交，先警告。
4. Stage 相关文件并提交（HEREDOC）：

```bash
git add <files>
git commit -m "$(cat <<'EOF'
<message>

EOF
)"
git status
```

5. 提交后确认作者为 `rokiai <vnues.wgf@gmail.com>`：`git log -1 --format='%an <%ae>'`。
6. Hook 失败：修复后**新建** commit，勿 amend（除非用户明确要求且符合 amend 条件）。
7. **禁止**：改 git config、`--no-verify`、force push main、交互式 `-i`。

## Push（双远程）

提交成功后（或用户只要推送时）：

```bash
git push origin HEAD
git push gitee HEAD
```

若推送了本地新 tag：

```bash
git push origin <tag>
git push gitee <tag>
# 或一次性：
git push origin --tags
git push gitee --tags
```

确认：

```bash
git status -sb
git remote -v
```

`main` 应跟踪 `origin/main`。若误设为 `gitee/main`：

```bash
git branch -u origin/main main
```

## 完成时

向用户回报：commit hash、message、已推送到的远程（origin + gitee）。
