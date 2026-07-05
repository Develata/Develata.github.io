---
title: gitea-mirror
---

## Github Repo

[RayLabsHQ/gitea-mirror Github Repo](https://github.com/RayLabsHQ/gitea-mirror)

compose更新日期: 2026-07-05

当前参考版本：`v3.20.4`

官方文档：

* https://github.com/RayLabsHQ/gitea-mirror
* https://github.com/RayLabsHQ/gitea-mirror/blob/main/docs/ENVIRONMENT_VARIABLES.md
* https://docs.gitea.com/usage/repo-mirror

## 开源协议

`RayLabsHQ/gitea-mirror` 使用 `AGPL-3.0`。

普通自用部署官方镜像一般没有问题。需要注意的是：如果修改它的源码或镜像，并通过网络把修改后的服务提供给其他用户使用，AGPL 要求向这些网络用户提供对应修改版源码。

简单说：

```text
直接用官方镜像自托管：通常没问题
自己改源码/镜像后对外提供服务：需要遵守 AGPL 源码公开义务
```

本文只讨论直接使用官方镜像部署。

## docker-compose

```yaml
networks:
    1panel-network:
        external: true

services:
    gitea-mirror:
        image: ${GITEA_MIRROR_IMAGE:-ghcr.io/raylabshq/gitea-mirror:v3.20.4}
        container_name: gitea-mirror
        restart: unless-stopped
        user: ${PUID:-1000}:${PGID:-1000}
        env_file:
            - .env
        environment:
            - NODE_ENV=production
            - DATABASE_URL=file:data/gitea-mirror.db
            - HOST=0.0.0.0
            - PORT=4321
            - TZ=${TIME_ZONE:-Asia/Shanghai}
            - BASE_URL=${BASE_URL:-/}
            - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET:?BETTER_AUTH_SECRET is required}
            - ENCRYPTION_SECRET=${ENCRYPTION_SECRET:?ENCRYPTION_SECRET is required}
            - BETTER_AUTH_URL=${BETTER_AUTH_URL:?BETTER_AUTH_URL is required}
            - PUBLIC_BETTER_AUTH_URL=${PUBLIC_BETTER_AUTH_URL:?PUBLIC_BETTER_AUTH_URL is required}
            - BETTER_AUTH_TRUSTED_ORIGINS=${BETTER_AUTH_TRUSTED_ORIGINS:?BETTER_AUTH_TRUSTED_ORIGINS is required}
            # 推荐先在 Web UI 中配置 GitHub / Gitea token 和镜像策略。
            # 如果需要完全环境变量化部署，可再按官方 ENVIRONMENT_VARIABLES.md 增加 GITHUB_TOKEN、GITEA_TOKEN 等变量。
        labels:
            createdBy: Apps
        networks:
            - 1panel-network
        ports:
            - ${HOST_IP:-127.0.0.1}:${GITEA_MIRROR_HOST_PORT:-4321}:4321
        volumes:
            - ./data:/app/data
        healthcheck:
            test: ["CMD-SHELL", "BASE=\"$${BASE_URL:-/}\"; if [ \"$${BASE}\" = \"/\" ]; then BASE=\"\"; else BASE=\"$${BASE%/}\"; fi; wget --no-verbose --tries=3 --spider \"http://127.0.0.1:4321$${BASE}/api/health\""]
            interval: 30s
            timeout: 10s
            start_period: 30s
            retries: 5
        logging:
            driver: json-file
            options:
                max-size: "50m"
                max-file: "3"
```

## env

```env
TIME_ZONE=Asia/Shanghai

# Web 只监听本机，通过 1Panel / OpenResty / Nginx 反代访问
HOST_IP=127.0.0.1
GITEA_MIRROR_HOST_PORT=4321

# 建议固定版本，不建议长期使用 latest
GITEA_MIRROR_IMAGE=ghcr.io/raylabshq/gitea-mirror:v3.20.4

# 宿主机上拥有 ./data 的用户。按实际部署用户修改。
PUID=1000
PGID=1000

# 至少 32 字符。生成：openssl rand -base64 32
BETTER_AUTH_SECRET=请替换为32字符以上随机字符串

# 建议单独设置，用于加密存储 GitHub / Gitea token。生成：openssl rand -base64 48
ENCRYPTION_SECRET=请替换为48字符左右随机字符串

# 如果用独立域名，例如 https://gitea-mirror.example.com
BASE_URL=/
BETTER_AUTH_URL=https://gitea-mirror.example.com
PUBLIC_BETTER_AUTH_URL=https://gitea-mirror.example.com
BETTER_AUTH_TRUSTED_ORIGINS=https://gitea-mirror.example.com
```

如果部署在子路径，例如：

```text
https://git.example.com/mirror
```

则 `.env` 改成：

```env
BASE_URL=/mirror
BETTER_AUTH_URL=https://git.example.com
PUBLIC_BETTER_AUTH_URL=https://git.example.com
BETTER_AUTH_TRUSTED_ORIGINS=https://git.example.com
```

注意：`BETTER_AUTH_URL`、`PUBLIC_BETTER_AUTH_URL`、`BETTER_AUTH_TRUSTED_ORIGINS` 写 origin，不要把 `/mirror` 重复写进去；路径前缀由 `BASE_URL` 负责。

## 初始化

准备目录：

```bash
sudo mkdir -p /opt/gitea-mirror
cd /opt/gitea-mirror
```

写入：

```text
.env
docker-compose.yml
```

生成密钥：

```bash
openssl rand -base64 32
openssl rand -base64 48
```

启动：

```bash
docker compose up -d
```

查看日志：

```bash
docker compose logs -f gitea-mirror
```

检查状态：

```bash
docker compose ps
curl -fsS http://127.0.0.1:4321/api/health
```

第一次打开 Web UI 后，第一个注册用户会成为管理员。

## 推荐初始配置

初始不要一上来打开所有高级功能。先让核心代码镜像跑稳：

```text
GitHub personal repositories -> Gitea pull mirror
```

建议先配置：

```text
GitHub personal repos: enable
Private repositories: enable, if token scope permits
Forks: skip
Starred repositories: disable
Organizations: disable
Metadata mirroring: disable
Issues / PR / labels / milestones: disable
Wiki: disable
Releases: disable
LFS: 按仓库是否使用 LFS 决定
Schedule: enable
Mirror interval: 24h 或 8h
Cleanup delete: disable
Cleanup dry-run: enable
Orphaned repository action: archive
```

等代码镜像稳定几天后，再考虑 issues、wiki、releases 等 metadata 复制。

## Token 建议

### GitHub Token

优先使用 Fine-grained personal access token。

只镜像 public repo 时，权限可以很小；如果镜像 private repo，至少需要目标仓库的 `Contents: Read-only` 和 `Metadata: Read-only`。不要给不需要的写权限。

如果组织或企业账号启用了 SSO，需要确认 token 已授权给对应资源。

### Gitea Token

建议创建专用 bot 用户，例如：

```text
github-mirror-bot
```

然后把它加入目标 Gitea 组织，例如：

```text
github-mirrors
```

Gitea token 需要能创建仓库、迁移仓库、读取仓库状态。不要长期使用主管理员 token。

## 反向代理

`HOST_IP=127.0.0.1` 表示 gitea-mirror 只监听本机端口，建议通过 1Panel / OpenResty / Nginx 反代，不要直接把 `4321` 暴露到公网。

OpenResty 示例：

```nginx
server {
    listen 80;
    server_name gitea-mirror.example.com;

    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name gitea-mirror.example.com;

    ssl_certificate      /usr/local/openresty/nginx/conf/ssl/example.com.crt;
    ssl_certificate_key  /usr/local/openresty/nginx/conf/ssl/example.com.key;

    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:4321;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_connect_timeout 10s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

检查并重载：

```bash
sudo openresty -t
sudo systemctl reload openresty
```

## 更新

进入目录：

```bash
cd /opt/gitea-mirror
```

先备份：

```bash
tar -czf "backup-gitea-mirror-data-$(date +%F-%H%M%S).tar.gz" data
```

修改 `.env` 中的镜像版本，例如：

```env
GITEA_MIRROR_IMAGE=ghcr.io/raylabshq/gitea-mirror:v3.20.4
```

拉取并重建：

```bash
docker compose pull
docker compose up -d
```

查看日志：

```bash
docker compose logs -f gitea-mirror
```

## 备份

核心持久化目录是：

```text
/opt/gitea-mirror/data
```

里面包含 SQLite 数据库、用户、配置、token 加密后的数据和运行状态。它不保存 Gitea 仓库本体；真正的 Git 仓库仍在 Gitea 服务的数据目录里。

最小备份：

```bash
cd /opt/gitea-mirror
tar -czf "backup-gitea-mirror-data-$(date +%F-%H%M%S).tar.gz" data
```

更重要的是同时备份 Gitea 自己的 `/opt/gitea/data`，因为那里才是镜像后的 Git 仓库主体。
