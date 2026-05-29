---
title: sing-box
---

## Github Repo

[sing-box Github Repo](https://github.com/SagerNet/sing-box)

compose更新日期: 2026-04-14

## 前置工作

### 目录结构
准备一个目录，构建好如下结构：

```text
/opt/singbox
├─ .env
├─ docker-compose.yml
├─ templates/
│  └─ config.json.template
├─ generated/
│  └─ config.json
├─ data/
├─ www/
└─ ssl/
   └─ example.com/
      ├─ fullchain.pem
      └─ privkey.pem
```

### 证书准备
 **VLESS + Reality 不依赖你自己的证书域名做握手目标**
 **Hysteria2 / Naive / TUIC 都依赖你自己的真实 TLS 证书**

所以你需要把 `example.com` 对应的证书放到：

```text
/opt/singbox/ssl/example.com/fullchain.pem
/opt/singbox/ssl/example.com/privkey.pem
```

### 密钥和凭据
#### 1）生成 Reality 密钥对

TLS 文档明确写了：Reality 服务端要用 `private_key`，客户端要用 `public_key`，都由 `sing-box generate reality-keypair` 生成。`short_id` 是必填，长度是 0 到 8 位十六进制字符串。([Sing Box](https://sing-box.sagernet.org/configuration/shared/tls/ "TLS - sing-box"))

```bash
docker run --rm ghcr.io/sagernet/sing-box generate reality-keypair
```

你会拿到两项：

- `PrivateKey` → 服务端配置里用
    
- `PublicKey` → 客户端配置里用
    

自己再准备一个 8 位十六进制 `short_id`，例如：

```bash
openssl rand -hex 8
```

#### 2）生成 UUID

给 VLESS 和 TUIC 各准备一个 UUID：

```bash
cat /proc/sys/kernel/random/uuid
cat /proc/sys/kernel/random/uuid
```

#### 3）生成强密码

给 Hysteria2、Naive、TUIC 分别准备长随机密码：

```bash
openssl rand -base64 24
openssl rand -base64 24
openssl rand -base64 24
openssl rand -base64 24
```

其中 Hysteria2 我建议准备两个：

- `password`
- `obfs.password`
    

### templates/config.json.template

把下面内容保存为 `/opt/singbox/templates/config.json.template`：

```json
{
  "log": {
    "level": "${LOG_LEVEL}",
    "timestamp": true
  },
  "inbounds": [
    {
      "type": "vless",
      "tag": "vless-reality-in",
      "listen": "::",
      "listen_port": ${VLESS_PORT},
      "users": [
        {
          "name": "vless-user",
          "uuid": "${VLESS_UUID}",
          "flow": "xtls-rprx-vision"
        }
      ],
      "tls": {
        "enabled": true,
        "server_name": "${REALITY_HANDSHAKE_SERVER}",
        "min_version": "1.3",
        "max_version": "1.3",
        "reality": {
          "enabled": true,
          "handshake": {
            "server": "${REALITY_HANDSHAKE_SERVER}",
            "server_port": ${REALITY_HANDSHAKE_PORT}
          },
          "private_key": "${REALITY_PRIVATE_KEY}",
          "short_id": [
            "${REALITY_SHORT_ID}"
          ],
          "max_time_difference": "1m"
        }
      }
    },
    {
      "type": "hysteria2",
      "tag": "hy2-in",
      "listen": "::",
      "listen_port": ${HY2_PORT},
      "up_mbps": ${HY2_UP_MBPS},
      "down_mbps": ${HY2_DOWN_MBPS},
      "obfs": {
        "type": "salamander",
        "password": "${HY2_OBFS_PASSWORD}"
      },
      "users": [
        {
          "name": "hy2-user",
          "password": "${HY2_PASSWORD}"
        }
      ],
      "ignore_client_bandwidth": false,
      "tls": {
        "enabled": true,
        "certificate_path": "${TLS_CERT_PATH}",
        "key_path": "${TLS_KEY_PATH}",
        "min_version": "1.3",
        "max_version": "1.3",
        "alpn": [
          "h3"
        ]
      },
      "masquerade": {
        "type": "file",
        "directory": "/srv/www"
      }
    },
    {
      "type": "naive",
      "tag": "naive-in",
      "listen": "::",
      "listen_port": ${NAIVE_PORT},
      "users": [
        {
          "username": "${NAIVE_USERNAME}",
          "password": "${NAIVE_PASSWORD}"
        }
      ],
      "tls": {
        "enabled": true,
        "certificate_path": "${TLS_CERT_PATH}",
        "key_path": "${TLS_KEY_PATH}"
      }
    },
    {
      "type": "tuic",
      "tag": "tuic-in",
      "listen": "::",
      "listen_port": ${TUIC_PORT},
      "users": [
        {
          "name": "tuic-user",
          "uuid": "${TUIC_UUID}",
          "password": "${TUIC_PASSWORD}"
        }
      ],
      "congestion_control": "${TUIC_CONGESTION_CONTROL}",
      "auth_timeout": "3s",
      "zero_rtt_handshake": false,
      "heartbeat": "10s",
      "tls": {
        "enabled": true,
        "certificate_path": "${TLS_CERT_PATH}",
        "key_path": "${TLS_KEY_PATH}",
        "min_version": "1.3",
        "max_version": "1.3",
        "alpn": [
          "h3"
        ]
      }
    }
  ],
  "outbounds": [
    {
      "type": "direct",
      "tag": "direct"
    },
    {
      "type": "block",
      "tag": "block"
    }
  ],
  "route": {
    "final": "direct"
  }
}
```
## env

```
TZ=UTC

HOST_IP=0.0.0.0

VLESS_PORT=17000
HY2_PORT=26000
NAIVE_PORT=35000
TUIC_PORT=48000

SERVER_DOMAIN=example.com
REALITY_HANDSHAKE_SERVER=www.microsoft.com
REALITY_HANDSHAKE_PORT=443

VLESS_UUID=
REALITY_PRIVATE_KEY=
REALITY_PUBLIC_KEY=
REALITY_SHORT_ID=

HY2_PASSWORD=
HY2_OBFS_PASSWORD=
HY2_UP_MBPS=200
HY2_DOWN_MBPS=200

NAIVE_USERNAME=naive-user
NAIVE_PASSWORD=

TUIC_UUID=
TUIC_PASSWORD=
TUIC_CONGESTION_CONTROL=cubic

LOG_LEVEL=warn

TLS_CERT_PATH=/etc/ssl/sing-box/fullchain.pem
TLS_KEY_PATH=/etc/ssl/sing-box/privkey.pem
```


## docker-compose
```yaml
networks:
  1panel-network:
    external: true

services:
  singbox-config:
    image: alpine:3.20
    container_name: singbox-config
    restart: "no"
    env_file:
      - .env
    volumes:
      - ./templates:/templates:ro
      - ./generated:/generated
    command: >
      sh -c "
      apk add --no-cache gettext &&
      envsubst < /templates/config.json.template > /generated/config.json &&
      echo 'generated /generated/config.json'
      "
    networks:
      - 1panel-network

  sing-box:
    image: ghcr.io/sagernet/sing-box:latest
    container_name: sing-box
    restart: unless-stopped
    depends_on:
      singbox-config:
        condition: service_completed_successfully
    env_file:
      - .env
    ports:
      - ${HOST_IP}:${VLESS_PORT}:${VLESS_PORT}/tcp
      - ${HOST_IP}:${HY2_PORT}:${HY2_PORT}/udp
      - ${HOST_IP}:${NAIVE_PORT}:${NAIVE_PORT}/tcp
      - ${HOST_IP}:${TUIC_PORT}:${TUIC_PORT}/udp
    volumes:
      - ./generated:/etc/sing-box:ro
      - ./data:/var/lib/sing-box
      - ./www:/srv/www:ro
      - ./ssl/example.com:/etc/ssl/sing-box:ro
    command: -D /var/lib/sing-box -C /etc/sing-box run
    read_only: true
    tmpfs:
      - /tmp
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    networks:
      - 1panel-network
```

`singbox-config` 只负责把模板渲染成 `generated/config.json`

**防火墙记得放开对应端口**