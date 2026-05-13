---
title: cliproxyapi
date: 2026-05-13
order: 7
---

## Github Repo

[CLIProxyAPI Github Repo](https://github.com/router-for-me/CLIProxyAPI)

官方 Docker Compose 文档：

* https://help.router-for.me/docker/docker-compose.html

官方流程是克隆仓库、复制 `config.example.yaml` 为 `config.yaml`，再执行 `docker compose up -d`。下面是按 1Panel 风格整理后的等价模板。

## docker-compose

```yaml
services:
    cli-proxy-api:
        container_name: cli-proxy-api
        image: ${CLI_PROXY_IMAGE}
        restart: unless-stopped
        environment:
            - DEPLOY=${DEPLOY}
        ports:
            - ${HOST_IP}:${CLI_PROXY_API_PORT}:8317
            - ${HOST_IP}:${CLI_PROXY_MANAGEMENT_PORT}:8085
            - ${HOST_IP}:${CLI_PROXY_EXTRA_PORT_1}:1455
            - ${HOST_IP}:${CLI_PROXY_EXTRA_PORT_2}:54545
            - ${HOST_IP}:${CLI_PROXY_EXTRA_PORT_3}:51121
            - ${HOST_IP}:${CLI_PROXY_EXTRA_PORT_4}:11451
        volumes:
            - ${CLI_PROXY_CONFIG_PATH}:/CLIProxyAPI/config.yaml
            - ${CLI_PROXY_AUTH_PATH}:/root/.cli-proxy-api
            - ${CLI_PROXY_LOG_PATH}:/CLIProxyAPI/logs
```

## env

```env
HOST_IP=127.0.0.1

CLI_PROXY_IMAGE=eceasy/cli-proxy-api:latest

CLI_PROXY_API_PORT=8317
CLI_PROXY_MANAGEMENT_PORT=8085
CLI_PROXY_EXTRA_PORT_1=1455
CLI_PROXY_EXTRA_PORT_2=54545
CLI_PROXY_EXTRA_PORT_3=51121
CLI_PROXY_EXTRA_PORT_4=11451

CLI_PROXY_CONFIG_PATH=./config.yaml
CLI_PROXY_AUTH_PATH=./auths
CLI_PROXY_LOG_PATH=./logs

DEPLOY=
```

## config.yaml

```yaml
host: "0.0.0.0"
port: 8317

auth-dir: "/root/.cli-proxy-api"

api-keys:
    - "换成 openssl rand -hex 32 生成的强随机字符串"

debug: false
logging-to-file: false

request-retry: 2
max-retry-credentials: 0

routing:
    strategy: "round-robin"

remote-management:
    allow-remote: false
    secret-key: ""
    disable-control-panel: true

commercial-mode: true
```

启动：

```bash
docker compose up -d
docker compose logs -f cli-proxy-api
```

Codex 登录，按提示复制链接到浏览器完成登录：

```bash
docker compose exec cli-proxy-api /CLIProxyAPI/CLIProxyAPI -no-browser --codex-login
```

其它登录：

```bash
docker compose exec cli-proxy-api /CLIProxyAPI/CLIProxyAPI -no-browser --login
docker compose exec cli-proxy-api /CLIProxyAPI/CLIProxyAPI -no-browser --claude-login
docker compose exec cli-proxy-api /CLIProxyAPI/CLIProxyAPI -no-browser --antigravity-login
```

测试：

```bash
curl -i http://127.0.0.1:8317/v1/models \
    -H "Authorization: Bearer 你的API_KEY"
```

OpenAI-compatible 客户端：

```text
Base URL: http://127.0.0.1:8317/v1
API Key: config.yaml 里的 api-keys
```

如果通过 Nginx / 1Panel 反代，只反代 `8317`。不要给 `/v1/*` 加 Basic Auth。
