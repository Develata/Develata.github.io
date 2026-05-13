---
title: Sub2API
date: 2026-05-13
order: 8
---

# Sub2API 使用指南

## 1. Sub2API 是什么

[Github Repo](https://github.com/Wei-Shaw/sub2api)

Sub2API 是一个 AI API gateway，用于把上游账号、订阅或多模型服务统一成可管理的 API 服务。它适合放在 new-api 之前，负责上游接入、账号管理、请求转发和后台管理。

本文采用 Docker 部署：

```text
Sub2API + PostgreSQL + Redis
```

如果服务器访问上游服务需要代理，可以额外加 sing-box：

```text
Sub2API -> sing-box -> VLESS Reality -> Internet
```

sing-box 不是 Sub2API 的必需组件，只是本文 compose 里提供的可选出站代理。

官方文档：

* https://github.com/Wei-Shaw/sub2api
* https://github.com/Wei-Shaw/sub2api/blob/main/deploy/README.md
* https://github.com/SagerNet/sing-box
* https://sing-box.sagernet.org/installation/docker/

---

## 2. 推荐架构

配套模板：

* [Sub2API + sing-box Docker Compose](/knowledge/sharing/docker/compose/sub2api)

完整架构：

```text
new-api
    ↓ newapi-sub2api
Sub2API
    ├── PostgreSQL
    ├── Redis
    └── sing-box，可选
            ↓
        代理节点，可选
```

dashboard 默认只监听：

```text
127.0.0.1:38580
```

远程访问建议走 SSH 隧道，或者通过 1Panel / Nginx 加认证反代。

核心约束：

* `sub2api` 不直接暴露公网端口
* PostgreSQL / Redis 只在内部网络可见
* `new-api` 通过 Docker 内网访问 `http://sub2api:8080`
* 需要代理时，Sub2API 出站走 sing-box
* 不需要代理时，删除 sing-box 相关配置即可

---

## 3. 快速部署

创建目录：

```bash
mkdir -p /opt/1panel/docker/compose/sub2api
cd /opt/1panel/docker/compose/sub2api

mkdir -p nginx sing-box sing-box-data sub2api_data postgres_data redis_data
```

创建 new-api 专用内网：

```bash
docker network create --driver bridge --internal newapi-sub2api
```

如果网络已存在，报错可以忽略。

准备文件：

```text
docker-compose.yml
.env
nginx/default.conf
sing-box/config.json      可选，只有启用 sing-box 时需要
```

启动：

```bash
docker compose up -d
docker compose ps
docker compose logs -f sub2api
```

本机验证：

```bash
curl -v http://127.0.0.1:38580/health
```

---

## 4. WebUI 访问

模板通过 `dashboard-proxy` 把 Sub2API WebUI 绑定到宿主机本地：

```text
127.0.0.1:38580
```

本地电脑访问远程服务器：

```powershell
ssh -p 22 -L 38580:127.0.0.1:38580 user@你的服务器IP
```

然后浏览器打开：

```text
http://127.0.0.1:38580
```

账号密码来自 `.env`：

```env
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

如果要用 1Panel 反代，目标写：

```text
http://sub2api-dashboard-proxy:80
```

WebUI 不建议无认证直接暴露公网。

---

## 5. new-api 接入

把 new-api 容器接入同一个 Docker 内网：

```bash
docker network connect newapi-sub2api new-api
```

如果容器名不是 `new-api`，先查：

```bash
docker ps
```

new-api 后台上游地址：

```text
http://sub2api:8080
```

测试：

```bash
docker run --rm -it \
  --network newapi-sub2api \
  curlimages/curl:latest \
  http://sub2api:8080/health
```

---

## 6. 出站代理，可选

如果 Sub2API 所在服务器能直连上游服务，不需要 sing-box。删除：

```text
sing-box 服务
sub2api-proxy 网络
sub2api-egress 网络
HTTP_PROXY / HTTPS_PROXY / ALL_PROXY / UPDATE_PROXY_URL
depends_on.sing-box
```

如果需要代理，本文模板让 Sub2API 访问：

```text
http://sing-box:7890
```

Sub2API 中的关键环境变量：

```text
HTTP_PROXY=http://sing-box:7890
HTTPS_PROXY=http://sing-box:7890
ALL_PROXY=socks5h://sing-box:7890
NO_PROXY=localhost,127.0.0.1,::1,postgres,redis,sing-box,sub2api,new-api,newapi,*.local
UPDATE_PROXY_URL=http://sing-box:7890
```

`NO_PROXY` 必须保留内部服务名，否则 PostgreSQL、Redis、new-api 内网访问也可能被送进代理。

sing-box 使用 `mixed` inbound，`7890` 同时支持 HTTP proxy 和 SOCKS proxy。出站节点示例使用 VLESS Reality；如果你的节点不是 VLESS Reality，按实际协议修改 `outbounds`。

---

## 7. 数据目录

推荐目录：

```text
/opt/1panel/docker/compose/sub2api
├── docker-compose.yml
├── .env
├── nginx/
│   └── default.conf
├── sing-box/
│   └── config.json
├── sing-box-data/
├── sub2api_data/
├── postgres_data/
└── redis_data/
```

重点备份：

```text
.env
docker-compose.yml
nginx/default.conf
sub2api_data/
postgres_data/
redis_data/
sing-box/config.json      如果启用代理
```

迁移时不要只备份 compose 文件。

---

## 8. 常用命令

```bash
docker compose up -d
docker compose down
docker compose ps
docker compose logs -f sub2api
docker compose logs -f postgres
docker compose logs -f redis
docker compose logs -f dashboard-proxy
```

启用 sing-box 时：

```bash
docker compose logs -f sing-box
docker compose exec sing-box sing-box check -c /etc/sing-box/config.json
```

更新：

```bash
docker compose pull
docker compose up -d
```

备份：

```bash
cd /opt/1panel/docker/compose
tar -czf sub2api-backup-$(date +%F).tar.gz sub2api
```

---

## 9. 验证

验证 WebUI：

```bash
curl -v http://127.0.0.1:38580/health
```

验证 new-api 内网访问：

```bash
docker run --rm -it \
  --network newapi-sub2api \
  curlimages/curl:latest \
  http://sub2api:8080/health
```

验证代理出口：

```bash
docker exec -it sub2api sh
wget -O- https://ipinfo.io
```

如果返回的是代理节点出口 IP，说明 sing-box 生效。没有启用 sing-box 时，这一步应返回服务器自身出口 IP。

---

## 10. 排错

### 10.1 PostgreSQL 密码错误

如果 `postgres_data/` 已初始化，之后修改 `.env` 的 `POSTGRES_PASSWORD` 不会自动修改数据库内部密码。

新部署可以重置：

```bash
docker compose down
rm -rf ./postgres_data ./redis_data ./sub2api_data
docker compose up -d
```

已有数据不要直接删目录。

### 10.2 Redis 认证失败

检查：

```bash
docker compose logs --tail=100 redis
docker compose logs --tail=100 sub2api
```

确认 `.env` 中 `REDIS_PASSWORD` 和容器环境变量一致。Redis 数据目录已存在时，也建议先确认是否有旧配置残留。

### 10.3 dashboard 访问不了

先在服务器上测试：

```bash
curl -v http://127.0.0.1:38580
docker logs --tail=100 sub2api-dashboard-proxy
```

服务器本机不通时，SSH 隧道一定不通。

### 10.4 new-api 访问不到 Sub2API

检查网络：

```bash
docker network inspect newapi-sub2api
```

确认 `new-api` 和 `sub2api` 都在该网络中，上游地址使用：

```text
http://sub2api:8080
```

### 10.5 sing-box 启动失败

检查配置：

```bash
docker compose logs --tail=100 sing-box
docker compose run --rm sing-box check -c /etc/sing-box/config.json
```

常见原因：

* VLESS UUID 不完整
* Reality `public_key` / `short_id` 不匹配
* 复制了旧版 DNS 写法
* 复制了旧版 inbound `sniff` 字段

---

## 11. 参考链接

```text
https://github.com/Wei-Shaw/sub2api
https://github.com/Wei-Shaw/sub2api/blob/main/deploy/README.md
https://github.com/SagerNet/sing-box
https://sing-box.sagernet.org/installation/docker/
https://sing-box.sagernet.org/configuration/inbound/mixed/
https://sing-box.sagernet.org/configuration/outbound/vless/
```
