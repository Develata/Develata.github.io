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

services:
    gitea-mirror:
        image: ${GITEA_MIRROR_IMAGE:-ghcr.io/raylabshq/gitea-mirror:v3.20.4}
        container_name: gitea-mirror
        restart: unless-stopped
        user: ${PUID:-1000}:${PGID:-1000}
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
            - ENCRYPTION_SECRET=${ENCRYPTION_SECRET:?ENCRYPTION_SECRET is required}
            - BETTER_AUTH_URL=${BETTER_AUTH_URL:?BETTER_AUTH_URL is required}
            - PUBLIC_BETTER_AUTH_URL=${PUBLIC_BETTER_AUTH_URL:?PUBLIC_BETTER_AUTH_URL is required}
            - BETTER_AUTH_TRUSTED_ORIGINS=${BETTER_AUTH_TRUSTED_ORIGINS:?BETTER_AUTH_TRUSTED_ORIGINS is required}
        labels:
            createdBy: Apps
        networks:
            - 1panel-network
        ports:
            - ${HOST_IP:-127.0.0.1}:${GITEA_MIRROR_HOST_PORT:-4321}:4321
        volumes:
            - ./data:/app/data
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

PUID=1000
PGID=1000

BETTER_AUTH_SECRET=请替换为32字符以上随机字符串
ENCRYPTION_SECRET=请替换为48字符左右随机字符串

BASE_URL=/
BETTER_AUTH_URL=https://gitea-mirror.example.com
PUBLIC_BETTER_AUTH_URL=https://gitea-mirror.example.com
BETTER_AUTH_TRUSTED_ORIGINS=https://gitea-mirror.example.com
```
