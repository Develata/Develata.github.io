---
title: git指令大全 (含语法结构)
date: 2026-2-26 23:27
order: 1
---
# git指令大全 (含语法结构)
>git是一个常用的版本控制器

> **注**：本页按「高频速查 + 分类指令全集」组织；部分命令（如 `reset --hard`、`push :branch`、`branch -D`）具有破坏性，请谨慎使用。

## 1. 常用 Git 指令 (高频精简版)

| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| **git init** | `git init` | 初始化本地仓库 |
| **git clone** | `git clone <仓库地址>` | 克隆远程仓库 |
| **git status** | `git status` | 查看工作区与暂存区状态 |
| **git add** | `git add <文件>` 或 `git add .` | 添加变更到暂存区 |
| **git commit** | `git commit -m '<说明>'` | 提交暂存区到本地仓库 |
| **git log** | `git log --oneline --graph` | 查看提交历史 |
| **git diff** | `git diff` / `git diff --cached` | 查看未暂存/已暂存差异 |
| **git branch** | `git branch` / `git branch -a` | 查看分支 |
| **git switch** | `git switch <分支>` | 切换分支 |
| **git merge** | `git merge <分支>` | 合并分支 |
| **git fetch** | `git fetch --prune` | 拉取远程更新（不自动合并） |
| **git pull** | `git pull <远程> <分支>` | 拉取并合并 |
| **git push** | `git push <远程> <分支>` | 推送本地提交到远程 |
| **git stash** | `git stash` / `git stash pop` | 临时保存并恢复工作区修改 |

---

## 2. Git 指令全集 (分类速查)

### 2.1 仓库初始化与配置
| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| `git init` | `git init` | 初始化仓库 |
| `git clone` | `git clone <仓库地址>` | 克隆远程仓库 |
| `git config` | `git config --global user.name '<用户名>'` | 配置全局用户名 |
| `git config` | `git config --global user.email '<邮箱>'` | 配置全局邮箱 |
| `git config` | `git config --global color.ui true` | 启用命令输出着色 |
| `git config` | `git config --global --unset http.proxy` | 取消 Git 代理 |
| `git remote` | `git remote add origin <仓库地址>` | 添加远程仓库别名 |
| `git remote` | `git remote -v` | 查看远程仓库地址 |

### 2.2 工作区与提交
| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| `git status` | `git status` | 查看当前状态 |
| `git add` | `git add <文件>` | 暂存指定文件 |
| `git add` | `git add .` | 暂存当前目录全部变更 |
| `git commit` | `git commit -m '<说明>'` | 创建提交 |
| `git commit` | `git commit -am '<说明>'` | 跳过 `add` 提交已跟踪文件 |
| `git commit` | `git commit --amend -m '<说明>'` | 修改最近一次提交 |
| `git rm` | `git rm <文件>` | 删除文件并记录到暂存区 |
| `git mv` | `git mv <旧名> <新名>` | 重命名并记录变更 |
| `git ls-files` | `git ls-files` | 查看索引中已跟踪文件 |

### 2.3 日志与差异分析
| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| `git log` | `git log` | 查看完整提交日志 |
| `git log` | `git log -n <数量>` | 查看最近 N 条日志 |
| `git log` | `git log --stat` | 查看日志及文件统计 |
| `git log` | `git log -p -m` | 查看日志及补丁内容 |
| `git log` | `git log --pretty=format:'%h %s' --graph` | 图形化简洁日志 |
| `git show` | `git show <commit>` | 查看指定提交详情 |
| `git show` | `git show HEAD` / `git show HEAD^` | 查看当前/父提交 |
| `git diff` | `git diff` | 工作区与暂存区差异 |
| `git diff` | `git diff --cached` | 暂存区与最近提交差异 |
| `git diff` | `git diff HEAD^` | 与上一个提交比较 |
| `git diff` | `git diff HEAD -- <路径>` | 与当前提交比较指定路径 |
| `git diff` | `git diff <远程>/<分支>..<本地分支> --stat` | 对比分支差异统计 |
| `git grep` | `git grep '<模式>'` | 在版本库中搜索文本 |

### 2.4 分支与合并
| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| `git branch` | `git branch` | 查看本地分支 |
| `git branch` | `git branch -a` / `git branch -r` | 查看全部/远程分支 |
| `git branch` | `git branch --merged` | 查看已合并分支 |
| `git branch` | `git branch --no-merged` | 查看未合并分支 |
| `git branch` | `git branch --contains <commit>` | 查找包含指定提交的分支 |
| `git branch` | `git branch -m <旧分支> <新分支>` | 重命名分支 |
| `git branch` | `git branch -d <分支>` | 删除已合并分支 |
| `git branch` | `git branch -D <分支>` | 强制删除分支 |
| `git checkout` | `git checkout -b <新分支>` | 基于当前提交新建并切换 |
| `git checkout` | `git checkout -b <本地分支> <远程>/<分支>` | 基于远程分支创建本地分支 |
| `git checkout` | `git checkout --track <远程分支>` | 创建跟踪分支 |
| `git switch` | `git switch <分支>` | 切换到已有分支 |
| `git merge` | `git merge <分支>` | 合并指定分支到当前分支 |
| `git cherry-pick` | `git cherry-pick <commit>` | 摘取单个提交 |
| `git rebase` | `git rebase <目标分支>` | 变基整理提交历史 |

### 2.5 远程同步与发布
| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| `git fetch` | `git fetch` | 获取远程更新 |
| `git fetch` | `git fetch --prune` | 获取更新并清理远程已删分支 |
| `git pull` | `git pull <远程> <分支>` | 拉取并合并到当前分支 |
| `git push` | `git push <远程> <分支>` | 推送当前分支 |
| `git push` | `git push --tags` | 推送全部标签 |
| `git push` | `git push <远程> :<分支>` | 删除远程分支 |

### 2.6 标签与暂存
| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| `git tag` | `git tag` | 查看标签 |
| `git tag` | `git tag -a <标签> -m '<说明>'` | 创建附注标签 |
| `git show` | `git show <标签>` | 查看标签详情 |
| `git log` | `git log <标签>` | 查看标签对应历史 |
| `git stash` | `git stash` | 暂存当前修改 |
| `git stash` | `git stash list` | 查看暂存列表 |
| `git stash` | `git stash show -p stash@{<序号>}` | 查看某次暂存详情 |
| `git stash` | `git stash apply stash@{<序号>}` | 应用某次暂存 |
| `git stash` | `git stash pop` | 应用并删除最近暂存 |

### 2.7 回退、恢复与底层排错
| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| `git checkout` | `git checkout -- <文件>` | 丢弃工作区指定文件修改 |
| `git reset` | `git reset --hard HEAD` | 强制重置到当前提交 |
| `git revert` | `git revert <commit>` | 反向提交以撤销历史改动 |
| `git reflog` | `git reflog` | 查看引用变动历史（含丢失提交） |
| `git show` | `git show HEAD@{<n>}` | 查看 reflog 指定位置 |
| `git show` | `git show <分支>@{yesterday}` | 查看分支历史时点状态 |
| `git show` | `git show HEAD~<n>` | 查看第 n 个祖先提交 |
| `git show-branch` | `git show-branch --all` | 图示所有分支历史 |
| `git whatchanged` | `git whatchanged` | 查看提交对应文件变更 |
| `git ls-tree` | `git ls-tree HEAD` | 查看树对象内容 |
| `git rev-parse` | `git rev-parse <ref>` | 解析引用对应的 SHA |
| `git gc` | `git gc` | 压缩清理仓库对象 |
| `git fsck` | `git fsck` | 校验仓库对象完整性 |
