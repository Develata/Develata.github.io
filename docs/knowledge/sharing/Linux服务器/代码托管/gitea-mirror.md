---
title: Gitea Mirror
date: 2026-07-05
order: 2
---

## Github Repo

[RayLabsHQ/gitea-mirror Github Repo](https://github.com/RayLabsHQ/gitea-mirror)

## 官方与相关文档

- [RayLabsHQ/gitea-mirror](https://github.com/RayLabsHQ/gitea-mirror)
- [Gitea Repository Mirror](https://docs.gitea.com/usage/repo-mirror)
- [Gitea API](https://docs.gitea.com/api/)

## Gitea Mirror 是什么

这里的 `Gitea Mirror` 指的是 `RayLabsHQ/gitea-mirror` 这个项目，不是 Gitea 官方功能本身。

它是一个 Web 管理器，用来把 GitHub 仓库自动导入到自托管 Gitea / Forgejo 中，并保持同步。核心代码同步仍然基于 Gitea / Forgejo 的官方 pull mirror 机制：

```text
POST /api/v1/repos/migrate
mirror: true
```

后续手动或定时同步则调用：

```text
POST /api/v1/repos/{owner}/{repo}/mirror-sync
```

也就是说，它不是自己在服务器上裸跑 `git clone` / `git fetch` 来绕过 Gitea；真正的 Git refs 同步仍由 Gitea 的 mirror 仓库负责。

## 适合什么场景

适合：

- GitHub 个人账号下有很多仓库，需要批量镜像到 Gitea。
- 希望自动发现新仓库，而不是每次手动创建 pull mirror。
- 希望有一个 Web UI 查看同步状态、失败日志和调度配置。
- 需要把 private repo、archived repo、LFS repo 也纳入代码保险库。

不适合：

- 只想一次性迁移 1 到 2 个仓库。
- 完全不想多维护一个服务和 SQLite 数据库。
- 不希望任何第三方服务保存 GitHub / Gitea token。
- 已经有自己稳定的 provisioning 脚本和监控链路。

一句话：如果目标是长期维护 GitHub -> Gitea 的个人代码保险库，它比纯脚本省心；如果目标只是一次性创建少量 mirror，Gitea 官方手动迁移或短脚本就足够。

## 开源协议

`RayLabsHQ/gitea-mirror` 使用 `AGPL-3.0`。

普通自用部署官方镜像，一般没有额外问题。需要注意的是：如果修改它的源码或镜像，并通过网络提供修改后的服务，AGPL 要求向这些网络用户提供对应修改版源码。

本文建议直接使用官方镜像，不修改源码。

## 和 Gitea 官方 Mirror 的关系

Gitea 官方本来就支持 repository mirror。手动创建流程是：

1. `+`。
2. `New Migration`。
3. 选择 GitHub 或 Git。
4. 填仓库地址和 token。
5. 勾选 `This repository will be a mirror`。
6. 创建。

但 Gitea 官方没有提供一个足够顺手的“把整个 GitHub 个人账号所有仓库持续纳入 mirror”的产品化入口。

`RayLabsHQ/gitea-mirror` 解决的是这一层：

```text
GitHub API 枚举仓库
  -> 根据策略选择目标 owner / organization
  -> 调 Gitea migrate API 创建 pull mirror
  -> 定时触发 mirror-sync
  -> 保存状态和日志
```

所以可以把它理解为：

```text
Gitea 官方 pull mirror 的 Web 管理器 + scheduler
```

## 为什么不用纯脚本

纯脚本方案也可行。基本逻辑是：

```text
GitHub /user/repos 分页
  -> 检查 Gitea 是否已有同名 repo
  -> 不存在则 POST /api/v1/repos/migrate mirror=true
```

优点是简单、可审计、少一个服务。

但长期运行时，脚本需要自己处理：

- dry-run。
- 已存在非 mirror 仓库冲突。
- private repo token。
- 新仓库自动发现。
- 失败日志。
- 重试。
- Gitea / GitHub API 差异。
- 镜像状态漂移。

如果仓库很多，Web UI 和状态库反而会降低运维成本。

## 推荐架构

```text
GitHub account
  ├── public repositories
  ├── private repositories
  └── archived repositories
        │
        │ GitHub API
        ▼
Gitea Mirror
  ├── Web UI
  ├── scheduler
  ├── SQLite state database
  └── calls Gitea API
        │
        │ /api/v1/repos/migrate mirror=true
        ▼
Gitea
  ├── pull mirror repositories
  ├── Git refs / branches / tags / commits
  ├── SQLite
  └── data directory backup
```

部署建议：

```text
/opt/gitea
/opt/gitea-mirror
```

其中：

- `/opt/gitea` 保存真正的 Gitea 仓库和数据库。
- `/opt/gitea-mirror` 保存 gitea-mirror 的 UI 用户、配置、token 加密数据和同步状态。

两者都要备份，但优先级不同：Gitea 的 `data/` 是仓库主体，优先级最高。

## 部署方式

Docker Compose 模板放在这里：

[Gitea Mirror Docker Compose](/knowledge/sharing/docker/compose/gitea-mirror)

建议访问链路：

```text
用户 -> HTTPS 反向代理 -> 127.0.0.1:4321 -> gitea-mirror
```

不要直接把 `4321` 暴露到公网。

## 初始配置策略

第一次部署不要打开所有功能。先只做一件事：

```text
GitHub personal repositories -> Gitea pull mirror
```

推荐初始状态：

```text
Personal repositories: on
Private repositories: on, if token scope permits
Forks: off
Starred repositories: off
Organizations: off
Metadata mirroring: off
Issues: off
Pull requests: off
Labels: off
Milestones: off
Wiki: off
Releases: off
LFS: 按需
Schedule: on
Mirror interval: 24h 或 8h
Cleanup delete: off
Cleanup dry-run: on
Orphaned repo action: archive
```

先让代码 mirror 跑稳，再考虑 metadata。不要一开始把 issues、PR、wiki、releases 全开，否则问题面会扩大很多。

## 目标组织

建议在 Gitea 里创建专门组织：

```text
github-mirrors
```

然后把 GitHub 个人仓库镜像到：

```text
gitea.example.com/github-mirrors/repo-a
gitea.example.com/github-mirrors/repo-b
```

不要一开始全部塞进 Gitea 个人 namespace。专门组织更容易区分哪些仓库是 GitHub 副本，哪些是 Gitea 原生仓库。

## Token 权限

### GitHub Token

优先使用 Fine-grained personal access token。

建议：

```text
Repository access: 只选需要 mirror 的仓库
Contents: Read-only
Metadata: Read-only
```

如果需要 private repo，就把 private repo 纳入 token 授权范围。如果 GitHub 组织或企业启用了 SSO，需要额外授权 token。

不要为了省事长期使用权限很大的 classic `repo` token，除非确实没有更细粒度选择。

### Gitea Token

建议创建专用 bot 用户：

```text
github-mirror-bot
```

将它加入目标 Gitea 组织，并授予创建仓库、迁移仓库、读取仓库状态的权限。

不要长期使用 Gitea 管理员 token。

## Cleanup 策略

不要开启自动删除。

推荐：

```text
CLEANUP_DELETE_IF_NOT_IN_GITHUB=false
CLEANUP_DRY_RUN=true
CLEANUP_ORPHANED_REPO_ACTION=archive
```

原因很简单：镜像系统的目标是保存副本，不是忠实复制 GitHub 的删除行为。GitHub 上误删、账号异常、API 出错时，本地 Gitea 不应该跟着删除。

如果确实要清理 orphaned repo，先用 dry-run 观察几轮，再人工确认。

## Metadata Mirroring

Gitea 官方 pull mirror 主要同步：

```text
branches / tags / commits
```

issues、pull requests、labels、milestones、wiki、releases 不是 Git refs mirror 的核心能力。`RayLabsHQ/gitea-mirror` 可以额外复制这些 metadata，但这是它自己通过 GitHub API 和 Gitea API 做的扩展功能。

因此建议：

1. 第一阶段只镜像代码。
2. 确认 private repo、LFS、定时同步都稳定。
3. 第二阶段再单独评估 releases。
4. issues / PR / wiki 最后再考虑。

不要把 metadata 复制当成灾备第一优先级。代码历史和 tags 是最重要的资产。

## 验证

### 1. gitea-mirror 服务健康

```bash
cd /opt/gitea-mirror
docker compose ps
docker compose logs -f gitea-mirror
curl -fsS http://127.0.0.1:4321/api/health
```

### 2. Gitea 中仓库是否是 mirror

在 Gitea UI 里打开目标仓库，检查是否有 mirror 设置和同步按钮。

也可以用 API：

```bash
curl -fsS \
  -H "Authorization: token $GITEA_TOKEN" \
  "$GITEA_URL/api/v1/repos/github-mirrors/REPO_NAME" \
  | python3 -m json.tool | sed -n '1,120p'
```

重点看：

```json
"mirror": true
```

### 3. 手动同步

在 gitea-mirror UI 或 Gitea 仓库设置里触发一次同步，然后检查：

```bash
git ls-remote https://github.com/你的用户名/REPO_NAME.git
```

和 Gitea 里显示的 branches / tags 是否一致。

## 常见问题

### 1. private repo 同步失败

常见原因：

- GitHub token 没有授权到目标 private repo。
- Fine-grained token 没有 `Contents: Read-only`。
- GitHub SSO 没有授权。
- Gitea mirror 创建时没有保存上游凭据。
- GitHub 访问被服务器网络阻断。

先确认 GitHub token 能读：

```bash
curl -fsS \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/user/repos?per_page=1
```

### 2. Gitea 里已有同名仓库

Gitea pull mirror 只能在仓库创建时设置。已有普通仓库不能直接改成 pull mirror。

处理方式：

- 如果已有仓库是空仓库，可以人工删除后重新创建 mirror。
- 如果已有仓库有内容，不要自动删除，先人工确认。
- 更好的策略是把 GitHub mirrors 放到专门组织，减少命名冲突。

### 3. 为什么不要自动删除 GitHub 已删除的仓库

因为备份系统的价值就在于：源端出问题时，副本仍然在。

如果 GitHub 仓库被误删、账号被封、API 临时返回异常，本地 Gitea 不应该立刻删除对应 mirror。

所以本文推荐 archive / dry-run，而不是 delete。

### 4. 使用 AGPL 项目会不会有问题

直接使用官方镜像自托管，一般没有问题。

如果修改源码或镜像，并把修改后的 Web 服务提供给网络用户，AGPL 要求向这些用户提供对应源码。个人内部自用通常不是问题。

## 推荐配置总结

```text
目标：GitHub 个人仓库的长期代码保险库

部署：Docker Compose + 反向代理
命名空间：Gitea 组织 github-mirrors
代码同步：Gitea 官方 pull mirror
调度：gitea-mirror scheduler
Token：GitHub fine-grained PAT + Gitea bot PAT
Metadata：初期关闭
Cleanup：禁止 delete，只 dry-run/archive
备份：同时备份 /opt/gitea/data 和 /opt/gitea-mirror/data
```

## 参考链接

- [RayLabsHQ/gitea-mirror](https://github.com/RayLabsHQ/gitea-mirror)
- [RayLabsHQ/gitea-mirror releases](https://github.com/RayLabsHQ/gitea-mirror/releases)
- [Gitea Repository Mirror](https://docs.gitea.com/usage/repo-mirror)
- [Gitea API](https://docs.gitea.com/api/)
- [Gitea Docker Compose](/knowledge/sharing/docker/compose/gitea)
- [Gitea Mirror Docker Compose](/knowledge/sharing/docker/compose/gitea-mirror)
