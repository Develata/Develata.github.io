---
title: gitea
---

## Github Repo

[Gitea Github Repo](https://github.com/go-gitea/gitea)

compose更新日期: 2026-07-05

官方部署文档：

* https://docs.gitea.com/installation/install-with-docker
* https://docs.gitea.com/administration/config-cheat-sheet
* https://docs.gitea.com/usage/repo-mirror
* https://docs.gitea.com/administration/backup-and-restore

## docker-compose

```yaml
networks:
    1panel-network:
        external: true

services:
    gitea:
        image: ${GITEA_IMAGE:-docker.gitea.com/gitea:1.26.4}
        container_name: gitea
        restart: unless-stopped
        env_file:
            - .env
        environment:
            - USER_UID=${USER_UID:-1000}
            - USER_GID=${USER_GID:-1000}
            - TZ=${TZ:-Asia/Shanghai}
            - GITEA__server__DOMAIN=${GITEA_DOMAIN:?GITEA_DOMAIN is required}
            - GITEA__server__ROOT_URL=${GITEA_ROOT_URL:?GITEA_ROOT_URL is required}
            - GITEA__server__HTTP_PORT=3000
            - GITEA__server__SSH_DOMAIN=${GITEA_SSH_DOMAIN:?GITEA_SSH_DOMAIN is required}
            - GITEA__server__SSH_PORT=${GITEA_SSH_PORT:-2222}
            - GITEA__server__DISABLE_SSH=false
            - GITEA__server__OFFLINE_MODE=${GITEA_OFFLINE_MODE:-true}
            - GITEA__database__DB_TYPE=sqlite3
            - GITEA__database__PATH=/data/gitea/gitea.db
            - GITEA__service__DISABLE_REGISTRATION=${GITEA_DISABLE_REGISTRATION:-true}
            - GITEA__service__REQUIRE_SIGNIN_VIEW=${GITEA_REQUIRE_SIGNIN_VIEW:-true}
            - GITEA__service__REGISTER_EMAIL_CONFIRM=${GITEA_REGISTER_EMAIL_CONFIRM:-false}
            - GITEA__actions__ENABLED=${GITEA_ACTIONS_ENABLED:-false}
            - GITEA__packages__ENABLED=${GITEA_PACKAGES_ENABLED:-true}
            - GITEA__repository__ENABLE_PUSH_CREATE_USER=${GITEA_ENABLE_PUSH_CREATE_USER:-false}
            - GITEA__repository__ENABLE_PUSH_CREATE_ORG=${GITEA_ENABLE_PUSH_CREATE_ORG:-false}
            - GITEA__log__LEVEL=${GITEA_LOG_LEVEL:-Info}
        labels:
            createdBy: Apps
        networks:
            - 1panel-network
        ports:
            - ${HOST_IP:-127.0.0.1}:${GITEA_HTTP_HOST_PORT:-3000}:3000
            - ${GITEA_SSH_BIND_IP:-0.0.0.0}:${GITEA_SSH_HOST_PORT:-2222}:22
        volumes:
            - ./data:/data
            - /etc/timezone:/etc/timezone:ro
            - /etc/localtime:/etc/localtime:ro
        healthcheck:
            test: ["CMD", "curl", "-f", "http://127.0.0.1:3000/api/healthz"]
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
TZ=Asia/Shanghai
TIME_ZONE=Asia/Shanghai

# Web 只监听本机，通过 1Panel / OpenResty / Nginx 反代访问
HOST_IP=127.0.0.1
GITEA_HTTP_HOST_PORT=3000

# SSH 需要给外部 git client 访问，一般监听 0.0.0.0。
# HOST_PORT 是宿主机实际监听端口；SSH_PORT 是 Gitea 页面生成 clone URL 时展示的外部端口。
# 普通端口映射场景二者应保持一致。
GITEA_SSH_BIND_IP=0.0.0.0
GITEA_SSH_HOST_PORT=2222
GITEA_SSH_PORT=2222

# 宿主机上拥有 ./data 的用户。按实际部署用户修改。
USER_UID=1000
USER_GID=1000

# 建议固定稳定版本，不建议长期使用 latest
GITEA_IMAGE=docker.gitea.com/gitea:1.26.4

# 域名配置
GITEA_DOMAIN=git.example.com
GITEA_SSH_DOMAIN=git.example.com
GITEA_ROOT_URL=https://git.example.com/

# 个人自用建议关闭注册，未登录不可浏览
GITEA_DISABLE_REGISTRATION=true
GITEA_REQUIRE_SIGNIN_VIEW=true
GITEA_REGISTER_EMAIL_CONFIRM=false

# 当前方案 CI 仍走 GitHub Actions + GitHub self-hosted runner，所以默认不启用 Gitea Actions
GITEA_ACTIONS_ENABLED=false

# Package Registry 可保留
GITEA_PACKAGES_ENABLED=true

# 禁止直接 git push 自动创建用户/组织仓库
GITEA_ENABLE_PUSH_CREATE_USER=false
GITEA_ENABLE_PUSH_CREATE_ORG=false

# 个人私有实例建议 true，减少外部头像/CDN 等请求；需要外部资源体验时再改 false
GITEA_OFFLINE_MODE=true
GITEA_LOG_LEVEL=Info
```

`HOST_IP=127.0.0.1` 表示 Gitea Web 只监听本机端口，建议通过 1Panel / OpenResty / Nginx 反代访问，不要直接把 `3000` 暴露到公网。

这份 `.env` 使用的是便于人读的变量名，例如 `GITEA_DISABLE_REGISTRATION`、`GITEA_SSH_PORT`。这些变量不是 Gitea 原生读取的名字；真正生效的是上方 `docker-compose.yml` 里映射出的 `GITEA__service__...`、`GITEA__server__...` 等环境变量。因此不要只复制 `.env` 而删掉 compose 里的 `GITEA__...` 映射。

SSH 端口需要给外部 Git 客户端访问，所以这里默认：

```env
GITEA_SSH_BIND_IP=0.0.0.0
GITEA_SSH_HOST_PORT=2222
GITEA_SSH_PORT=2222
```

`GITEA_SSH_HOST_PORT` 控制宿主机端口映射；`GITEA_SSH_PORT` 控制 Gitea 页面生成的 SSH clone URL 里展示的外部端口。普通 Docker 端口映射下二者应该相同。如果改成 `22223`，两项都要改：

```env
GITEA_SSH_HOST_PORT=22223
GITEA_SSH_PORT=22223
```

如果服务器防火墙或云安全组没有放行该端口，网页能访问但 SSH clone / push 会失败。
