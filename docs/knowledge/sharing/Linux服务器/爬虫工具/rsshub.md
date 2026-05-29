---
title: RSSHub
date: 2026-05-29
order: 1
---

## Github Repo

[DIYgod/RSSHub Github Repo](https://github.com/DIYgod/RSSHub)

## 官方文档

[RSSHub Docs](https://docs.rsshub.app/)

## RSSHub 是什么

RSSHub 是一个开源 RSS 生成服务。它的目标很直接：把原本没有 RSS、RSS 不完整、或者官方订阅体验很差的网站内容，转换成标准 RSS/Atom/JSON Feed。

典型场景：

- 订阅 B 站、微博、知乎、GitHub、Telegram、YouTube 等平台内容。
- 把网页列表、公告页、搜索结果页转换成订阅源。
- 给 FreshRSS、Miniflux、Folo、Reeder、NetNewsWire 等阅读器提供 feed。
- 在自己的服务器上部署私有实例，减少公共实例不稳定、限流、封禁、隐私泄漏的问题。

一句话：RSSHub 不是 RSS 阅读器，而是 RSS 源生成器。

## 为什么建议自建

RSSHub 有公共实例，但长期使用更建议自建。

原因主要有四个：

1. 公共实例容易被热门路由拖慢，也容易被目标站点限流。
2. 某些路由需要 Cookie、Token、API Key，不适合放在公共实例。
3. 自建实例可以配置 Redis 缓存、代理、访问密钥和反向代理。
4. 订阅器的稳定性取决于 feed 可用性，自建更容易排错。

如果只是临时测试某个路由，可以先用公共实例；如果要作为长期信息入口，应当自建。

## 部署方式选择

RSSHub 官方推荐 Docker Compose 部署。原因是 RSSHub 的完整运行环境不只一个 Node.js 服务：

- `rsshub`：主服务，默认监听 `1200`。
- `redis`：缓存服务，建议生产环境启用。
- `browserless`：给需要真实浏览器渲染的路由使用。

如果只用 `docker run diygod/rsshub`，可以启动主服务，但没有 Redis 和 browserless。部分路由会慢，部分需要浏览器的路由可能不能正常工作。

所以服务器部署建议使用：

```text
Docker Compose + Redis + browserless + 反向代理
```

## 前置准备

### 1. 准备目录

建议放在 `/opt/rsshub`：

```bash
sudo mkdir -p /opt/rsshub
cd /opt/rsshub
```

目录结构：

```text
/opt/rsshub
├─ .env
└─ docker-compose.yml
```

### 2. 准备域名

建议给 RSSHub 单独准备一个子域名：

```text
rsshub.example.com
```

不建议直接暴露 `http://服务器IP:1200` 给公网。生产环境更合理的做法是：

```text
用户 -> HTTPS 反向代理 -> 127.0.0.1:1200 -> RSSHub
```

## Docker Compose 部署

可直接复制的 1Panel / Docker Compose 模板放在这里：

[RSSHub Docker Compose](/knowledge/sharing/docker/compose/rsshub)

主指南不再重复维护完整 `docker-compose.yml`。实际部署时只需要：

1. 在服务器上创建 `/opt/rsshub`。
2. 按上面的 compose 专文写入 `docker-compose.yml` 和 `.env`。
3. 用 `openssl rand -hex 32` 分别生成 `REDIS_PASSWORD` 和 `ACCESS_KEY`。
4. 保持 `HOST_IP=127.0.0.1`，再用 1Panel / OpenResty / Nginx 反向代理到 `127.0.0.1:1200`。

如果开启 `ACCESS_KEY`，健康检查必须带 key，并且 compose 里要写成 `$${ACCESS_KEY}`，让变量在容器内部解析。

## OpenResty 反向代理

如果你已经按本站的 OpenResty 方式管理反向代理，可以新建配置：

```bash
sudo nano /usr/local/openresty/nginx/conf/conf.d/rsshub.conf
```

HTTP 到 HTTPS 跳转：

```nginx
server {
    listen 80;
    server_name rsshub.example.com;

    return 301 https://$host$request_uri;
}
```

HTTPS 反向代理：

```nginx
server {
    listen 443 ssl;
    server_name rsshub.example.com;

    ssl_certificate      /usr/local/openresty/nginx/conf/ssl/example.com.crt;
    ssl_certificate_key  /usr/local/openresty/nginx/conf/ssl/example.com.key;

    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:1200;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

检查配置：

```bash
sudo openresty -t
```

重载：

```bash
sudo systemctl reload openresty
```

## 访问方式

假设域名是：

```text
https://rsshub.example.com
```

假设访问密钥是：

```text
ILoveRSSHub
```

那么访问路由时加上：

```text
?key=ILoveRSSHub
```

例如 GitHub 用户动态：

```text
https://rsshub.example.com/github/received_events/DIYgod?key=ILoveRSSHub
```

如果不想在订阅链接里直接暴露 `ACCESS_KEY`，可以使用 RSSHub 的 access code。access code 是：

```text
md5(路由路径 + ACCESS_KEY)
```

例如：

```text
md5("/github/received_events/DIYgod" + "ILoveRSSHub")
```

然后访问：

```text
https://rsshub.example.com/github/received_events/DIYgod?code=生成出的md5
```

实际使用中，如果只是自己用，`key` 最简单；如果要把某条 feed 分享给别人，`code` 更合适。

## 常用路由示例

RSSHub 路由非常多，应以官方文档为准。下面只列一些常见类型。

### GitHub

用户动态：

```text
/github/received_events/:user
```

仓库 releases：

```text
/github/repos/:owner/:repo/releases
```

仓库 commits：

```text
/github/repos/:owner/:repo/commits/:branch
```

### Bilibili

用户投稿：

```text
/bilibili/user/video/:uid
```

用户动态：

```text
/bilibili/user/dynamic/:uid
```

### Telegram

频道：

```text
/telegram/channel/:username
```

### YouTube

频道：

```text
/youtube/channel/:id
```

用户：

```text
/youtube/user/:username
```

## 路由怎么找

最直接的方法是查官方文档：

[RSSHub Routes](https://docs.rsshub.app/routes/popular)

也可以安装浏览器扩展：

[RSSHub Radar](https://github.com/DIYgod/RSSHub-Radar)

它的作用是：打开一个页面后，自动提示这个页面是否有官方 RSS 或 RSSHub 路由。

## 和 RSS 阅读器配合

RSSHub 只负责生成 feed，不负责阅读。

常见组合：

```text
RSSHub -> FreshRSS
RSSHub -> Miniflux
RSSHub -> Folo
RSSHub -> Reeder
RSSHub -> NetNewsWire
```

如果你有自己的服务器，比较推荐：

```text
RSSHub + FreshRSS / Miniflux
```

这样 RSSHub 负责抓取和转换，阅读器负责订阅、去重、已读状态、全文搜索和跨设备同步。

## 更新

进入部署目录：

```bash
cd /opt/rsshub
```

拉取新镜像：

```bash
docker compose pull
```

重建并启动：

```bash
docker compose up -d
```

清理旧镜像：

```bash
docker image prune -f
```

## 日志管理

如果担心 Docker 日志过大，可以在 `rsshub` 服务里加：

```yaml
logging:
  driver: json-file
  options:
    max-size: "50m"
    max-file: "3"
```

也可以在 Docker 全局配置 `/etc/docker/daemon.json` 里统一限制日志大小。

## 代理配置

部分路由会遇到目标站点访问限制。这时可以给 RSSHub 配置 HTTP/HTTPS 代理。

`.env` 示例：

```env
PROXY_URI=http://proxy.example.com:7890
PROXY_URL_REGEX=.*
```

如果代理需要认证：

```env
PROXY_AUTH=base64后的用户名密码
```

注意：RSSHub 官方配置里 `PROXY_URI` 的协议支持 `http` 和 `https`。如果你的代理是 socks5，需要先转换成 HTTP 代理，或者使用支持 HTTP 入站的代理服务。

## 常见问题

### 1. 访问 RSSHub 首页正常，但某个路由 500

先看日志：

```bash
docker compose logs -f rsshub
```

常见原因：

- 目标站点改版，路由暂时失效。
- 目标站点反爬，需要 Cookie、Token 或代理。
- 该路由需要 browserless，但 browserless 没启动。
- 目标站点响应慢，`REQUEST_TIMEOUT` 太短。

### 2. 阅读器刷新太频繁，目标站点限流

调大缓存时间：

```env
CACHE_EXPIRE=1800
CACHE_CONTENT_EXPIRE=7200
```

含义：

- `CACHE_EXPIRE=1800`：路由结果缓存 30 分钟。
- `CACHE_CONTENT_EXPIRE=7200`：内容缓存 2 小时。

### 3. 设置了 ACCESS_KEY 后健康检查失败

如果启用了：

```env
ACCESS_KEY=xxx
```

健康检查必须带上：

```text
/healthz?key=xxx
```

也就是 compose 里应写成：

```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -f \"http://localhost:1200/healthz?key=$${ACCESS_KEY}\""]
```

### 4. 不想让别人直接访问我的 RSSHub

有三种做法：

1. 设置 `ACCESS_KEY`。
2. 在 OpenResty / Nginx / Cloudflare 层做访问控制。
3. 只监听 `127.0.0.1:1200`，不开放容器端口到公网。

我个人建议至少做第 1 和第 3 项。

### 5. 某些路由需要登录态怎么办

部分路由需要 Cookie、Token 或 API Key。做法是把对应变量写进 `.env`，再重启容器。

```bash
docker compose up -d
```

具体变量名要看对应路由文档，不同平台不一样。

## 推荐配置

个人自用实例建议：

```env
HOST_IP=127.0.0.1
RSSHUB_PORT=1200
CACHE_TYPE=redis
CACHE_EXPIRE=600
CACHE_CONTENT_EXPIRE=3600
REQUEST_TIMEOUT=5000
ACCESS_KEY=强随机字符串
PLAYWRIGHT_WS_ENDPOINT=ws://browserless:3000
```

如果服务器内存很小，且你确定不用需要浏览器渲染的路由，可以删掉 `browserless` 服务，同时删除：

```env
PLAYWRIGHT_WS_ENDPOINT=ws://browserless:3000
```

以及 compose 里的：

```yaml
depends_on:
  browserless:
    condition: service_healthy
```

但这会牺牲部分路由的可用性。

## 参考链接

- [DIYgod/RSSHub](https://github.com/DIYgod/RSSHub)
- [RSSHub 官方文档](https://docs.rsshub.app/)
- [RSSHub 部署文档](https://docs.rsshub.app/deploy/)
- [RSSHub 配置文档](https://docs.rsshub.app/deploy/config)
- [RSSHub 官方 docker-compose.yml](https://github.com/DIYgod/RSSHub/blob/master/docker-compose.yml)
- [RSSHub Radar](https://github.com/DIYgod/RSSHub-Radar)
