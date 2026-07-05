---
title: gitea
---

## Github Repo

[Gitea Github Repo](https://github.com/go-gitea/gitea)

compose更新日期: 2026-07-05

## docker-compose

```yaml
networks:
    1panel-network:
        external: true

services:
    gitea:
        image: ${GITEA_IMAGE:-docker.gitea.com/gitea:1.26.4}
        container_name: gitea
        restart: unless-stopped
        env_file:
            - .env
        environment:
            - USER_UID=${USER_UID:-1000}
            - USER_GID=${USER_GID:-1000}
            - TZ=${TZ:-Asia/Shanghai}
            - GITEA__server__DOMAIN=${GITEA_DOMAIN:?GITEA_DOMAIN is required}
            - GITEA__server__ROOT_URL=${GITEA_ROOT_URL:?GITEA_ROOT_URL is required}
            - GITEA__server__HTTP_PORT=3000
            - GITEA__server__SSH_DOMAIN=${GITEA_SSH_DOMAIN:?GITEA_SSH_DOMAIN is required}
            - GITEA__server__SSH_PORT=${GITEA_SSH_PORT:-2222}
            - GITEA__server__DISABLE_SSH=false
            - GITEA__server__OFFLINE_MODE=${GITEA_OFFLINE_MODE:-true}
            - GITEA__database__DB_TYPE=sqlite3
            - GITEA__database__PATH=/data/gitea/gitea.db
            - GITEA__service__DISABLE_REGISTRATION=${GITEA_DISABLE_REGISTRATION:-true}
            - GITEA__service__REQUIRE_SIGNIN_VIEW=${GITEA_REQUIRE_SIGNIN_VIEW:-true}
            - GITEA__service__REGISTER_EMAIL_CONFIRM=${GITEA_REGISTER_EMAIL_CONFIRM:-false}
            - GITEA__actions__ENABLED=${GITEA_ACTIONS_ENABLED:-false}
            - GITEA__packages__ENABLED=${GITEA_PACKAGES_ENABLED:-true}
            - GITEA__repository__ENABLE_PUSH_CREATE_USER=${GITEA_ENABLE_PUSH_CREATE_USER:-false}
            - GITEA__repository__ENABLE_PUSH_CREATE_ORG=${GITEA_ENABLE_PUSH_CREATE_ORG:-false}
            - GITEA__log__LEVEL=${GITEA_LOG_LEVEL:-Info}
        labels:
            createdBy: Apps
        networks:
            - 1panel-network
        ports:
            - ${HOST_IP:-127.0.0.1}:${GITEA_HTTP_HOST_PORT:-3000}:3000
            - ${GITEA_SSH_BIND_IP:-0.0.0.0}:${GITEA_SSH_HOST_PORT:-2222}:22
        volumes:
            - ./data:/data
            - /etc/timezone:/etc/timezone:ro
            - /etc/localtime:/etc/localtime:ro
        healthcheck:
            test: ["CMD", "curl", "-f", "http://127.0.0.1:3000/api/healthz"]
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
GITEA_HTTP_HOST_PORT=3000

GITEA_SSH_BIND_IP=0.0.0.0
GITEA_SSH_HOST_PORT=2222
GITEA_SSH_PORT=2222

USER_UID=1000
USER_GID=1000

GITEA_IMAGE=docker.gitea.com/gitea:1.26.4

GITEA_DOMAIN=git.example.com
GITEA_SSH_DOMAIN=git.example.com
GITEA_ROOT_URL=https://git.example.com/

GITEA_DISABLE_REGISTRATION=true
GITEA_REQUIRE_SIGNIN_VIEW=true
GITEA_REGISTER_EMAIL_CONFIRM=false

GITEA_ACTIONS_ENABLED=false
GITEA_PACKAGES_ENABLED=true

GITEA_ENABLE_PUSH_CREATE_USER=false
GITEA_ENABLE_PUSH_CREATE_ORG=false

GITEA_OFFLINE_MODE=true
GITEA_LOG_LEVEL=Info
```
