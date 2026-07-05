---
title: gitea-mirror
---

## Github Repo

[RayLabsHQ/gitea-mirror Github Repo](https://github.com/RayLabsHQ/gitea-mirror)

compose更新日期: 2026-07-05

## docker-compose

```yaml
networks:
    1panel-network:
        external: true

volumes:
    gitea-mirror-data:

services:
    gitea-mirror:
        image: ${GITEA_MIRROR_IMAGE:-ghcr.io/raylabshq/gitea-mirror:v3.20.4}
        container_name: gitea-mirror
        restart: unless-stopped
        env_file:
            - .env
        environment:
            - NODE_ENV=production
            - DATABASE_URL=file:data/gitea-mirror.db
            - HOST=0.0.0.0
            - PORT=4321
            - TZ=${TZ:-Asia/Shanghai}
            - BASE_URL=${BASE_URL:-/}
            - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET:?BETTER_AUTH_SECRET is required}
            - ENCRYPTION_SECRET=${ENCRYPTION_SECRET:-}
            - BETTER_AUTH_URL=${BETTER_AUTH_URL:?BETTER_AUTH_URL is required}
            - PUBLIC_BETTER_AUTH_URL=${PUBLIC_BETTER_AUTH_URL:?PUBLIC_BETTER_AUTH_URL is required}
            - BETTER_AUTH_TRUSTED_ORIGINS=${BETTER_AUTH_TRUSTED_ORIGINS:?BETTER_AUTH_TRUSTED_ORIGINS is required}
            - GITHUB_USERNAME=${GITHUB_USERNAME:?GITHUB_USERNAME is required}
            - GITHUB_TOKEN=${GITHUB_TOKEN:?GITHUB_TOKEN is required}
            - GITHUB_TYPE=${GITHUB_TYPE:-personal}
            - GH_API_URL=${GH_API_URL:-https://api.github.com}
            - PUBLIC_REPOSITORIES=${PUBLIC_REPOSITORIES:-true}
            - PRIVATE_REPOSITORIES=${PRIVATE_REPOSITORIES:-true}
            - INCLUDE_ARCHIVED=${INCLUDE_ARCHIVED:-true}
            - INCLUDE_COLLABORATOR_REPOS=${INCLUDE_COLLABORATOR_REPOS:-false}
            - SKIP_FORKS=${SKIP_FORKS:-true}
            - MIRROR_STARRED=${MIRROR_STARRED:-false}
            - MIRROR_ORGANIZATIONS=${MIRROR_ORGANIZATIONS:-false}
            - PRESERVE_ORG_STRUCTURE=${PRESERVE_ORG_STRUCTURE:-false}
            - ONLY_MIRROR_ORGS=${ONLY_MIRROR_ORGS:-false}
            - MIRROR_STRATEGY=${MIRROR_STRATEGY:-single-org}
            - GITEA_URL=${GITEA_URL:?GITEA_URL is required}
            - GITEA_EXTERNAL_URL=${GITEA_EXTERNAL_URL:-}
            - GITEA_TOKEN=${GITEA_TOKEN:?GITEA_TOKEN is required}
            - GITEA_USERNAME=${GITEA_USERNAME:?GITEA_USERNAME is required}
            - GITEA_ORGANIZATION=${GITEA_ORGANIZATION:-github-mirrors}
            - GITEA_ORG_VISIBILITY=${GITEA_ORG_VISIBILITY:-private}
            - GITEA_CREATE_ORG=${GITEA_CREATE_ORG:-true}
            - GITEA_PRESERVE_VISIBILITY=${GITEA_PRESERVE_VISIBILITY:-true}
            - GITEA_MIRROR_INTERVAL=${GITEA_MIRROR_INTERVAL:-24h}
            - GITEA_LFS=${GITEA_LFS:-false}
            - GITEA_ADD_TOPICS=${GITEA_ADD_TOPICS:-true}
            - GITEA_FORK_STRATEGY=${GITEA_FORK_STRATEGY:-skip}
            - GITEA_SKIP_TLS_VERIFY=${GITEA_SKIP_TLS_VERIFY:-false}
            - MIRROR_RELEASES=${MIRROR_RELEASES:-false}
            - RELEASE_LIMIT=${RELEASE_LIMIT:-10}
            - MIRROR_WIKI=${MIRROR_WIKI:-false}
            - MIRROR_METADATA=${MIRROR_METADATA:-false}
            - MIRROR_ISSUES=${MIRROR_ISSUES:-false}
            - MIRROR_PULL_REQUESTS=${MIRROR_PULL_REQUESTS:-false}
            - MIRROR_LABELS=${MIRROR_LABELS:-false}
            - MIRROR_MILESTONES=${MIRROR_MILESTONES:-false}
            - MIRROR_ISSUE_CONCURRENCY=${MIRROR_ISSUE_CONCURRENCY:-1}
            - MIRROR_PULL_REQUEST_CONCURRENCY=${MIRROR_PULL_REQUEST_CONCURRENCY:-1}
            - SCHEDULE_ENABLED=${SCHEDULE_ENABLED:-true}
            - SCHEDULE_INTERVAL=${SCHEDULE_INTERVAL:-86400}
            - SCHEDULE_CONCURRENT=${SCHEDULE_CONCURRENT:-false}
            - SCHEDULE_BATCH_SIZE=${SCHEDULE_BATCH_SIZE:-10}
            - AUTO_IMPORT_REPOS=${AUTO_IMPORT_REPOS:-true}
            - AUTO_MIRROR_REPOS=${AUTO_MIRROR_REPOS:-true}
            - SCHEDULE_ONLY_MIRROR_UPDATED=${SCHEDULE_ONLY_MIRROR_UPDATED:-false}
            - SCHEDULE_SKIP_RECENTLY_MIRRORED=${SCHEDULE_SKIP_RECENTLY_MIRRORED:-true}
            - SCHEDULE_TIMEZONE=${SCHEDULE_TIMEZONE:-Asia/Shanghai}
            - CLEANUP_ENABLED=${CLEANUP_ENABLED:-false}
            - CLEANUP_DELETE_FROM_GITEA=${CLEANUP_DELETE_FROM_GITEA:-false}
            - CLEANUP_DELETE_IF_NOT_IN_GITHUB=${CLEANUP_DELETE_IF_NOT_IN_GITHUB:-false}
            - CLEANUP_ORPHANED_REPO_ACTION=${CLEANUP_ORPHANED_REPO_ACTION:-archive}
            - CLEANUP_DRY_RUN=${CLEANUP_DRY_RUN:-true}
        labels:
            createdBy: Apps
        networks:
            - 1panel-network
        ports:
            - ${HOST_IP:-127.0.0.1}:${GITEA_MIRROR_HOST_PORT:-4321}:4321
        volumes:
            - gitea-mirror-data:/app/data
        healthcheck:
            test: ["CMD-SHELL", "BASE=\"$${BASE_URL:-/}\"; if [ \"$${BASE}\" = \"/\" ]; then BASE=\"\"; else BASE=\"$${BASE%/}\"; fi; wget --no-verbose --tries=3 --spider \"http://127.0.0.1:4321$${BASE}/api/health\""]
            interval: 30s
            timeout: 10s
            start_period: 30s
            retries: 5
        logging:
            driver: json-file
            options:
                max-size: "50m"
                max-file: "3"
```

## env

```env
# 容器时区。这里直接用 TZ，不再额外引入 TIME_ZONE。
TZ=Asia/Shanghai

# Web 面板监听地址。HOST_IP=127.0.0.1 表示只暴露给本机反代，不直接公网开放 4321。
HOST_IP=127.0.0.1
GITEA_MIRROR_HOST_PORT=4321
GITEA_MIRROR_IMAGE=ghcr.io/raylabshq/gitea-mirror:v3.20.4

# gitea-mirror 自身访问地址。
# 独立域名部署时 BASE_URL=/，三个 Auth URL 都填外部 origin。
# 子路径部署时，例如 https://git.example.com/mirror：BASE_URL=/mirror，Auth URL 仍只填 https://git.example.com。
BASE_URL=/
BETTER_AUTH_URL=https://gitea-mirror.example.com
PUBLIC_BETTER_AUTH_URL=https://gitea-mirror.example.com
BETTER_AUTH_TRUSTED_ORIGINS=https://gitea-mirror.example.com

# 登录会话密钥与 token 加密密钥。
# BETTER_AUTH_SECRET 必填，建议 openssl rand -base64 32。
# ENCRYPTION_SECRET 建议固定填写，避免重建后无法解密已保存 token；可用 openssl rand -base64 48。
BETTER_AUTH_SECRET=replace-with-random-32chars
ENCRYPTION_SECRET=replace-with-random-48chars

# GitHub 源端配置。
# GITHUB_TOKEN 建议用 fine-grained token：个人仓库 All repositories，Contents Read-only，Metadata Read-only。
GITHUB_USERNAME=your-github-username
GITHUB_TOKEN=github_pat_xxxxxxxxxxxxxxxxxxxx
GITHUB_TYPE=personal
GH_API_URL=https://api.github.com

# GitHub 仓库选择策略。
# 个人代码保险库场景一般包含 public/private/archived，跳过 forks/collaborator/starred/org。
PUBLIC_REPOSITORIES=true
PRIVATE_REPOSITORIES=true
INCLUDE_ARCHIVED=true
INCLUDE_COLLABORATOR_REPOS=false
SKIP_FORKS=true
MIRROR_STARRED=false
MIRROR_ORGANIZATIONS=false
PRESERVE_ORG_STRUCTURE=false
ONLY_MIRROR_ORGS=false
MIRROR_STRATEGY=single-org

# Gitea 目标端配置。
# GITEA_URL 是容器内 API 地址，优先走 Docker 内网，例如 http://gitea:3000，不要走 Cloudflare 域名。
# GITEA_EXTERNAL_URL 是浏览器展示用外部地址。
# GITEA_TOKEN 建议使用专门 bot 用户 token：repository 读写、organization 读写、user 可读。
GITEA_URL=http://gitea:3000
GITEA_EXTERNAL_URL=https://git.example.com
GITEA_TOKEN=gitea-token-xxxxxxxxxxxxxxxxxxxx
GITEA_USERNAME=github-mirror-bot
GITEA_ORGANIZATION=github-mirrors
GITEA_ORG_VISIBILITY=private
GITEA_CREATE_ORG=true
GITEA_PRESERVE_VISIBILITY=true
GITEA_MIRROR_INTERVAL=24h
GITEA_LFS=false
GITEA_ADD_TOPICS=true
GITEA_FORK_STRATEGY=skip
GITEA_SKIP_TLS_VERIFY=false

# GitHub metadata 复制。初始建议全部关闭，只做代码 refs 镜像；稳定后再按需开启。
MIRROR_RELEASES=false
RELEASE_LIMIT=10
MIRROR_WIKI=false
MIRROR_METADATA=false
MIRROR_ISSUES=false
MIRROR_PULL_REQUESTS=false
MIRROR_LABELS=false
MIRROR_MILESTONES=false
MIRROR_ISSUE_CONCURRENCY=1
MIRROR_PULL_REQUEST_CONCURRENCY=1

# 自动发现与同步。SCHEDULE_INTERVAL=86400 表示约每天一次；首次导入多仓库时可把 batch size 降低。
SCHEDULE_ENABLED=true
SCHEDULE_INTERVAL=86400
SCHEDULE_CONCURRENT=false
SCHEDULE_BATCH_SIZE=10
AUTO_IMPORT_REPOS=true
AUTO_MIRROR_REPOS=true
SCHEDULE_ONLY_MIRROR_UPDATED=false
SCHEDULE_SKIP_RECENTLY_MIRRORED=true
SCHEDULE_TIMEZONE=Asia/Shanghai

# 清理策略。默认只保守保留，不自动删除 Gitea 仓库。
CLEANUP_ENABLED=false
CLEANUP_DELETE_FROM_GITEA=false
CLEANUP_DELETE_IF_NOT_IN_GITHUB=false
CLEANUP_ORPHANED_REPO_ACTION=archive
CLEANUP_DRY_RUN=true
```
