---
title: firecrawl
---

## Github Repo

[Firecrawl Github Repo](https://github.com/firecrawl/firecrawl)

compose更新日期: 2026-10-06

## 说明

- 本模板固定使用 **NuQ PostgreSQL**，不启用 FoundationDB。
- `POSTGRES_DB` 保持为 `postgres`。当前 Firecrawl 的 `nuq-postgres` 镜像内 `pg_cron` 默认指向 `postgres` 数据库。
- `.env` 只用于 Docker Compose 变量插值，不再通过 `env_file` 整份注入各容器，避免把 `OPENAI_API_KEY`、`BULL_AUTH_KEY`、数据库密码等无关 secret 暴露给 Playwright/PostgreSQL。
- API 仅绑定宿主机 `127.0.0.1`；如果再通过 1Panel/OpenResty 反向代理到公网，需要额外配置完整的认证、TLS 与访问控制。`USE_DB_AUTHENTICATION=false` 本身不是公网认证方案。
- Firecrawl、Playwright、NuQ PostgreSQL 镜像使用本次验证时的固定 digest。升级时先检查目标 Firecrawl release 的 `docker-compose.yaml`，再将这三个镜像作为一组更新。
- PostgreSQL 使用持久卷；Redis 与 RabbitMQ 暂不持久化，适合个人/轻量自托管场景。
- `POSTGRES_PASSWORD` 与 `BULL_AUTH_KEY` 建议分别使用 `openssl rand -hex 32` 生成。

## docker-compose

```yaml
networks:
    1panel-network:
        external: true
    firecrawl-backend:
        driver: bridge

volumes:
    firecrawl-postgres-data:

x-firecrawl-api-common: &firecrawl-api-common
    image: ${FIRECRAWL_IMAGE:?FIRECRAWL_IMAGE is required}
    restart: unless-stopped
    init: true
    ulimits:
        nofile:
            soft: 65535
            hard: 65535
    extra_hosts:
        - host.docker.internal:host-gateway
    networks:
        - firecrawl-backend
    logging:
        driver: json-file
        options:
            max-size: "50m"
            max-file: "3"
            compress: "true"

x-firecrawl-api-env: &firecrawl-api-env
    TZ: ${TZ:-Asia/Shanghai}
    REDIS_URL: redis://firecrawl-redis:6379
    REDIS_RATE_LIMIT_URL: redis://firecrawl-redis:6379
    PLAYWRIGHT_MICROSERVICE_URL: http://firecrawl-playwright:3000/scrape
    POSTGRES_HOST: firecrawl-postgres
    POSTGRES_PORT: "5432"
    POSTGRES_USER: ${POSTGRES_USER:-firecrawl}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}
    POSTGRES_DB: ${POSTGRES_DB:-postgres}
    USE_DB_AUTHENTICATION: ${USE_DB_AUTHENTICATION:-false}
    NUM_WORKERS_PER_QUEUE: ${NUM_WORKERS_PER_QUEUE:-4}
    CRAWL_CONCURRENT_REQUESTS: ${CRAWL_CONCURRENT_REQUESTS:-4}
    MAX_CONCURRENT_JOBS: ${MAX_CONCURRENT_JOBS:-2}
    BROWSER_POOL_SIZE: ${BROWSER_POOL_SIZE:-2}
    BULL_AUTH_KEY: ${BULL_AUTH_KEY:?BULL_AUTH_KEY is required}
    TEST_API_KEY: ${TEST_API_KEY:-}
    OPENAI_API_KEY: ${OPENAI_API_KEY:-}
    OPENAI_BASE_URL: ${OPENAI_BASE_URL:-}
    MODEL_NAME: ${MODEL_NAME:-}
    MODEL_EMBEDDING_NAME: ${MODEL_EMBEDDING_NAME:-}
    OLLAMA_BASE_URL: ${OLLAMA_BASE_URL:-}
    PROXY_SERVER: ${PROXY_SERVER:-}
    PROXY_USERNAME: ${PROXY_USERNAME:-}
    PROXY_PASSWORD: ${PROXY_PASSWORD:-}
    SEARXNG_ENDPOINT: ${SEARXNG_ENDPOINT:-}
    SEARXNG_ENGINES: ${SEARXNG_ENGINES:-}
    SEARXNG_CATEGORIES: ${SEARXNG_CATEGORIES:-}
    LOGGING_LEVEL: ${LOGGING_LEVEL:-INFO}

services:
    firecrawl-api:
        <<: *firecrawl-api-common
        command: node dist/src/harness.js --start-docker
        environment:
            <<: *firecrawl-api-env
            HOST: 0.0.0.0
            PORT: "3002"
            INTERNAL_PORT: "3002"
            EXTRACT_WORKER_PORT: ${EXTRACT_WORKER_PORT:-3004}
            WORKER_PORT: ${WORKER_PORT:-3005}
            NUQ_RABBITMQ_URL: amqp://firecrawl-rabbitmq:5672
            HARNESS_STARTUP_TIMEOUT_MS: ${HARNESS_STARTUP_TIMEOUT_MS:-60000}
            ENV: local
        labels:
            createdBy: Apps
        networks:
            - 1panel-network
            - firecrawl-backend
        ports:
            - ${HOST_IP:-127.0.0.1}:${FIRECRAWL_HOST_PORT:-3002}:3002
        depends_on:
            firecrawl-redis:
                condition: service_started
            firecrawl-playwright:
                condition: service_started
            firecrawl-rabbitmq:
                condition: service_healthy
            firecrawl-postgres:
                condition: service_healthy
        healthcheck:
            test:
                - CMD-SHELL
                - node -e "fetch('http://127.0.0.1:3002/v0/health/liveness').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
            interval: 30s
            timeout: 10s
            start_period: 90s
            retries: 5
        cpus: ${FIRECRAWL_API_CPUS:-4.0}
        mem_limit: ${FIRECRAWL_API_MEMORY:-8G}
        memswap_limit: ${FIRECRAWL_API_MEMORY:-8G}

    firecrawl-playwright:
        image: ${FIRECRAWL_PLAYWRIGHT_IMAGE:?FIRECRAWL_PLAYWRIGHT_IMAGE is required}
        restart: unless-stopped
        init: true
        environment:
            TZ: ${TZ:-Asia/Shanghai}
            PORT: "3000"
            PROXY_SERVER: ${PROXY_SERVER:-}
            PROXY_USERNAME: ${PROXY_USERNAME:-}
            PROXY_PASSWORD: ${PROXY_PASSWORD:-}
            ALLOW_LOCAL_WEBHOOKS: ${ALLOW_LOCAL_WEBHOOKS:-false}
            BLOCK_MEDIA: ${BLOCK_MEDIA:-true}
            MAX_CONCURRENT_PAGES: ${CRAWL_CONCURRENT_REQUESTS:-4}
        networks:
            - firecrawl-backend
        security_opt:
            - no-new-privileges:true
        cap_drop:
            - ALL
        tmpfs:
            - /tmp/.cache:noexec,nosuid,size=1g
        cpus: ${FIRECRAWL_PLAYWRIGHT_CPUS:-2.0}
        mem_limit: ${FIRECRAWL_PLAYWRIGHT_MEMORY:-4G}
        memswap_limit: ${FIRECRAWL_PLAYWRIGHT_MEMORY:-4G}
        logging:
            driver: json-file
            options:
                max-size: "50m"
                max-file: "3"
                compress: "true"

    firecrawl-redis:
        image: ${FIRECRAWL_REDIS_IMAGE:-redis:alpine}
        restart: unless-stopped
        command: redis-server --bind 0.0.0.0
        networks:
            - firecrawl-backend
        logging:
            driver: json-file
            options:
                max-size: "20m"
                max-file: "2"
                compress: "true"

    firecrawl-rabbitmq:
        image: ${FIRECRAWL_RABBITMQ_IMAGE:-rabbitmq:3-management}
        restart: unless-stopped
        command: rabbitmq-server
        networks:
            - firecrawl-backend
        healthcheck:
            test: ["CMD", "rabbitmq-diagnostics", "-q", "check_running"]
            interval: 5s
            timeout: 5s
            start_period: 5s
            retries: 5
        logging:
            driver: json-file
            options:
                max-size: "20m"
                max-file: "2"
                compress: "true"

    firecrawl-postgres:
        image: ${FIRECRAWL_NUQ_POSTGRES_IMAGE:?FIRECRAWL_NUQ_POSTGRES_IMAGE is required}
        restart: unless-stopped
        environment:
            TZ: ${TZ:-Asia/Shanghai}
            POSTGRES_USER: ${POSTGRES_USER:-firecrawl}
            POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}
            POSTGRES_DB: ${POSTGRES_DB:-postgres}
        healthcheck:
            test:
                - CMD-SHELL
                - pg_isready -U ${POSTGRES_USER:-firecrawl} -d ${POSTGRES_DB:-postgres}
            interval: 5s
            timeout: 5s
            start_period: 5s
            retries: 10
        networks:
            - firecrawl-backend
        volumes:
            - firecrawl-postgres-data:/var/lib/postgresql/data
        logging:
            driver: json-file
            options:
                max-size: "20m"
                max-file: "2"
                compress: "true"
```

## env

```env
TZ=Asia/Shanghai

HOST_IP=127.0.0.1
FIRECRAWL_HOST_PORT=3002

# Firecrawl image snapshot verified on 2026-10-06.
# When upgrading, review the target Firecrawl release's docker-compose.yaml and update
# Firecrawl / Playwright / NuQ PostgreSQL together.
FIRECRAWL_IMAGE=ghcr.io/firecrawl/firecrawl:2.11.334-production@sha256:70453d7102cce7000f4e8e80bd11e3e1353cdc9a0b87bb4cd1d4e8edf5a65744
FIRECRAWL_PLAYWRIGHT_IMAGE=ghcr.io/firecrawl/playwright-service:latest@sha256:0f462e0915631c77f9eb8117bbfa75dcce48ac999a6358ba97a262869ae9ace9
FIRECRAWL_NUQ_POSTGRES_IMAGE=ghcr.io/firecrawl/nuq-postgres:latest@sha256:aed86f62858f29bd971abddcdeb301c12888098d2cf5d33c1ba42b053bc460f6
FIRECRAWL_REDIS_IMAGE=redis:alpine
FIRECRAWL_RABBITMQ_IMAGE=rabbitmq:3-management

POSTGRES_USER=firecrawl
# Generate with: openssl rand -hex 32
POSTGRES_PASSWORD=replace-with-random-postgres-password
# Keep `postgres` unless you also change the bundled pg_cron configuration.
POSTGRES_DB=postgres

# This is the simple self-host baseline. It is NOT a complete public API auth layer.
USE_DB_AUTHENTICATION=false

# Generate with: openssl rand -hex 32
BULL_AUTH_KEY=replace-with-hex-admin-key
TEST_API_KEY=

NUM_WORKERS_PER_QUEUE=4
CRAWL_CONCURRENT_REQUESTS=4
MAX_CONCURRENT_JOBS=2
BROWSER_POOL_SIZE=2

FIRECRAWL_API_CPUS=4.0
FIRECRAWL_API_MEMORY=8G
FIRECRAWL_PLAYWRIGHT_CPUS=2.0
FIRECRAWL_PLAYWRIGHT_MEMORY=4G

LOGGING_LEVEL=INFO
BLOCK_MEDIA=true
ALLOW_LOCAL_WEBHOOKS=false
HARNESS_STARTUP_TIMEOUT_MS=60000

OPENAI_API_KEY=
OPENAI_BASE_URL=
MODEL_NAME=
MODEL_EMBEDDING_NAME=
OLLAMA_BASE_URL=

PROXY_SERVER=
PROXY_USERNAME=
PROXY_PASSWORD=

SEARXNG_ENDPOINT=
SEARXNG_ENGINES=
SEARXNG_CATEGORIES=

EXTRACT_WORKER_PORT=3004
WORKER_PORT=3005
```
