---
title: openclaw
---

## Github Repo

[OpenClaw Github Repo](https://github.com/openclaw/openclaw)

compose更新日期: 2026-05-11

## docker-compose

```yaml
networks:
    1panel-network:
        external: true

services:
    openclaw-gateway:
        container_name: openclaw-gateway
        image: ${OPENCLAW_IMAGE}
        restart: unless-stopped
        init: true
        env_file:
            - .env
        environment:
            HOME: /home/node
            TERM: xterm-256color
            TZ: ${TIME_ZONE}
            OPENCLAW_CONFIG_DIR: /home/node/.openclaw
            OPENCLAW_WORKSPACE_DIR: /home/node/.openclaw/workspace
            OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
            OPENCLAW_ALLOW_INSECURE_PRIVATE_WS: ${OPENCLAW_ALLOW_INSECURE_PRIVATE_WS}
            OPENCLAW_DISABLE_BONJOUR: ${OPENCLAW_DISABLE_BONJOUR}
            OPENAI_API_KEY: ${OPENAI_API_KEY}
            ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
            OPENROUTER_API_KEY: ${OPENROUTER_API_KEY}
            GOOGLE_API_KEY: ${GOOGLE_API_KEY}
            GEMINI_API_KEY: ${GEMINI_API_KEY}
            DEEPSEEK_API_KEY: ${DEEPSEEK_API_KEY}
        labels:
            createdBy: Apps
        networks:
            - 1panel-network
        ports:
            - ${HOST_IP}:${OPENCLAW_GATEWAY_HOST_PORT}:18789
            - ${HOST_IP}:${OPENCLAW_BRIDGE_HOST_PORT}:18790
        volumes:
            - ./config:/home/node/.openclaw
            - ./workspace:/home/node/.openclaw/workspace
        cap_drop:
            - NET_RAW
            - NET_ADMIN
        security_opt:
            - no-new-privileges:true
        extra_hosts:
            - "host.docker.internal:host-gateway"
        command:
            [
                "node",
                "dist/index.js",
                "gateway",
                "--bind",
                "${OPENCLAW_GATEWAY_BIND}",
                "--port",
                "18789",
            ]
        healthcheck:
            test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:18789/healthz').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
            interval: 30s
            timeout: 5s
            start_period: 20s
            retries: 5

    openclaw-cli:
        image: ${OPENCLAW_IMAGE}
        env_file:
            - .env
        network_mode: "service:openclaw-gateway"
        init: true
        stdin_open: true
        tty: true
        environment:
            HOME: /home/node
            TERM: xterm-256color
            TZ: ${TIME_ZONE}
            BROWSER: echo
            OPENCLAW_CONFIG_DIR: /home/node/.openclaw
            OPENCLAW_WORKSPACE_DIR: /home/node/.openclaw/workspace
            OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
            OPENCLAW_ALLOW_INSECURE_PRIVATE_WS: ${OPENCLAW_ALLOW_INSECURE_PRIVATE_WS}
            OPENAI_API_KEY: ${OPENAI_API_KEY}
            ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
            OPENROUTER_API_KEY: ${OPENROUTER_API_KEY}
            GOOGLE_API_KEY: ${GOOGLE_API_KEY}
            GEMINI_API_KEY: ${GEMINI_API_KEY}
            DEEPSEEK_API_KEY: ${DEEPSEEK_API_KEY}
        volumes:
            - ./config:/home/node/.openclaw
            - ./workspace:/home/node/.openclaw/workspace
        cap_drop:
            - NET_RAW
            - NET_ADMIN
        security_opt:
            - no-new-privileges:true
        entrypoint: ["node", "dist/index.js"]
        depends_on:
            - openclaw-gateway
```

## env

```env
TIME_ZONE=Asia/Shanghai
HOST_IP=127.0.0.1

OPENCLAW_IMAGE=ghcr.io/openclaw/openclaw:latest
OPENCLAW_GATEWAY_HOST_PORT=18789
OPENCLAW_BRIDGE_HOST_PORT=18790
OPENCLAW_GATEWAY_BIND=lan
OPENCLAW_GATEWAY_TOKEN=换成强随机字符串
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=
OPENCLAW_DISABLE_BONJOUR=1

# 模型服务 Key：至少填一个，或在 onboard 中配置 OAuth / API key
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
OPENROUTER_API_KEY=
GOOGLE_API_KEY=
GEMINI_API_KEY=
DEEPSEEK_API_KEY=
```

## 初始化

首次启动前，先生成 token：

```bash
openssl rand -hex 32
```

然后执行 onboarding：

```bash
docker compose run --rm --no-deps --entrypoint node openclaw-gateway dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d
```

后台启动后，日常命令通过 `openclaw-cli` 执行：

```bash
docker compose run --rm openclaw-cli dashboard --no-open
docker compose run --rm openclaw-cli channels login
docker compose run --rm openclaw-cli channels add
docker compose run --rm openclaw-cli doctor
```

**不要直接把 18789 暴露到公网，建议 `HOST_IP=127.0.0.1` 后再通过 1Panel 反代访问。**

**如果想让 OpenClaw 管理更多文件夹/文件，就用 volumes 挂载进容器。**
