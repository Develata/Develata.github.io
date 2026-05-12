---
title: astrbot
date: 2026-05-12
order: 5
---

## Github Repo

[AstrBot Github Repo](https://github.com/AstrBotDevs/AstrBot)

## docker-compose

```yaml
networks:
    1panel-network:
        external: true

services:
    astrbot:
        container_name: astrbot
        image: ${ASTRBOT_IMAGE}
        restart: unless-stopped
        security_opt:
            - no-new-privileges:true
        env_file:
            - .env
        environment:
            - TZ=${TIME_ZONE}
        labels:
            createdBy: Apps
        networks:
            - 1panel-network
        extra_hosts:
            - "host.docker.internal:host-gateway"
        ports:
            - ${HOST_IP}:${ASTRBOT_WEBUI_HOST_PORT}:6185
            - ${HOST_IP}:${ASTRBOT_ONEBOT_HOST_PORT}:6199
            - ${HOST_IP}:${ASTRBOT_WECHAT_CALLBACK_HOST_PORT}:11451
        volumes:
            - ./data:/AstrBot/data
        healthcheck:
            test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:6185', timeout=5)"]
            interval: 30s
            timeout: 8s
            start_period: 40s
            retries: 5
```

## env

```env
TIME_ZONE=Asia/Shanghai
HOST_IP=127.0.0.1

ASTRBOT_IMAGE=soulter/astrbot:latest

# WebUI
ASTRBOT_WEBUI_HOST_PORT=6185

# OneBot v11 / NapCat WebSocket，可选
ASTRBOT_ONEBOT_HOST_PORT=6199

# 个人微信 / Gewechat callback，可选
ASTRBOT_WECHAT_CALLBACK_HOST_PORT=11451
```

如果接入微信公众号、企业微信或 QQ 官方 Webhook，再按需暴露对应回调端口。旧版常见端口是 `6194`、`6195`、`6196`，以 WebUI / 官方适配器文档中的实际配置为准。

启动：

```bash
docker compose up -d
docker compose logs -f astrbot
```

WebUI：

```text
http://127.0.0.1:6185
```

初始账号密码通常是：

```text
astrbot / astrbot
```

首次登录后立刻修改密码。

**不要直接把 6185 暴露到公网，建议 `HOST_IP=127.0.0.1` 后再通过 1Panel 反代访问。**

1Panel 反代目标：

```text
http://astrbot:6185
```

如果需要让 AstrBot 访问更多宿主机目录，用 `volumes` 显式挂载：

```yaml
volumes:
    - ./data:/AstrBot/data
    - /opt/projects:/workspace/projects
```

在 AstrBot 中使用容器内路径：

```text
/workspace/projects
```

这只是 AstrBot 主容器能访问的路径。Shipyard Neo 沙盒的文件工具以 `/workspace` 为根目录，调用时应传相对路径。

## NapCat / OneBot

QQ 个人号通常通过 NapCat / OneBot v11 接入。更推荐参考 NapCat 官方的 AstrBot compose；如果只是在同一个 1Panel 网络里连接，可以额外部署：

```yaml
services:
    napcat:
        image: mlikiowa/napcat-docker:latest
        container_name: napcat
        restart: unless-stopped
        environment:
            - NAPCAT_UID=${NAPCAT_UID}
            - NAPCAT_GID=${NAPCAT_GID}
            - MODE=astrbot
        networks:
            - 1panel-network
        ports:
            - ${HOST_IP}:${NAPCAT_WEBUI_HOST_PORT}:6099
        volumes:
            - ./napcat/config:/app/napcat/config
            - ./ntqq:/app/.config/QQ
```

对应 `.env`：

```env
NAPCAT_UID=1000
NAPCAT_GID=1000
NAPCAT_WEBUI_HOST_PORT=6099
```

AstrBot 侧按 WebUI 提示添加 OneBot v11 适配器。

## Agent Sandbox

AstrBot 的沙盒执行能力建议使用 Shipyard Neo。低配 VPS 不建议默认开启；需要 Python / Shell / 浏览器 / Computer Use 时再部署。

官方推荐单独部署 Shipyard Neo：

```bash
git clone https://github.com/AstrBotDevs/shipyard-neo
cd shipyard-neo/deploy/docker
openssl rand -hex 32
# 修改 config.yaml 中 security.api_key 和 docker.network
docker compose up -d
```

如果要和 AstrBot 放在同一个 1Panel 网络中，核心配置是：

```yaml
services:
    bay:
        image: ghcr.io/astrbotdevs/shipyard-neo-bay:latest
        container_name: astrbot-bay
        restart: unless-stopped
        environment:
            - BAY_CONFIG_FILE=/app/config.yaml
            - BAY_DATA_DIR=/app/data
        networks:
            - 1panel-network
        ports:
            - ${HOST_IP}:${BAY_HOST_PORT}:8114
        volumes:
            - /var/run/docker.sock:/var/run/docker.sock
            - ./shipyard/config.yaml:/app/config.yaml:ro
            - ./shipyard/data:/app/data
            - ./shipyard/cargos:/var/lib/bay/cargos
        healthcheck:
            test: ["CMD", "curl", "-f", "http://127.0.0.1:8114/health"]
            interval: 30s
            timeout: 10s
            start_period: 15s
            retries: 5
```

对应 `.env`：

```env
BAY_HOST_PORT=8114
```

`shipyard/config.yaml` 最小关键项：

```yaml
server:
  host: "0.0.0.0"
  port: 8114

database:
  url: "sqlite+aiosqlite:///./data/bay.db"
  echo: false

driver:
  type: docker
  image_pull_policy: always
  docker:
    socket: "unix:///var/run/docker.sock"
    connect_mode: container_network
    network: "1panel-network"
    publish_ports: false
    host_port: null

cargo:
  root_path: "/var/lib/bay/cargos"
  default_size_limit_mb: 1024
  mount_path: "/workspace"

security:
  api_key: "换成 openssl rand -hex 32 生成的强随机字符串"
  allow_anonymous: false

profiles:
  - id: python-default
    description: "Python / Shell / filesystem sandbox"
    image: "ghcr.io/astrbotdevs/shipyard-neo-ship:latest"
    runtime_type: ship
    runtime_port: 8123
    resources:
      cpus: 1.0
      memory: "1g"
    capabilities:
      - filesystem
      - shell
      - python
    idle_timeout: 1800
    warm_pool_size: 0
    env: {}

gc:
  enabled: true
  run_on_startup: true
  interval_seconds: 300
  instance_id: "bay-prod"
  idle_session:
    enabled: true
  expired_sandbox:
    enabled: true
  orphan_cargo:
    enabled: true
  orphan_container:
    enabled: true
```

AstrBot WebUI 中配置：

```text
AI 配置 -> Agent Computer Use
Computer Use Runtime = sandbox
沙箱环境驱动器 = Shipyard Neo
Shipyard Neo API Endpoint = http://astrbot-bay:8114
Shipyard Neo Access Token = config.yaml 中的 security.api_key
Shipyard Neo Profile = python-default
```

如果需要浏览器能力，再增加 `browser-python` profile，并使用 `ghcr.io/astrbotdevs/shipyard-neo-gull:latest`。浏览器沙盒更吃资源，建议至少 `2C4G` 并开启 Swap。
