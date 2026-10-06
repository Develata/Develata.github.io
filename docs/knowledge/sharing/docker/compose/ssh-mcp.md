---
title: ssh-mcp
---

## Github Repo

[SSH MCP Github Repo](https://github.com/tufantunc/ssh-mcp)

compose更新日期: 2026-10-06

## docker-compose

保存为 `compose.yaml`（固定上游 v2.18.0 源码构建，首次部署须先按下方步骤构建本地镜像）：

```yaml
networks:
    1panel-network:
        external: true

services:
    ssh-mcp:
        container_name: ssh-mcp
        image: localhost/ssh-mcp:v2.18.0-723a7c5a4846
        pull_policy: never
        build:
            context: https://github.com/tufantunc/ssh-mcp.git#723a7c5a4846dfba822894d566212b1a58656b5e
            dockerfile: Dockerfile
        restart: unless-stopped
        init: true
        user: "65532:65532"
        read_only: true
        cap_drop:
            - ALL
        security_opt:
            - no-new-privileges:true
        command:
            - --config=/home/appuser/.config/ssh-mcp/config.toml
            - --transport=http
            - --httpHost=0.0.0.0
            - --httpPort=3000
            - --bearerToken=${SSH_MCP_BEARER_TOKEN:?Set a strong random bearer token in .env}
            - --allowedHosts=${SSH_MCP_ALLOWED_HOSTS:?Set exact HTTP Host headers in .env}
            - --hostKeyMode=strict
            - --rateLimit=60
            - --authFailureLimit=10
            - --httpSessionTtl=600000
            - --auditEntropyScan
            - --auditTamperEvident
        environment:
            TZ: ${TIME_ZONE:-Asia/Shanghai}
            XDG_DATA_HOME: /var/lib
            SSH_MCP_TRIAL_PASSPHRASE: ${SSH_MCP_TRIAL_PASSPHRASE:-}
        labels:
            createdBy: Apps
        networks:
            - 1panel-network
        ports:
            - "127.0.0.1:${SSH_MCP_HOST_PORT:-3000}:3000"
        volumes:
            - type: bind
              source: ./config
              target: /home/appuser/.config/ssh-mcp
              read_only: true
              bind:
                  create_host_path: false
            - type: bind
              source: ./secrets/id_ed25519
              target: /run/secrets/ssh-mcp-id_ed25519
              read_only: true
              bind:
                  create_host_path: false
            - type: bind
              source: ./data
              target: /var/lib/ssh-mcp
              bind:
                  create_host_path: false
        tmpfs:
            - /tmp:rw,noexec,nosuid,nodev,size=32m,mode=1777
        healthcheck:
            test:
                - CMD
                - node
                - -e
                - "fetch('http://127.0.0.1:3000/health',{signal:AbortSignal.timeout(3000)}).then(async r=>{const b=await r.json();process.exit(r.ok&&b.healthy===true&&b.configured===true?0:1)}).catch(()=>process.exit(1))"
            interval: 30s
            timeout: 5s
            start_period: 20s
            retries: 3
        cpus: ${SSH_MCP_CPUS:-1.0}
        mem_limit: ${SSH_MCP_MEMORY:-512M}
        pids_limit: 128
        logging:
            driver: json-file
            options:
                max-size: "10m"
                max-file: "3"
```

## env

保存为同目录的 `.env`：

```env
TIME_ZONE=Asia/Shanghai
SSH_MCP_HOST_PORT=3000

# 必填：本机执行 openssl rand -hex 32 生成，不要提交到仓库
SSH_MCP_BEARER_TOKEN=

# HTTP Host 白名单；修改端口时同步修改，反代时添加实际 Host
SSH_MCP_ALLOWED_HOSTS=127.0.0.1:3000,localhost:3000,ssh-mcp:3000

# 私钥有口令才填；含 $、# 或空格时用单引号包住
SSH_MCP_TRIAL_PASSPHRASE=

SSH_MCP_CPUS=1.0
SSH_MCP_MEMORY=512M
```

## config.toml

保存为 `config/config.toml`，替换主机、账号、目录和指纹；指纹须通过目标机可信控制台核对。

```toml
[defaults]
defaultProfile = "trial"
approvalMode = "ask-all"
approvalGrantTtlMs = 0
commandTimeoutMs = 30000
commandMaxChars = 5000
commandMaxOutputBytes = 1048576
commandQuotaPerDay = 100
sessionMaxPerConnection = 1
sessionIdleTimeoutMs = 300000
sessionBackgroundMaxMs = 300000
connectionIdleReapMs = 300000

[[profiles]]
name = "trial"
host = "192.0.2.10"
port = 22
user = "mcp-observer"
auth = "key"
keyRef = "/run/secrets/ssh-mcp-id_ed25519"
workdir = "/home/mcp-observer"
trustedHostKey = "SHA256:REPLACE_WITH_VERIFIED_FINGERPRINT"
role = "viewer"
group = "prod"
readOnly = true
approvalPolicy = "ask-all"
tty = false
```

## 使用

在 **1Panel 当前节点的终端**准备目录；以下命令用 root 执行：

```bash
mkdir -p /opt/ssh-mcp
cd /opt/ssh-mcp
mkdir -p config secrets data
```

将上述 `compose.yaml`、`.env`、`config/config.toml` 保存到对应位置，填好 token 和实际 SSH 配置，再放入专用私钥 `secrets/id_ed25519`。对应公钥须已配置到目标账号。

```bash
cd /opt/ssh-mcp
printf '%s\n' '.env' 'config/' 'secrets/' 'data/' > .gitignore
chmod 600 .env config/config.toml secrets/id_ed25519
chmod 700 config secrets data
chown 65532:65532 config config/config.toml secrets/id_ed25519 data

# 同时检查 1Panel 所用的 Compose 解析参数；不输出含 token 的配置
docker compose config --format json --no-normalize >/dev/null
docker compose build ssh-mcp
docker image inspect --format '{{.Id}}' localhost/ssh-mcp:v2.18.0-723a7c5a4846
```

以上全部成功后，再到 **容器 → 编排 → 创建编排 → 路径选择**，选择 `/opt/ssh-mcp/compose.yaml`。确认环境变量栏已加载同目录 `.env`，**不要勾选「强制拉取镜像」**，然后创建。终端与 1Panel 必须使用同一个 Docker daemon；本地镜像不是可从仓库拉取的镜像。

不用 1Panel 时，在同目录执行 `docker compose up -d --no-build`。目录可以更换，但配置、私钥、数据目录必须与 Compose 文件保持上述相对位置。UID/GID `65532:65532` 适用于普通 Linux Docker；rootless / userns 环境按实际映射调整。

若仍出现 `cannot unmarshal !!map into string`，先检查 token/Host 是否填写，以及上述 Compose 解析命令是否成功。旧写法只有 `build` 没有 `image`，会让部分 1Panel 进入仅接受字符串挂载的回退解析；不要为绕过报错删掉 `create_host_path: false`。

MCP：`http://127.0.0.1:3000/`，Streamable HTTP，请求头 `Authorization: Bearer <token>`。1Panel 同网络反代地址：`http://ssh-mcp:3000`，保留认证头并同步 Host 白名单。

验收：先看容器为 `healthy`；再用支持 elicitation 的 MCP 客户端连接，调用 `list-connections` 和 `read-command`（`profile="trial"`、`command="pwd"`），确认审批后返回目标机目录。`healthy` 只检查服务和配置，实际 SSH 连通与认证以这次命令为准。

- 当前为测试机低权限账号的只读配置，不等于完整交互终端；保留严格指纹校验，`ask-all` 需要客户端支持 elicitation。未配置公网入口或 OAuth。不要公开 `.env`、私钥及 `docker inspect` 完整输出
- 使用 Docker Engine ≥28 和支持上述解析参数的 Compose V2；已有 `1panel-network` 应为可信容器专用的 bridge/NAT 网络，禁用直连容器路由。同网络容器仍可访问端口，`127.0.0.1` 不隔离它们
