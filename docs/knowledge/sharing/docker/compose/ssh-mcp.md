---
title: ssh-mcp
---

## Github Repo

[SSH MCP Github Repo](https://github.com/tufantunc/ssh-mcp)

compose更新日期: 2026-10-06

## docker-compose

保存为 `compose.yaml`（固定上游 v2.18.0 源码构建）：

```yaml
networks:
    1panel-network:
        external: true

services:
    ssh-mcp:
        container_name: ssh-mcp
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

在同一目录准备配置和专用私钥：

```bash
mkdir -p config secrets data
# 保存上述配置，并放入专用私钥 secrets/id_ed25519 后执行
printf '%s\n' '.env' 'config/' 'secrets/' 'data/' > .gitignore
chmod 600 .env config/config.toml secrets/id_ed25519
chmod 700 config secrets data
sudo chown 65532:65532 config config/config.toml secrets/id_ed25519 data

docker compose config --quiet
docker compose up -d --build
```

UID/GID `65532:65532` 适用于普通 Linux Docker；rootless / userns 环境按实际映射调整。

MCP：`http://127.0.0.1:3000/`，Streamable HTTP，请求头 `Authorization: Bearer <token>`。1Panel 同网络反代地址：`http://ssh-mcp:3000`，保留认证头并同步 Host 白名单。

- 仅供测试机的低权限账号只读试用，保留严格指纹校验；`ask-all` 需要客户端支持 elicitation。未配置公网入口或 OAuth。不要公开 `.env`、私钥及 `docker inspect` 输出
- 使用 Docker Engine ≥28 和 Compose V2；已有 `1panel-network` 应为可信容器专用的 bridge/NAT 网络，禁用直连容器路由。同网络容器仍可访问端口，`127.0.0.1` 不隔离它们
