---
title: dlx
---

## Github Repo

[DLX Github Repo](https://github.com/OwO-Network/DLX)

compose更新日期: 2026-11-04

DLX 原名 DeepLX，是非官方 DeepL 翻译 API，文本会发送到 DeepL。

## docker-compose

```yaml
networks:
    1panel-network:
        external: true

services:
    dlx:
        container_name: dlx
        image: ghcr.io/owo-network/deeplx:latest
        restart: unless-stopped
        environment:
            - TOKEN=${DLX_TOKEN:?DLX_TOKEN is required}
            - PROXY=${DLX_PROXY:-}
        labels:
            createdBy: Apps
        networks:
            - 1panel-network
        ports:
            - "${HOST_IP:-127.0.0.1}:${DLX_HOST_PORT:-1188}:1188"
```

## env

```env
HOST_IP=127.0.0.1
DLX_HOST_PORT=1188
DLX_TOKEN=填写随机密钥
DLX_PROXY=
```

## 说明

- 接口：`POST /translate`，请求头：`Authorization: Bearer <DLX_TOKEN>`。
- 默认仅本机访问；1Panel 可通过 `http://dlx:1188` 反代，公网访问应启用 HTTPS。
- 匿名请求整批最多 1500 个 UTF-16 单元；不需要代理时留空 `DLX_PROXY`。
