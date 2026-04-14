---
title: miaomiaowu
date: 2026-4-14
order: 1
---

## Github Repo

[miaomiaowu Github Repo](https://github.com/iluobei/miaomiaowu)

## docker-compose

```yaml
networks:
    1panel-network:
        external: true

services:
    miaomiaowu:
        container_name: miaomiaowu
        image: ghcr.io/iluobei/miaomiaowu:latest
        user: root
        restart: unless-stopped
        environment:
            - TZ=${TIME_ZONE}
            - PORT=${MMW_CONTAINER_PORT}
            - DATABASE_PATH=/app/data/traffic.db
            - LOG_LEVEL=${MMW_LOG_LEVEL}
            - JWT_SECRET=${MMW_JWT_SECRET}
        labels:
            createdBy: Apps
        networks:
            - 1panel-network
        ports:
            - ${HOST_IP}:${MMW_HOST_PORT}:${MMW_CONTAINER_PORT}
        volumes:
            - ./data:/app/data
            - ./subscribes:/app/subscribes
            - ./rule_templates:/app/rule_templates
        healthcheck:
            test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/"]
            interval: 30s
            timeout: 3s
            start_period: 5s
            retries: 3
```

## env
```
TIME_ZONE=UTC
HOST_IP=127.0.0.1
MMW_HOST_PORT=13200
MMW_CONTAINER_PORT=8080
MMW_LOG_LEVEL=info
MMW_JWT_SECRET=换成一串足够长的随机字符串
```