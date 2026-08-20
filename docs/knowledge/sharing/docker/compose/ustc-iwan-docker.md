---
title: ustc-iwan-docker
---

## Github Repo

[ustc-iwan-docker Github Repo](https://github.com/Develata/ustc-iwan-docker)

上游项目：[yyy1mu/ustc-iwan](https://github.com/yyy1mu/ustc-iwan)

compose更新日期: 2026-08-20

使用上游原生 **non-TUN SOCKS5** 模式，不需要 `/dev/net/tun`、`NET_ADMIN` 或 `privileged`。

容器加入 `1panel-network` 后，同一网络中的其他容器可以直接通过：

```text
socks5h://ustc-iwan:1080
```

访问 USTC iWAN。

宿主机则通过：

```text
socks5h://127.0.0.1:1080
```

访问。

## docker-compose

```yaml
networks:
  1panel-network:
    external: true

services:
  ustc-iwan:
    container_name: ustc-iwan
    image: ghcr.io/develata/ustc-iwan-docker:${IWAN_IMAGE_TAG}
    restart: unless-stopped

    env_file:
      - .env

    environment:
      - IWAN_SERVER_INDEX=${IWAN_SERVER_INDEX}
      - IWAN_SOCKS_LISTEN=0.0.0.0:1080
      - IWAN_SOCKS_MTU=${IWAN_SOCKS_MTU}

      # 数据面健康检查
      - IWAN_HEALTHCHECK_URL=${IWAN_HEALTHCHECK_URL}
      - IWAN_HEALTHCHECK_TIMEOUT=${IWAN_HEALTHCHECK_TIMEOUT}
      - IWAN_WATCHDOG_INTERVAL=${IWAN_WATCHDOG_INTERVAL}
      - IWAN_WATCHDOG_FAILURES=${IWAN_WATCHDOG_FAILURES}
      - IWAN_STARTUP_GRACE=${IWAN_STARTUP_GRACE}

    labels:
      createdBy: Apps
      com.centurylinklabs.watchtower.enable: 'true'

    networks:
      - 1panel-network

    ports:
      - "${HOST_IP}:${IWAN_HOST_PORT}:1080"

    volumes:
      - ${IWAN_DATA_PATH}:/config
```

## env

```env
# Docker 镜像
# stable 会跟随本仓库构建的最新稳定镜像
# 如果需要完全固定版本，可以改成具体的 vX.Y.Z
IWAN_IMAGE_TAG=stable

# 宿主机 SOCKS5 监听
# 默认只开放给宿主机本地，不直接暴露到公网
HOST_IP=127.0.0.1
IWAN_HOST_PORT=1080

# iWAN 配置及下载的上游 binary 持久化目录
IWAN_DATA_PATH=./data/iwan

# iWAN 线路序号
# 先执行 docker compose run --rm ustc-iwan list 查看
IWAN_SERVER_INDEX=1

# SOCKS 用户态网络 MTU
IWAN_SOCKS_MTU=1380

# iWAN 数据面健康检查
IWAN_HEALTHCHECK_URL=https://api.llm.ustc.edu.cn/
IWAN_HEALTHCHECK_TIMEOUT=10

# 每隔多少秒检查一次
IWAN_WATCHDOG_INTERVAL=30

# 连续失败多少次后重启 iWAN 会话
IWAN_WATCHDOG_FAILURES=4

# iWAN 启动后等待多少秒再开始健康检查
IWAN_STARTUP_GRACE=20
```

## 首次初始化

第一次部署时需要先通过 USTC 统一身份认证获取 iWAN 配置：

```bash
docker compose run --rm ustc-iwan fetch
```

终端会给出登录地址。

在浏览器中完成 USTC 统一身份认证后，按照提示将 `com.panabit.mobile://...` 回调 URL 粘贴回终端。

认证信息会持久化到：

```text
${IWAN_DATA_PATH}/servers.json
```

## 查看线路

```bash
docker compose run --rm ustc-iwan list
```

例如：

```text
 1. 教育网线路
 2. 电信线路
 3. 联通线路
 4. 移动线路
```

然后修改 `.env`：

```env
IWAN_SERVER_INDEX=1
```

## 启动

```bash
docker compose up -d
```

## 测试 SOCKS5

宿主机：

```bash
curl \
  --proxy socks5h://127.0.0.1:1080 \
  https://api.llm.ustc.edu.cn/
```

其他加入 `1panel-network` 的容器：

```text
socks5h://ustc-iwan:1080
```

例如其他容器可以配置：

```env
ALL_PROXY=socks5h://ustc-iwan:1080
```

`socks5h` 会把 hostname 交给 iWAN SOCKS server 解析，可以避免宿主机 Mihomo / Clash 开启 Fake-IP 后先把 USTC 域名解析成 `198.18.0.0/16` 一类假地址。

### Mihomo / Clash TUN

如果宿主机同时运行 Mihomo / Clash TUN，建议：

```yaml
dns:
  fake-ip-filter:
    - "+.ustc.edu.cn"
    - "+.ustc.cn"
```

同时尽量保证 iWAN Server 自身的 UDP 连接直连，不要再套入其他代理链路。

### 安全

默认：

```env
HOST_IP=127.0.0.1
```

不要随意改成：

```env
HOST_IP=0.0.0.0
```

当前 SOCKS5 服务没有面向公网使用的认证层，将 `1080` 直接暴露到公网可能使服务器成为公开代理。

