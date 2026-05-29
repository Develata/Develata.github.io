---
title: open-webui
---

## Github Repo

[open-webui Github Repo](https://github.com/AstrBotDevs/AstrBot)

compose更新日期: 2026-05-29

## docker-compose

```yaml
networks:
  1panel-network:
    external: true

services:
  open-webui:
    container_name: open-webui
    image: ghcr.io/open-webui/open-webui:main
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - TZ=${TIME_ZONE}

      # 基础配置
      - WEBUI_SECRET_KEY=${WEBUI_SECRET_KEY}
      - WEBUI_URL=${WEBUI_URL}

      # 多账号注册控制
      - ENABLE_SIGNUP=${ENABLE_SIGNUP}

      # 不使用 Ollama
      - ENABLE_OLLAMA_API=false

      # 保留 OpenAI-compatible API 能力，但具体 Base URL / Key 进后台填
      - ENABLE_OPENAI_API=true

    labels:
      createdBy: Apps
    networks:
      - 1panel-network
    ports:
      - ${HOST_IP}:${OPEN_WEBUI_HOST_PORT}:8080
    volumes:
      - ./data:/app/backend/data
    extra_hosts:
      - host.docker.internal:host-gateway
```

## env

```env
TIME_ZONE=Asia/Shanghai
HOST_IP=127.0.0.1

OPEN_WEBUI_HOST_PORT=3000

# 你的 Open WebUI 访问地址
WEBUI_URL=https://你的域名

# 强随机字符串，不要留空
WEBUI_SECRET_KEY=请替换为至少32位随机字符串

# 首次创建管理员时 true；创建完成后建议改 false 并重启
ENABLE_SIGNUP=true
```

