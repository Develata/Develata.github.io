---
title: RSSHub
date: 2026-05-29
order: 8
---

## Github Repo

[RSSHub Github Repo](https://github.com/DIYgod/RSSHub)

官方部署文档：

* https://docs.rsshub.app/deploy/
* https://docs.rsshub.app/deploy/config

## docker-compose

```yaml
networks:
    1panel-network:
        external: true

    rsshub-internal:
        driver: bridge
        internal: true

services:
    rsshub:
        image: ${RSSHUB_IMAGE:-diygod/rsshub:latest}
        container_name: rsshub
        restart: unless-stopped
        security_opt:
            - no-new-privileges:true
        env_file:
            - .env
        environment:
            - NODE_ENV=production
            - PORT=1200
            - TZ=${TIME_ZONE:-Asia/Shanghai}
            - CACHE_TYPE=redis
            - REDIS_URL=redis://:${REDIS_PASSWORD:?REDIS_PASSWORD is required}@rsshub-redis:6379/
            - CACHE_EXPIRE=${CACHE_EXPIRE:-1800}
            - CACHE_CONTENT_EXPIRE=${CACHE_CONTENT_EXPIRE:-14400}
            - PLAYWRIGHT_WS_ENDPOINT=ws://rsshub-browserless:3000
            - REQUEST_RETRY=${REQUEST_RETRY:-2}
            - REQUEST_TIMEOUT=${REQUEST_TIMEOUT:-10000}
            - UA=${UA:-Mozilla/5.0 AppleWebKit/537.36 Chrome/120.0 Safari/537.36}
            - ACCESS_KEY=${ACCESS_KEY:?ACCESS_KEY is required}
            - LOGGER_LEVEL=${LOGGER_LEVEL:-info}
            - NO_LOGFILES=${NO_LOGFILES:-true}
        labels:
            createdBy: Apps
        networks:
            - 1panel-network
            - rsshub-internal
        ports:
            - ${HOST_IP:-127.0.0.1}:${RSSHUB_HOST_PORT:-1200}:1200
        depends_on:
            rsshub-redis:
                condition: service_healthy
            rsshub-browserless:
                condition: service_healthy
        healthcheck:
            test: ["CMD-SHELL", "curl -f \"http://127.0.0.1:1200/healthz?key=$${ACCESS_KEY}\""]
            interval: 30s
            timeout: 10s
            start_period: 30s
            retries: 5

    rsshub-redis:
        image: redis:alpine
        container_name: rsshub-redis
        restart: unless-stopped
        env_file:
            - .env
        environment:
            - REDIS_PASSWORD=${REDIS_PASSWORD:?REDIS_PASSWORD is required}
        command:
            - redis-server
            - --appendonly
            - "yes"
            - --requirepass
            - ${REDIS_PASSWORD:?REDIS_PASSWORD is required}
        volumes:
            - ./redis_data:/data
        networks:
            - rsshub-internal
        healthcheck:
            test: ["CMD-SHELL", "redis-cli -a \"$${REDIS_PASSWORD}\" ping | grep PONG"]
            interval: 30s
            timeout: 10s
            start_period: 5s
            retries: 5

    rsshub-browserless:
        image: browserless/chrome:latest
        container_name: rsshub-browserless
        restart: unless-stopped
        shm_size: 1gb
        ulimits:
            core:
                hard: 0
                soft: 0
        networks:
            - rsshub-internal
        healthcheck:
            test: ["CMD", "curl", "-f", "http://127.0.0.1:3000/pressure"]
            interval: 30s
            timeout: 10s
            start_period: 30s
            retries: 5
```

## env

```env
TIME_ZONE=Asia/Shanghai

HOST_IP=127.0.0.1
RSSHUB_HOST_PORT=1200

RSSHUB_IMAGE=diygod/rsshub:latest

REDIS_PASSWORD=请替换为强随机密码
ACCESS_KEY=请替换为强随机访问密钥

CACHE_EXPIRE=1800
CACHE_CONTENT_EXPIRE=14400

REQUEST_RETRY=2
REQUEST_TIMEOUT=10000

LOGGER_LEVEL=info
NO_LOGFILES=true
```

`ACCESS_KEY` 开启后，healthcheck 必须访问 `/healthz?key=$${ACCESS_KEY}`。这里要写 `$${ACCESS_KEY}`，让变量留到容器内部 shell 解析；不要写成 `${ACCESS_KEY}`。

RSS 路由也要带 key：

```text
https://rsshub.example.com/github/repos/DIYgod/RSSHub/releases?key=你的_ACCESS_KEY
```

`HOST_IP=127.0.0.1` 表示只监听本机端口，建议通过 1Panel / OpenResty / Nginx 反代访问，不要直接把 `1200` 暴露到公网。

