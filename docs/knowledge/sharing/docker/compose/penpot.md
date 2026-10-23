---
title: penpot
---

# Penpot · Docker Compose（1Panel）

[GitHub](https://github.com/penpot/penpot) · [官方 Docker 文档](https://help.penpot.app/technical-guide/getting-started/docker/) · [官方 MCP](https://help.penpot.app/mcp/)

基于 [Penpot 2.18.3 官方 Compose](https://github.com/penpot/penpot/blob/2.18.3/docker/images/docker-compose.yaml)。通用 1Panel 示例；部署目录、域名及 PostgreSQL 连接信息由使用者自行设置。

**复用外部 PostgreSQL**：本 Compose **不部署数据库**，仅包含 5 个 Penpot 服务及 Valkey。请预先准备独立数据库、账号及可供容器访问的 Docker 网络；外部数据库的版本兼容性需自行验证。

## docker-compose.yml

```yaml
name: penpot

networks:
  penpot-app:
    driver: bridge
  penpot-data:
    driver: bridge
    internal: true
  postgres-external:
    external: true
    name: ${PENPOT_PG_NETWORK:?Set PENPOT_PG_NETWORK in .env}

services:
  penpot-frontend:
    image: penpotapp/frontend:${PENPOT_VERSION:?Set PENPOT_VERSION in .env}
    container_name: penpot-frontend
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    environment:
      PENPOT_FLAGS: ${PENPOT_FLAGS:?Set PENPOT_FLAGS in .env}
      PENPOT_PUBLIC_URI: ${PENPOT_PUBLIC_URI:?Set PENPOT_PUBLIC_URI in .env}
      PENPOT_HTTP_SERVER_MAX_BODY_SIZE: "367001600"
      PENPOT_ADMIN_CONSOLE_URI: http://penpot-admin-console:3000
    ports:
      - "127.0.0.1:${PENPOT_HTTP_PORT:-39001}:8080"
    volumes:
      - ./data/assets:/opt/data/assets
    networks:
      - penpot-app
    depends_on:
      - penpot-backend
      - penpot-admin-console
      - penpot-mcp
      - penpot-exporter
    logging:
      options:
        max-size: "10m"
        max-file: "3"

  penpot-backend:
    image: penpotapp/backend:${PENPOT_VERSION:?Set PENPOT_VERSION in .env}
    container_name: penpot-backend
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    environment:
      PENPOT_FLAGS: ${PENPOT_FLAGS:?Set PENPOT_FLAGS in .env}
      PENPOT_PUBLIC_URI: ${PENPOT_PUBLIC_URI:?Set PENPOT_PUBLIC_URI in .env}
      PENPOT_SECRET_KEY: ${PENPOT_SECRET_KEY:?Set PENPOT_SECRET_KEY locally}
      PENPOT_DATABASE_URI: postgresql://${PENPOT_PG_HOST:?Set PENPOT_PG_HOST}:${PENPOT_PG_PORT:-5432}/${PENPOT_DB_NAME:-penpot}
      PENPOT_DATABASE_USERNAME: penpot
      PENPOT_DATABASE_PASSWORD: ${PENPOT_DB_PASSWORD:?Set PENPOT_DB_PASSWORD locally}
      PENPOT_REDIS_URI: redis://penpot-valkey/0
      PENPOT_OBJECTS_STORAGE_BACKEND: fs
      PENPOT_OBJECTS_STORAGE_FS_DIRECTORY: /opt/data/assets
      PENPOT_ADMIN_CONSOLE_URI: http://penpot-admin-console:3000
      PENPOT_HTTP_SERVER_MAX_BODY_SIZE: "367001600"
      PENPOT_TELEMETRY_ENABLED: "false"
    volumes:
      - ./data/assets:/opt/data/assets
    networks:
      - penpot-app
      - penpot-data
      - postgres-external
    depends_on:
      penpot-valkey:
        condition: service_healthy
    logging:
      options:
        max-size: "10m"
        max-file: "3"

  penpot-admin-console:
    image: penpotapp/admin-console:${PENPOT_VERSION:?Set PENPOT_VERSION in .env}
    container_name: penpot-admin-console
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    environment:
      PENPOT_PUBLIC_URI: ${PENPOT_PUBLIC_URI:?Set PENPOT_PUBLIC_URI in .env}
      PENPOT_SECRET_KEY: ${PENPOT_SECRET_KEY:?Set PENPOT_SECRET_KEY locally}
      PENPOT_DATABASE_URI: postgresql://${PENPOT_PG_HOST:?Set PENPOT_PG_HOST}:${PENPOT_PG_PORT:-5432}/${PENPOT_DB_NAME:-penpot}
      PENPOT_DATABASE_USERNAME: penpot
      PENPOT_DATABASE_PASSWORD: ${PENPOT_DB_PASSWORD:?Set PENPOT_DB_PASSWORD locally}
      PENPOT_INTERNAL_URI: http://penpot-frontend:8080
    networks:
      - penpot-app
      - penpot-data
      - postgres-external
    logging:
      options:
        max-size: "10m"
        max-file: "3"

  penpot-mcp:
    image: penpotapp/mcp:${PENPOT_VERSION:?Set PENPOT_VERSION in .env}
    container_name: penpot-mcp
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    networks:
      - penpot-app
    logging:
      options:
        max-size: "10m"
        max-file: "3"

  penpot-exporter:
    image: penpotapp/exporter:${PENPOT_VERSION:?Set PENPOT_VERSION in .env}
    container_name: penpot-exporter
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    environment:
      PENPOT_FLAGS: ${PENPOT_FLAGS:?Set PENPOT_FLAGS in .env}
      PENPOT_PUBLIC_URI: ${PENPOT_PUBLIC_URI:?Set PENPOT_PUBLIC_URI in .env}
      PENPOT_SECRET_KEY: ${PENPOT_SECRET_KEY:?Set PENPOT_SECRET_KEY locally}
      PENPOT_INTERNAL_URI: http://penpot-frontend:8080
      PENPOT_REDIS_URI: redis://penpot-valkey/0
      PENPOT_EXPORTER_MAX_CONCURRENT_JOBS: "1"
      PENPOT_WASM_WORKER_POOL_MAX: "1"
    networks:
      - penpot-app
      - penpot-data
    depends_on:
      penpot-valkey:
        condition: service_healthy
    logging:
      options:
        max-size: "10m"
        max-file: "3"


  penpot-valkey:
    image: valkey/valkey:8.1.10-alpine
    container_name: penpot-valkey
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    environment:
      VALKEY_EXTRA_FLAGS: --maxmemory 128mb --maxmemory-policy volatile-lfu
    networks:
      - penpot-data
    healthcheck:
      test: ["CMD-SHELL", "valkey-cli ping | grep PONG"]
      interval: 5s
      timeout: 3s
      start_period: 10s
      retries: 10
    logging:
      options:
        max-size: "10m"
        max-file: "3"
```

只有 frontend 绑定宿主机回环地址；backend 与 admin-console 通过用户指定的外部 Docker 网络访问 PostgreSQL，其余内部服务不开放公网端口。设计资产保存于 `./data/assets`。

## .env

保存于服务器部署目录，**不要提交真实凭据**。

```dotenv
PENPOT_VERSION=2.18.3
PENPOT_PUBLIC_URI=https://penpot.example.com
PENPOT_HTTP_PORT=39001
PENPOT_PG_HOST=
PENPOT_PG_PORT=5432
PENPOT_PG_NETWORK=
PENPOT_DB_NAME=penpot
PENPOT_DB_PASSWORD=
PENPOT_SECRET_KEY=
PENPOT_FLAGS='disable-registration enable-admin-console enable-mcp enable-prepl-server'
```

## 部署

1. 在现有 PostgreSQL 中创建独立数据库 `penpot` 和账号 `penpot`，使其拥有该数据库。只在服务器本地安全配置账号密码；不要沿用其他应用账户、改动其他数据库或开放 5432。先确认 Penpot 容器通过所配置的 `PENPOT_PG_NETWORK` 能解析并连接数据库。
2. 将两个代码块分别保存为 `docker-compose.yml`、`.env`。在本地填写 `PENPOT_PUBLIC_URI`、`PENPOT_PG_HOST`、`PENPOT_PG_NETWORK` 和 `PENPOT_DB_PASSWORD`，生成并长期保留 `PENPOT_SECRET_KEY`（可在本机用 `python3 -c 'import secrets; print(secrets.token_urlsafe(64))'`）。按容器实际 UID/GID 确保 `data/assets` 可写。

```bash
cd /path/to/penpot
mkdir -p data/assets
chmod 600 .env
docker compose config --quiet
docker compose pull
docker compose up -d
docker compose ps
```

首次建立账号（交互式输入，不在命令中携带密码）：

```bash
docker compose exec penpot-backend python3 manage.py create-profile
```

创建成功后，从 `PENPOT_FLAGS` 删去 `enable-prepl-server`，运行 `docker compose up -d`。需要邀请与邮件验证时另配 SMTP；不要关闭安全 Cookie。

## 1Panel 反代

在 `penpot.example.com`（替换为实际域名）新建 HTTPS 站点，代理到 `http://127.0.0.1:39001`。下列片段用于**新站点 server 内部**；替换默认反代 `location /`，勿重复定义或改动已有站点：

```nginx
client_max_body_size 350m;
location ~ ^/(mcp/ws|ws/notifications) {
    proxy_pass http://127.0.0.1:39001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;
    access_log off;
}
location ^~ /mcp/stream {
    proxy_pass http://127.0.0.1:39001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto https;
    proxy_buffering off;
    proxy_read_timeout 3600s;
    access_log off;
}
location / {
    proxy_pass http://127.0.0.1:39001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto https;
    access_log off;
}
```

**MCP Token 安全**：官方连接 URL 含 `userToken` 查询参数；常见 Nginx/OpenResty 日志格式包含 `$request`，可能记录查询字符串。新站点禁用访问日志，但 Cloudflare、Portal 和应用日志是否脱敏**仍须验证**。在此之前不要向任何 MCP Portal 登记含真实 Token 的 URL。

## 验收与维护

- **验证**：HTTPS 登录、创建/保存/重开设计、重启后数据保留；打开测试文件并手动连接官方 MCP，验证 AI 读取、绘图及浏览器断连/重连。通过后再单独审批接入现有 Portal。
- **备份**：暂停 Penpot 写入，分别备份外部 PostgreSQL 的 `penpot` 数据库（如 `pg_dump -Fc`）、`./data/assets` 和加密保存的 `.env`；恢复必须使用一致的数据库/资产备份。不要停止或重置其他项目共用的 PostgreSQL。
- **升级**：确认五个 Penpot 应用镜像发布了相同稳定版本，备份后修改 `PENPOT_VERSION` 并执行 `docker compose pull && docker compose up -d`。若数据库已迁移，回滚需要恢复对应数据库和资产备份。

**状态：仅通用模板，未对任何外部数据库、容器启动及 MCP 编辑进行实测。**
