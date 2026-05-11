---
title: hermes-agent
date: 2026-5-11
order: 1
---

## Github Repo

[Hermes Agent Github Repo](https://github.com/NousResearch/hermes-agent)

## docker-compose

```yaml
networks:
    1panel-network:
        external: true

services:
    hermes:
        container_name: hermes-agent
        image: nousresearch/hermes-agent:latest
        restart: unless-stopped
        command: ["gateway", "run"]
        env_file:
            - .env
        environment:
            - TZ=${TIME_ZONE}
            - HERMES_UID=${HERMES_UID}
            - HERMES_GID=${HERMES_GID}
            - HERMES_DASHBOARD=${HERMES_DASHBOARD}
            - HERMES_DASHBOARD_HOST=${HERMES_DASHBOARD_HOST}
            - HERMES_DASHBOARD_PORT=${HERMES_DASHBOARD_PORT}
            - HERMES_DASHBOARD_TUI=${HERMES_DASHBOARD_TUI}
            - HERMES_INFERENCE_PROVIDER=${HERMES_INFERENCE_PROVIDER}
            - API_SERVER_ENABLED=${API_SERVER_ENABLED}
            - API_SERVER_HOST=${API_SERVER_HOST}
            - API_SERVER_KEY=${API_SERVER_KEY}
            - API_SERVER_CORS_ORIGINS=${API_SERVER_CORS_ORIGINS}
            - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
            - OPENAI_API_KEY=${OPENAI_API_KEY}
            - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
            - GOOGLE_API_KEY=${GOOGLE_API_KEY}
            - GEMINI_API_KEY=${GEMINI_API_KEY}
            - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
            - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
            - TELEGRAM_ALLOWED_USERS=${TELEGRAM_ALLOWED_USERS}
        labels:
            createdBy: Apps
        networks:
            - 1panel-network
        ports:
            - ${HOST_IP}:${HERMES_API_HOST_PORT}:8642
            - ${HOST_IP}:${HERMES_DASHBOARD_HOST_PORT}:9119
        volumes:
            - ./data:/opt/data
        shm_size: 1g
        healthcheck:
            test: ["CMD", "python3", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8642/health', timeout=3)"]
            interval: 30s
            timeout: 5s
            start_period: 20s
            retries: 3
```

## env

```
TIME_ZONE=Asia/Shanghai
HOST_IP=127.0.0.1

HERMES_API_HOST_PORT=8642
HERMES_DASHBOARD_HOST_PORT=9119

HERMES_UID=10000
HERMES_GID=10000

HERMES_DASHBOARD=1
HERMES_DASHBOARD_HOST=0.0.0.0
HERMES_DASHBOARD_PORT=9119
HERMES_DASHBOARD_TUI=1
HERMES_INFERENCE_PROVIDER=deepseek

API_SERVER_ENABLED=true
API_SERVER_HOST=0.0.0.0
API_SERVER_KEY=换成至少8位以上的强随机字符串
API_SERVER_CORS_ORIGINS=*

# 模型服务 Key：至少填一个
OPENROUTER_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
GEMINI_API_KEY=
DEEPSEEK_API_KEY=

# Telegram，可选
TELEGRAM_BOT_TOKEN=
TELEGRAM_ALLOWED_USERS=
```

**不要直接把 9119 / 8642 暴露到公网，建议 `HOST_IP=127.0.0.1` 后再通过 1Panel 反代访问。**

**如果想要让Hermes管理更多文件夹/文件，就用volumes挂载进容器**
