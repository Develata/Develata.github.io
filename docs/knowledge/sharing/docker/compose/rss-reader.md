---
title: rss-reader
---

## Github Repo

[RSS-Reader Github Repo](https://github.com/Develata/RSS-Reader)

compose更新日期: 2026-10-31

## docker-compose

```yaml
networks:
    1panel-network:
        external: true

services:
    rss-reader:
        image: ${RSS_READER_IMAGE:-ghcr.io/develata/rss-reader:latest}
        container_name: rss-reader
        restart: unless-stopped
        env_file:
            - .env
        environment:
            - RSS_READER_WEB_BIND=0.0.0.0:8080
            - RSS_READER_WEB_STATIC_DIR=/app/public
            - RSSR_DATA_DIR=/data
            - RSS_READER_WEB_USERNAME=${RSS_READER_WEB_USERNAME:?RSS_READER_WEB_USERNAME is required}
            - RSS_READER_WEB_PUBLIC_ORIGIN=${RSS_READER_WEB_PUBLIC_ORIGIN:?RSS_READER_WEB_PUBLIC_ORIGIN is required}
            - RSS_READER_WEB_PASSWORD=${RSS_READER_WEB_PASSWORD:-}
            - RSS_READER_WEB_PASSWORD_HASH=${RSS_READER_WEB_PASSWORD_HASH:-}
            - RSS_READER_WEB_ENV=production
            - RSS_READER_WEB_TRUST_PROXY_HEADERS=false
        labels:
            createdBy: Apps
        networks:
            - 1panel-network
        ports:
            - "${HOST_IP:-127.0.0.1}:${RSS_READER_PORT:-8039}:8080"
        volumes:
            - rss-reader-data:/data
        healthcheck:
            test: ["CMD-SHELL", "wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1"]
            interval: 30s
            timeout: 5s
            start_period: 10s
            retries: 3
        logging:
            driver: json-file
            options:
                max-size: "50m"
                max-file: "3"

volumes:
    rss-reader-data:
```

## env

```env
HOST_IP=127.0.0.1
RSS_READER_PORT=8039

RSS_READER_IMAGE=ghcr.io/develata/rss-reader:latest

RSS_READER_WEB_PUBLIC_ORIGIN=https://rssr.develata.me
RSS_READER_WEB_USERNAME=admin

RSS_READER_WEB_PASSWORD='请替换为自己的强随机密码'
RSS_READER_WEB_PASSWORD_HASH=
```

1Panel 同网络反代 `http://rss-reader:8080`，启用 HTTPS；公开地址须与 `RSS_READER_WEB_PUBLIC_ORIGIN` 一致。

密码只用于首次初始化，之后以数据卷中的认证库为准；首次登录成功后可移除 `.env` 中的密码并重建容器，保留数据卷。
