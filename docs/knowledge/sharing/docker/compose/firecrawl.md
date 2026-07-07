---
title: firecrawl
---

## Github Repo

[Firecrawl Github Repo](https://github.com/firecrawl/firecrawl)

compose更新日期: 2026-07-07

## docker-compose

```yaml
networks:
    1panel-network:
        external: true
    firecrawl-backend:
        driver: bridge

volumes:
    firecrawl-postgres-data:
    firecrawl-fdb-data:
    firecrawl-fdb-cluster-file:

x-firecrawl-api-common: &firecrawl-api-common
    image: ${FIRECRAWL_IMAGE:-ghcr.io/firecrawl/firecrawl:latest}
    restart: unless-stopped
    env_file:
        - .env
    environment:
        - TZ=${TZ:-Asia/Shanghai}
        - REDIS_URL=redis://firecrawl-redis:6379
        - REDIS_RATE_LIMIT_URL=redis://firecrawl-redis:6379
        - PLAYWRIGHT_MICROSERVICE_URL=http://firecrawl-playwright:3000/scrape
        - POSTGRES_HOST=firecrawl-postgres
        - POSTGRES_PORT=5432
        - POSTGRES_USER=${POSTGRES_USER:-firecrawl}
        - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}
        - POSTGRES_DB=${POSTGRES_DB:-firecrawl}
        - USE_DB_AUTHENTICATION=${USE_DB_AUTHENTICATION:-false}
        - NUM_WORKERS_PER_QUEUE=${NUM_WORKERS_PER_QUEUE:-4}
        - CRAWL_CONCURRENT_REQUESTS=${CRAWL_CONCURRENT_REQUESTS:-4}
        - MAX_CONCURRENT_JOBS=${MAX_CONCURRENT_JOBS:-2}
        - BROWSER_POOL_SIZE=${BROWSER_POOL_SIZE:-2}
        - BULL_AUTH_KEY=${BULL_AUTH_KEY:?BULL_AUTH_KEY is required}
        - TEST_API_KEY=${TEST_API_KEY:-}
        - OPENAI_API_KEY=${OPENAI_API_KEY:-}
        - OPENAI_BASE_URL=${OPENAI_BASE_URL:-}
        - MODEL_NAME=${MODEL_NAME:-}
        - MODEL_EMBEDDING_NAME=${MODEL_EMBEDDING_NAME:-}
        - OLLAMA_BASE_URL=${OLLAMA_BASE_URL:-}
        - PROXY_SERVER=${PROXY_SERVER:-}
        - PROXY_USERNAME=${PROXY_USERNAME:-}
        - PROXY_PASSWORD=${PROXY_PASSWORD:-}
        - SEARXNG_ENDPOINT=${SEARXNG_ENDPOINT:-}
        - SEARXNG_ENGINES=${SEARXNG_ENGINES:-}
        - SEARXNG_CATEGORIES=${SEARXNG_CATEGORIES:-}
        - LOGGING_LEVEL=${LOGGING_LEVEL:-INFO}
        - NUQ_BACKEND=${NUQ_BACKEND:-}
        - FDB_CLUSTER_FILE=${NUQ_BACKEND:+/var/fdb/fdb.cluster}
    ulimits:
        nofile:
            soft: 65535
            hard: 65535
    extra_hosts:
        - host.docker.internal:host-gateway
    networks:
        - firecrawl-backend
    volumes:
        - firecrawl-fdb-cluster-file:/var/fdb:ro
    logging:
        driver: json-file
        options:
            max-size: "50m"
            max-file: "3"

services:
    firecrawl-api:
        <<: *firecrawl-api-common
        container_name: firecrawl-api
        command: node dist/src/harness.js --start-docker
        environment:
            - TZ=${TZ:-Asia/Shanghai}
            - HOST=0.0.0.0
            - PORT=3002
            - INTERNAL_PORT=3002
            - EXTRACT_WORKER_PORT=${EXTRACT_WORKER_PORT:-3004}
            - WORKER_PORT=${WORKER_PORT:-3005}
            - ENV=local
            - REDIS_URL=redis://firecrawl-redis:6379
            - REDIS_RATE_LIMIT_URL=redis://firecrawl-redis:6379
            - PLAYWRIGHT_MICROSERVICE_URL=http://firecrawl-playwright:3000/scrape
            - POSTGRES_HOST=firecrawl-postgres
            - POSTGRES_PORT=5432
            - POSTGRES_USER=${POSTGRES_USER:-firecrawl}
            - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}
            - POSTGRES_DB=${POSTGRES_DB:-firecrawl}
            - USE_DB_AUTHENTICATION=${USE_DB_AUTHENTICATION:-false}
            - NUM_WORKERS_PER_QUEUE=${NUM_WORKERS_PER_QUEUE:-4}
            - CRAWL_CONCURRENT_REQUESTS=${CRAWL_CONCURRENT_REQUESTS:-4}
            - MAX_CONCURRENT_JOBS=${MAX_CONCURRENT_JOBS:-2}
            - BROWSER_POOL_SIZE=${BROWSER_POOL_SIZE:-2}
            - BULL_AUTH_KEY=${BULL_AUTH_KEY:?BULL_AUTH_KEY is required}
            - TEST_API_KEY=${TEST_API_KEY:-}
            - OPENAI_API_KEY=${OPENAI_API_KEY:-}
            - OPENAI_BASE_URL=${OPENAI_BASE_URL:-}
            - MODEL_NAME=${MODEL_NAME:-}
            - MODEL_EMBEDDING_NAME=${MODEL_EMBEDDING_NAME:-}
            - OLLAMA_BASE_URL=${OLLAMA_BASE_URL:-}
            - PROXY_SERVER=${PROXY_SERVER:-}
            - PROXY_USERNAME=${PROXY_USERNAME:-}
            - PROXY_PASSWORD=${PROXY_PASSWORD:-}
            - SEARXNG_ENDPOINT=${SEARXNG_ENDPOINT:-}
            - SEARXNG_ENGINES=${SEARXNG_ENGINES:-}
            - SEARXNG_CATEGORIES=${SEARXNG_CATEGORIES:-}
            - LOGGING_LEVEL=${LOGGING_LEVEL:-INFO}
            - NUQ_BACKEND=${NUQ_BACKEND:-}
            - FDB_CLUSTER_FILE=${NUQ_BACKEND:+/var/fdb/fdb.cluster}
            - NUQ_RABBITMQ_URL=amqp://firecrawl-rabbitmq:5672
            - HARNESS_STARTUP_TIMEOUT_MS=${HARNESS_STARTUP_TIMEOUT_MS:-60000}
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
                condition: service_started
        healthcheck:
            test: ["CMD-SHELL", "node -e \"fetch('http://127.0.0.1:3002/').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))\""]
            interval: 30s
            timeout: 10s
            start_period: 90s
            retries: 5
        cpus: ${FIRECRAWL_API_CPUS:-4.0}
        mem_limit: ${FIRECRAWL_API_MEMORY:-8G}
        memswap_limit: ${FIRECRAWL_API_MEMORY:-8G}

    firecrawl-playwright:
        image: ${FIRECRAWL_PLAYWRIGHT_IMAGE:-ghcr.io/firecrawl/playwright-service:latest}
        container_name: firecrawl-playwright
        restart: unless-stopped
        env_file:
            - .env
        environment:
            - TZ=${TZ:-Asia/Shanghai}
            - PORT=3000
            - PROXY_SERVER=${PROXY_SERVER:-}
            - PROXY_USERNAME=${PROXY_USERNAME:-}
            - PROXY_PASSWORD=${PROXY_PASSWORD:-}
            - ALLOW_LOCAL_WEBHOOKS=${ALLOW_LOCAL_WEBHOOKS:-false}
            - BLOCK_MEDIA=${BLOCK_MEDIA:-true}
            - MAX_CONCURRENT_PAGES=${CRAWL_CONCURRENT_REQUESTS:-4}
        networks:
            - firecrawl-backend
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

    firecrawl-redis:
        image: ${FIRECRAWL_REDIS_IMAGE:-redis:alpine}
        container_name: firecrawl-redis
        restart: unless-stopped
        command: redis-server --bind 0.0.0.0
        networks:
            - firecrawl-backend
        logging:
            driver: json-file
            options:
                max-size: "20m"
                max-file: "2"

    firecrawl-rabbitmq:
        image: ${FIRECRAWL_RABBITMQ_IMAGE:-rabbitmq:3-management}
        container_name: firecrawl-rabbitmq
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

    firecrawl-postgres:
        image: ${FIRECRAWL_NUQ_POSTGRES_IMAGE:-ghcr.io/firecrawl/nuq-postgres:latest}
        container_name: firecrawl-postgres
        restart: unless-stopped
        env_file:
            - .env
        environment:
            - TZ=${TZ:-Asia/Shanghai}
            - POSTGRES_USER=${POSTGRES_USER:-firecrawl}
            - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}
            - POSTGRES_DB=${POSTGRES_DB:-firecrawl}
        networks:
            - firecrawl-backend
        volumes:
            - firecrawl-postgres-data:/var/lib/postgresql/data
        logging:
            driver: json-file
            options:
                max-size: "20m"
                max-file: "2"

    firecrawl-foundationdb:
        image: ${FIRECRAWL_FOUNDATIONDB_IMAGE:-foundationdb/foundationdb:7.3.63}
        container_name: firecrawl-foundationdb
        restart: unless-stopped
        environment:
            - FDB_NETWORKING_MODE=container
            - FDB_COORDINATOR_PORT=4500
        networks:
            - firecrawl-backend
        volumes:
            - firecrawl-fdb-data:/var/fdb/data
            - firecrawl-fdb-cluster-file:/var/fdb
        logging:
            driver: json-file
            options:
                max-size: "20m"
                max-file: "2"

    firecrawl-foundationdb-init:
        image: ${FIRECRAWL_FOUNDATIONDB_IMAGE:-foundationdb/foundationdb:7.3.63}
        container_name: firecrawl-foundationdb-init
        restart: "no"
        depends_on:
            - firecrawl-foundationdb
        entrypoint:
            - /bin/bash
            - -c
            - "sleep 5 && out=$$(fdbcli -C /var/fdb/fdb.cluster --exec 'configure new single ssd' 2>&1); status=$$?; printf '%s\n' \"$$out\"; if [ \"$$status\" -eq 0 ]; then exit 0; fi; printf '%s\n' \"$$out\" | grep -Eiq 'already.*configured|database.*configured'"
        networks:
            - firecrawl-backend
        volumes:
            - firecrawl-fdb-cluster-file:/var/fdb
```

## env

```env
TZ=Asia/Shanghai

HOST_IP=127.0.0.1
FIRECRAWL_HOST_PORT=3002

FIRECRAWL_IMAGE=ghcr.io/firecrawl/firecrawl:latest
FIRECRAWL_PLAYWRIGHT_IMAGE=ghcr.io/firecrawl/playwright-service:latest
FIRECRAWL_NUQ_POSTGRES_IMAGE=ghcr.io/firecrawl/nuq-postgres:latest
FIRECRAWL_REDIS_IMAGE=redis:alpine
FIRECRAWL_RABBITMQ_IMAGE=rabbitmq:3-management
FIRECRAWL_FOUNDATIONDB_IMAGE=foundationdb/foundationdb:7.3.63

POSTGRES_USER=firecrawl
POSTGRES_PASSWORD=replace-with-random-postgres-password
POSTGRES_DB=firecrawl

USE_DB_AUTHENTICATION=false
# URL/path-safe only; hex from `openssl rand -hex 32` is safest.
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

NUQ_BACKEND=
EXTRACT_WORKER_PORT=3004
WORKER_PORT=3005
```
