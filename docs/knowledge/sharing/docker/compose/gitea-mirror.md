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
TZ=Asia/Shanghai

HOST_IP=127.0.0.1
GITEA_MIRROR_HOST_PORT=4321
GITEA_MIRROR_IMAGE=ghcr.io/raylabshq/gitea-mirror:v3.20.4

BASE_URL=/
BETTER_AUTH_URL=https://gitea-mirror.example.com
PUBLIC_BETTER_AUTH_URL=https://gitea-mirror.example.com
BETTER_AUTH_TRUSTED_ORIGINS=https://gitea-mirror.example.com
BETTER_AUTH_SECRET=请替换为32字符以上随机字符串
ENCRYPTION_SECRET=请替换为48字符左右随机字符串

GITHUB_USERNAME=your-github-username
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_TYPE=personal
GH_API_URL=https://api.github.com
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

GITEA_URL=https://git.example.com
GITEA_EXTERNAL_URL=https://git.example.com
GITEA_TOKEN=xxxxxxxxxxxxxxxxxxxx
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

SCHEDULE_ENABLED=true
SCHEDULE_INTERVAL=86400
SCHEDULE_CONCURRENT=false
SCHEDULE_BATCH_SIZE=10
AUTO_IMPORT_REPOS=true
AUTO_MIRROR_REPOS=true
SCHEDULE_ONLY_MIRROR_UPDATED=false
SCHEDULE_SKIP_RECENTLY_MIRRORED=true
SCHEDULE_TIMEZONE=Asia/Shanghai

CLEANUP_ENABLED=false
CLEANUP_DELETE_FROM_GITEA=false
CLEANUP_DELETE_IF_NOT_IN_GITHUB=false
CLEANUP_ORPHANED_REPO_ACTION=archive
CLEANUP_DRY_RUN=true
```
