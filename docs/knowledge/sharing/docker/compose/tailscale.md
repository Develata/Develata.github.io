---
title: tailscale
---

## Github Repo

[Tailscale Github Repo](https://github.com/tailscale/tailscale) · [Docker 文档](https://tailscale.com/docs/features/containers/docker/docker-params)

compose更新日期: 2026-11-11

适用于 Linux Docker Engine，需有 `/dev/net/tun`。不要与宿主机已有的 Tailscale 同时运行。

## docker-compose

```yaml
services:
    tailscale:
        container_name: tailscale
        image: tailscale/tailscale:latest
        restart: unless-stopped
        network_mode: host
        cap_add:
            - NET_ADMIN
            - NET_RAW
        devices:
            - /dev/net/tun:/dev/net/tun
        environment:
            - TS_AUTHKEY=${TS_AUTHKEY:-}
            - TS_HOSTNAME=${TS_HOSTNAME:-linux-server}
            - TS_STATE_DIR=/var/lib/tailscale
            - TS_AUTH_ONCE=true
            - TS_USERSPACE=false
            - TS_ACCEPT_DNS=false
            - TS_EXTRA_ARGS=${TS_EXTRA_ARGS:-}
        labels:
            createdBy: Apps
        volumes:
            - ${TS_DATA_PATH:-./tailscale-state}:/var/lib/tailscale
```

## env

保存为同目录的 `.env`：

```env
TS_HOSTNAME=linux-server
TS_DATA_PATH=./tailscale-state

# 首次接入填写 Auth key
TS_AUTHKEY=

# 使用官方控制服务时留空
TS_EXTRA_ARGS=
```

在 [Tailscale 后台](https://console.tailscale.com/admin/settings/keys)生成 Auth key，长期运行的设备关闭 `Ephemeral`。保留状态目录可复用登录；首次接入成功后可清空 Key，重建容器后生效。

**host 模式具有宿主机网络管理权限，不添加端口映射。按需限制 tailnet 访问规则，不要公开 `.env` 和状态目录。**

## Headscale

[Headscale Github Repo](https://github.com/juanfont/headscale) · [配置文档](https://headscale.net/stable/ref/configuration/)

自建控制服务，设备端仍使用 Tailscale。以下配置需要已有 `1panel-network` 和 HTTPS 反代。

### docker-compose

单独保存到 Headscale 目录：

```yaml
networks:
    1panel-network:
        external: true

services:
    headscale:
        container_name: headscale
        image: headscale/headscale:stable
        restart: unless-stopped
        command: serve
        read_only: true
        tmpfs:
            - /var/run/headscale
        labels:
            createdBy: Apps
        networks:
            - 1panel-network
        volumes:
            - ./config:/etc/headscale:ro
            - ./data:/var/lib/headscale
```

### config.yaml

保存为 `config/config.yaml`，替换域名，确保 `data/` 可写：

```yaml
server_url: https://headscale.example.com
listen_addr: 0.0.0.0:8080
metrics_listen_addr: ""
grpc_listen_addr: 127.0.0.1:50443

noise:
    private_key_path: /var/lib/headscale/noise_private.key

prefixes:
    v4: 100.64.0.0/10
    v6: fd7a:115c:a1e0::/48

database:
    type: sqlite
    sqlite:
        path: /var/lib/headscale/db.sqlite
        write_ahead_log: true

derp:
    server:
        enabled: false
    urls:
        - https://controlplane.tailscale.com/derpmap/default
    auto_update_enabled: true
    update_frequency: 3h

dns:
    magic_dns: false
    base_domain: ""
    override_local_dns: false

unix_socket: /var/run/headscale/headscale.sock
unix_socket_permission: "0770"
```

- 反代容器加入同一网络，配置 **HTTPS 443 → `http://headscale:8080`**，支持 POST 协议升级并透传 `Upgrade`、`Connection`，见[反代文档](https://headscale.net/stable/ref/integration/reverse-proxy/)。
- Cloudflare 使用 **DNS only**，不套橙云或 Tunnel。
- 此配置关闭 MagicDNS，使用公共 DERP；未配置[访问策略](https://headscale.net/stable/ref/policy/)时，已注册节点默认互通。
- 升级前备份 `data/`，按镜像实际版本核对[官方配置](https://headscale.net/stable/ref/configuration/)。

### 客户端接入

按[官方流程](https://headscale.net/stable/usage/getting-started/#pre-authenticated-key)创建用户并生成 `preauthkey`，修改前面客户端的 `.env`：

```env
TS_DATA_PATH=./headscale-client-state
TS_AUTHKEY=替换为Headscale生成的preauthkey
TS_EXTRA_ARGS=--login-server=https://headscale.example.com
```

切换控制服务时使用新的状态目录，保留旧目录；`TS_AUTH_ONCE=true` 不会仅因地址变化而重新登录。**密钥和 `data/` 不要提交到仓库。**
