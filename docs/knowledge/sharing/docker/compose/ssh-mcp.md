---
title: ssh-mcp
---

[上游仓库](https://github.com/tufantunc/ssh-mcp) · 更新：2026-11-26

## Compose

从上游 Git 源码构建，不依赖预构建镜像。保存为 `compose.yaml`：

```yaml
networks:
    1panel-network:
        external: true

services:
    ssh-mcp:
        container_name: ssh-mcp
        pull_policy: build
        build:
            context: "https://github.com/tufantunc/ssh-mcp.git#${SSH_MCP_REF:?Set an upstream tag or commit}"
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
            - "127.0.0.1:${SSH_MCP_HOST_PORT:-18080}:3000"
        volumes:
            - ./config:/home/appuser/.config/ssh-mcp:ro
            - ./secrets/id_ed25519:/run/secrets/ssh-mcp-id_ed25519:ro
            - ./data:/var/lib/ssh-mcp
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

## `.env`

```dotenv
SSH_MCP_REF=v2.28.0
SSH_MCP_BEARER_TOKEN=
SSH_MCP_ALLOWED_HOSTS=127.0.0.1:18080,127.0.0.1:3000
```

用 `openssl rand -hex 32` 生成 token，填入 `.env`。`SSH_MCP_REF` 填实际发布 tag 或完整提交 SHA；`latest` 不会自动解析为 GitHub 的最新 Release。换宿主机端口时同步更新 Host 白名单；使用反向代理时，把其实际转发的 `Host` 加入白名单。保留 `127.0.0.1:3000` 供容器健康检查使用。

## SSH 配置

保存为 `config/config.toml`。示例只允许只读排查；使用专用低权限 SSH 账号，并从可信渠道核对主机指纹。

```toml
[defaults]
defaultProfile = "trial"
approvalMode = "ask-all"
approvalGrantTtlMs = 0

[[profiles]]
name = "trial"
host = "server.example.com"
port = 22
user = "mcp-observer"
auth = "key"
keyRef = "/run/secrets/ssh-mcp-id_ed25519"
workdir = "/home/mcp-observer"
trustedHostKey = "SHA256:REPLACE_WITH_VERIFIED_FINGERPRINT"
role = "viewer"
readOnly = true
approvalPolicy = "ask-all"
tty = false
```

## 部署与更新

在部署目录下创建 `config/`、`secrets/`、`data/`，把专用私钥放到 `secrets/id_ed25519`，在目标账号配置对应公钥。确认私钥路径是文件，再执行以下命令（普通 Linux Docker，以 root 运行）：

```bash
test -f config/config.toml && test -f secrets/id_ed25519 && \
  chmod 600 .env config/config.toml secrets/id_ed25519 && \
  chmod 700 config secrets data && \
  chown 65532:65532 config config/config.toml secrets/id_ed25519 data && \
  docker compose config -q
```

使用 1Panel 时，从「容器 → 编排 → 创建编排 → 路径选择」选中保存的 `compose.yaml`，确认加载同目录的 `.env`，并且已有 `1panel-network`。不使用 1Panel 时，可将该外部网络改成自己的可信网络，再在同目录执行：

```bash
docker compose up -d --build ssh-mcp
docker compose ps ssh-mcp
```

更新时先把 `.env` 改为已审核的 tag 或 SHA，再运行同一条 `up` 命令。不要用 `docker compose pull` 来更新这份源码构建配置。若报 `repository does not contain ref latest`，改用实际版本；若 1Panel 报卷字段类型不符，确认 `volumes` 没有改成长语法。

## 验收

MCP 地址为 `http://127.0.0.1:18080/`，选择 Streamable HTTP，并发送 `Authorization: Bearer <token>`。同网络反代可使用 `http://ssh-mcp:3000`，保留认证头。宿主机的回环地址只限制发布端口，不隔离同网容器；外部网络只加入可信容器。

先确认容器 `healthy`，再用支持审批提示的 MCP 客户端调用 `list-connections`，并在 `trial` 上执行只读的 `pwd`。健康检查通过不代表 SSH 认证成功。不要提交 `.env`、私钥或真实 SSH 配置，也不要公开完整的 `docker inspect` 输出。
