---
title: sub2api
date: 2026-05-13
order: 6
---

## Github Repo

[Sub2API Github Repo](https://github.com/Wei-Shaw/sub2api)

## 说明

这是 `sub2api + PostgreSQL + Redis` 模板，附带可选的 `sing-box` 出站代理。

先创建 new-api 内网：

```bash
docker network create --driver bridge --internal newapi-sub2api
```

目录结构：

```text
sub2api/
├── docker-compose.yml
├── .env
├── nginx/default.conf
├── sing-box/config.json
├── sub2api_data/
├── postgres_data/
└── redis_data/
```

不用 `sing-box` 时，删除 `sing-box` 服务、`sub2api-proxy` / `sub2api-egress` 网络、`depends_on.sing-box` 和 `HTTP_PROXY` / `HTTPS_PROXY` / `ALL_PROXY` / `UPDATE_PROXY_URL`。

## docker-compose

```yaml
services:
    sub2api:
        image: weishaw/sub2api:latest
        container_name: sub2api
        restart: unless-stopped
        ulimits:
            nofile:
                soft: 100000
                hard: 100000
        depends_on:
            postgres:
                condition: service_healthy
            redis:
                condition: service_healthy
            sing-box:
                condition: service_started
        volumes:
            - ./sub2api_data:/app/data
        environment:
            - AUTO_SETUP=true
            - SERVER_HOST=0.0.0.0
            - SERVER_PORT=8080
            - SERVER_MODE=${SERVER_MODE:-release}
            - RUN_MODE=${RUN_MODE:-standard}
            - TZ=${TZ:-Asia/Shanghai}

            - DATABASE_HOST=postgres
            - DATABASE_PORT=5432
            - DATABASE_USER=${POSTGRES_USER:-sub2api}
            - DATABASE_PASSWORD=${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}
            - DATABASE_DBNAME=${POSTGRES_DB:-sub2api}
            - DATABASE_SSLMODE=disable
            - DATABASE_MAX_OPEN_CONNS=${DATABASE_MAX_OPEN_CONNS:-50}
            - DATABASE_MAX_IDLE_CONNS=${DATABASE_MAX_IDLE_CONNS:-10}
            - DATABASE_CONN_MAX_LIFETIME_MINUTES=${DATABASE_CONN_MAX_LIFETIME_MINUTES:-30}
            - DATABASE_CONN_MAX_IDLE_TIME_MINUTES=${DATABASE_CONN_MAX_IDLE_TIME_MINUTES:-5}

            - REDIS_HOST=redis
            - REDIS_PORT=6379
            - REDIS_PASSWORD=${REDIS_PASSWORD:?REDIS_PASSWORD is required}
            - REDIS_DB=${REDIS_DB:-0}
            - REDIS_POOL_SIZE=${REDIS_POOL_SIZE:-1024}
            - REDIS_MIN_IDLE_CONNS=${REDIS_MIN_IDLE_CONNS:-10}
            - REDIS_ENABLE_TLS=false

            - ADMIN_EMAIL=${ADMIN_EMAIL:-admin@example.com}
            - ADMIN_PASSWORD=${ADMIN_PASSWORD:?ADMIN_PASSWORD is required}
            - JWT_SECRET=${JWT_SECRET:?JWT_SECRET is required}
            - JWT_EXPIRE_HOUR=${JWT_EXPIRE_HOUR:-24}
            - TOTP_ENCRYPTION_KEY=${TOTP_ENCRYPTION_KEY:?TOTP_ENCRYPTION_KEY is required}

            # 可选：sub2api 出站走 sing-box
            - HTTP_PROXY=http://sing-box:7890
            - HTTPS_PROXY=http://sing-box:7890
            - ALL_PROXY=socks5h://sing-box:7890
            - UPDATE_PROXY_URL=http://sing-box:7890
            - NO_PROXY=localhost,127.0.0.1,::1,postgres,redis,sing-box,sub2api,new-api,newapi,*.local

            # 允许 new-api 通过 Docker 内网 HTTP 访问 sub2api
            - SECURITY_URL_ALLOWLIST_ENABLED=false
            - SECURITY_URL_ALLOWLIST_ALLOW_INSECURE_HTTP=true
            - SECURITY_URL_ALLOWLIST_ALLOW_PRIVATE_HOSTS=true
        networks:
            sub2api-internal:
                aliases:
                    - sub2api
            sub2api-proxy:
                aliases:
                    - sub2api
            newapi-sub2api:
                aliases:
                    - sub2api
        healthcheck:
            test: ["CMD", "wget", "-q", "-T", "5", "-O", "/dev/null", "http://localhost:8080/health"]
            interval: 30s
            timeout: 10s
            retries: 3
            start_period: 60s

    dashboard-proxy:
        image: nginx:1.27-alpine
        container_name: sub2api-dashboard-proxy
        restart: unless-stopped
        depends_on:
            sub2api:
                condition: service_started
        ports:
            - "127.0.0.1:38580:80"
        volumes:
            - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
        networks:
            sub2api-internal:
                aliases:
                    - sub2api-dashboard-proxy

    postgres:
        image: postgres:18-alpine
        container_name: sub2api-postgres
        restart: unless-stopped
        environment:
            - POSTGRES_USER=${POSTGRES_USER:-sub2api}
            - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}
            - POSTGRES_DB=${POSTGRES_DB:-sub2api}
            - PGDATA=/var/lib/postgresql/data
            - TZ=${TZ:-Asia/Shanghai}
        volumes:
            - ./postgres_data:/var/lib/postgresql/data
        networks:
            sub2api-internal:
                aliases:
                    - postgres
        healthcheck:
            test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-sub2api} -d ${POSTGRES_DB:-sub2api} -h 127.0.0.1"]
            interval: 10s
            timeout: 5s
            retries: 10
            start_period: 20s

    redis:
        image: redis:8-alpine
        container_name: sub2api-redis
        restart: unless-stopped
        command: >
            sh -c 'redis-server
            --requirepass "$$REDIS_PASSWORD"
            --save 60 1
            --appendonly yes
            --appendfsync everysec'
        volumes:
            - ./redis_data:/data
        environment:
            - TZ=${TZ:-Asia/Shanghai}
            - REDIS_PASSWORD=${REDIS_PASSWORD:?REDIS_PASSWORD is required}
            - REDISCLI_AUTH=${REDIS_PASSWORD:?REDIS_PASSWORD is required}
        networks:
            sub2api-internal:
                aliases:
                    - redis
        healthcheck:
            test: ["CMD-SHELL", "redis-cli -a \"$${REDIS_PASSWORD}\" ping | grep PONG"]
            interval: 10s
            timeout: 5s
            retries: 10
            start_period: 10s

    sing-box:
        image: ghcr.io/sagernet/sing-box:latest
        container_name: sub2api-sing-box
        restart: unless-stopped
        command: run -c /etc/sing-box/config.json -D /var/lib/sing-box
        volumes:
            - ./sing-box/config.json:/etc/sing-box/config.json:ro
            - ./sing-box-data:/var/lib/sing-box
        networks:
            sub2api-proxy:
                aliases:
                    - sing-box
            sub2api-egress:
        healthcheck:
            test: ["CMD", "sing-box", "check", "-c", "/etc/sing-box/config.json"]
            interval: 30s
            timeout: 10s
            retries: 3

networks:
    sub2api-internal:
        driver: bridge
        internal: true

    sub2api-proxy:
        driver: bridge
        internal: true

    sub2api-egress:
        driver: bridge

    newapi-sub2api:
        external: true
```

## env

```env
TZ=Asia/Shanghai

SERVER_MODE=release
RUN_MODE=standard

POSTGRES_USER=sub2api
POSTGRES_PASSWORD=换成你的PostgreSQL强密码
POSTGRES_DB=sub2api

REDIS_PASSWORD=换成你的Redis强密码
REDIS_DB=0

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=换成你的sub2api后台密码

JWT_SECRET=换成openssl生成的hex
TOTP_ENCRYPTION_KEY=换成openssl生成的hex
```

生成随机值：

```bash
openssl rand -hex 24
openssl rand -hex 24
openssl rand -hex 32
openssl rand -hex 32
```

## nginx/default.conf

```nginx
server {
    listen 80;

    location / {
        proxy_pass http://sub2api:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## sing-box/config.json

可选。只在需要代理出站时创建：

```json
{
  "log": {
    "level": "info",
    "timestamp": true
  },
  "inbounds": [
    {
      "type": "mixed",
      "tag": "mixed-in",
      "listen": "::",
      "listen_port": 7890
    }
  ],
  "outbounds": [
    {
      "type": "vless",
      "tag": "proxy",
      "server": "你的VLESS服务器IP或域名",
      "server_port": 443,
      "uuid": "你的完整UUID",
      "flow": "xtls-rprx-vision",
      "tls": {
        "enabled": true,
        "server_name": "你的Reality伪装域名",
        "utls": {
          "enabled": true,
          "fingerprint": "chrome"
        },
        "reality": {
          "enabled": true,
          "public_key": "你的Reality公钥",
          "short_id": "你的short_id"
        }
      },
      "packet_encoding": "xudp"
    },
    {
      "type": "direct",
      "tag": "direct"
    }
  ],
  "route": {
    "final": "proxy"
  }
}
```

`mixed` 同时提供 HTTP proxy 和 SOCKS proxy；不需要写旧版 `sniff` / `dns-out`。

## 启动

```bash
docker compose up -d
docker compose logs -f sub2api
```

WebUI：

```text
http://127.0.0.1:38580
```

远程访问：

```powershell
ssh -p 22 -L 38580:127.0.0.1:38580 user@你的服务器IP
```

new-api 上游地址：

```text
http://sub2api:8080
```

## 验证

```bash
curl -v http://127.0.0.1:38580/health
docker compose ps
```

启用 `sing-box` 时：

```bash
docker compose run --rm sing-box check -c /etc/sing-box/config.json
docker exec -it sub2api sh
wget -O- https://ipinfo.io
```

重点备份：

```text
.env
docker-compose.yml
nginx/default.conf
sub2api_data/
postgres_data/
redis_data/
sing-box/config.json
```

`postgres_data/` 初始化后，再改 `.env` 的 `POSTGRES_PASSWORD` 不会自动修改数据库内部密码。新部署可以删数据重来，已有数据不要直接删目录。
