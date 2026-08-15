---
title: chhoto-url
---

## Github Repo

[Chhoto URL Github Repo](https://github.com/SinTan1729/chhoto-url)

compose更新日期: 2026-08-15

官方安装文档：

- [Installation and Configuration](https://github.com/SinTan1729/chhoto-url/blob/main/docs/INSTALLATION.md)
- [Official compose.yaml](https://github.com/SinTan1729/chhoto-url/blob/main/deploy/compose.yaml)

## docker-compose

```yaml
networks:
    1panel-network:
        external: true

services:
    chhoto-url:
        container_name: chhoto-url
        image: sintan1729/chhoto-url:latest
        restart: unless-stopped
        environment:
            - CHHOTO_DB_URL=/data/urls.sqlite
            - CHHOTO_PASSWORD=${CHHOTO_PASSWORD:?CHHOTO_PASSWORD is required}
            - CHHOTO_SITE_URL=${CHHOTO_SITE_URL}
            - CHHOTO_API_KEY=${CHHOTO_API_KEY:?CHHOTO_API_KEY is required}
            - CHHOTO_SQLITE_USE_WAL_MODE=True
            - CHHOTO_REDIRECT_METHOD=${CHHOTO_REDIRECT_METHOD}
            - CHHOTO_SLUG_STYLE=${CHHOTO_SLUG_STYLE}
            - CHHOTO_SLUG_LENGTH=${CHHOTO_SLUG_LENGTH}
        labels:
            createdBy: Apps
        networks:
            - 1panel-network
        ports:
            - ${HOST_IP}:${CHHOTO_HOST_PORT}:4567
        volumes:
            - ./data:/data
```

## env

```env
HOST_IP=127.0.0.1
CHHOTO_HOST_PORT=4567

CHHOTO_SITE_URL=https://s.example.com

CHHOTO_PASSWORD=换成强随机密码
CHHOTO_API_KEY=换成强随机API_KEY

CHHOTO_REDIRECT_METHOD=TEMPORARY

CHHOTO_SLUG_STYLE=Pair
CHHOTO_SLUG_LENGTH=16
```

生成随机密码和 API Key：

```bash
openssl rand -hex 32
openssl rand -hex 64
```

把第一条输出填入 `CHHOTO_PASSWORD`，第二条输出填入 `CHHOTO_API_KEY`。

`CHHOTO_SITE_URL` 改成实际用于短链接的完整域名，例如：

```env
CHHOTO_SITE_URL=https://s.example.com
```

这里不要加引号。

## SQLite

数据库保存在：

```text
./data/urls.sqlite
```

Compose 中挂载的是整个目录：

```yaml
volumes:
    - ./data:/data
```

而不是单独挂载 `urls.sqlite`。

同时开启：

```yaml
- CHHOTO_SQLITE_USE_WAL_MODE=True
```

使用 WAL 时应保持这种目录挂载方式。

Chhoto URL 自身生成的 SQLite 备份也会保存在数据库所在目录的 `backups` 目录中，因此 `./data` 建议纳入服务器的常规备份。

## 重定向方式

当前配置：

```env
CHHOTO_REDIRECT_METHOD=TEMPORARY
```

使用临时重定向，适合之后可能修改目标地址的短链接。

如果短链接对应的目标地址长期固定，可以改成：

```env
CHHOTO_REDIRECT_METHOD=PERMANENT
```

## Slug

默认使用单词组合形式：

```env
CHHOTO_SLUG_STYLE=Pair
```

例如生成类似：

```text
gifted-ramanujan
```

如果希望使用随机 UID：

```env
CHHOTO_SLUG_STYLE=UID
CHHOTO_SLUG_LENGTH=16
```

短链接数量较多时更适合使用 `UID`，并保持足够的 slug 长度。