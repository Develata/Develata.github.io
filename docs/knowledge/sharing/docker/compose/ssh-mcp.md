---
title: ssh-mcp
---

## Github Repo

[SSH MCP Github Repo](https://github.com/tufantunc/ssh-mcp)

compose更新日期: 2026-10-06

本页是单用户、单台测试机的只读试用配置。使用 HTTP transport，保留 `1panel-network`，端口映射配置为 `127.0.0.1`，每次执行都要求客户端确认。实际网络可达范围还取决于下面的 Docker 版本和网络前提。

上游版本固定为 [v2.18.0](https://github.com/tufantunc/ssh-mcp/releases/tag/v2.18.0)，源码提交 `723a7c5a4846dfba822894d566212b1a58656b5e`。通过上游 Dockerfile 本地构建，不依赖未经核实的第三方镜像。首次构建需要访问 GitHub、Docker Hub 和 npm。

**先使用没有生产数据的测试机和专用低权限 SSH 账号。不要使用 root、sudo 账号，也不要给该账号 Docker 组或 Docker socket 权限。`readOnly` 是应用层策略，不能代替目标机上的文件权限和网络限制。**

## 网络前提

- 使用 **Docker Engine 28.0.0 或更新版本**及 Docker Compose V2。[Docker 官方说明](https://docs.docker.com/engine/network/port-publishing/#publishing-ports)指出，更早版本中，同一二层网络的其他主机仍可能访问发布到 localhost 的端口，不能把 `127.0.0.1` 当作充分隔离
- 检查现有 `1panel-network` 使用普通 `bridge` 驱动和默认 `nat` 网关模式；IPv4 / IPv6 都不要使用 `routed` 或 `nat-unprotected`。还应确认没有开启会暴露此网络的 `allow-direct-routing`、`trusted_host_interfaces` 或其他直达容器 IP 的路由 / 转发规则，并保持 Docker 防火墙规则有效。详见[直连路由与网关模式](https://docs.docker.com/engine/network/port-publishing/#direct-routing)
- 如果现有共享网络不满足这些条件，先停止部署并单独规划隔离网络，不要直接修改其他容器正在使用的网络。本页仍强制 Bearer 验证，但认证不能代替网络隔离

## docker-compose

保存为 `compose.yaml`：

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

- 容器内使用 `0.0.0.0`，才能接收 Docker 转发和同网络反代请求；宿主机端口映射配置为 `127.0.0.1`，隔离效果以满足上面的版本和网络前提为条件
- `1panel-network` 必须已经存在。只加入可信容器；同网络容器可以直接访问 `ssh-mcp:3000`，不受宿主机 loopback 绑定限制，但 MCP 请求仍须通过 Bearer 验证
- 不要挂载整个 `~/.ssh`、SSH agent socket、宿主机根目录或 Docker socket。这里只挂载一把专用私钥
- 健康检查覆盖上游 Dockerfile 中只返回成功的检查，验证 HTTP 服务和 profile 配置已加载；不会验证 SSH 登录、审批能力或远端权限

## env

保存为与 `compose.yaml` 同目录的 `.env`：

```env
TIME_ZONE=Asia/Shanghai
SSH_MCP_HOST_PORT=3000

# 必填：在自己的服务器生成并填写至少 32 字节的随机 token
# 例如 openssl rand -hex 32；不要把生成结果发到聊天或提交到仓库
SSH_MCP_BEARER_TOKEN=

# HTTP Host 请求头白名单，不是可连接的 SSH 目标白名单
# 若改宿主机端口，也要同步修改这里的 127.0.0.1 / localhost 端口
SSH_MCP_ALLOWED_HOSTS=127.0.0.1:3000,localhost:3000,ssh-mcp:3000

# 仅当专用 SSH 私钥有口令时，在本机填写
SSH_MCP_TRIAL_PASSPHRASE=

SSH_MCP_CPUS=1.0
SSH_MCP_MEMORY=512M
```

私钥口令若含 `$`、`#` 或空格，在 `.env` 中用单引号包住整个值，避免插值或注释截断。例如 `SSH_MCP_TRIAL_PASSPHRASE='replace-this-example $literal # with spaces'` 只是格式示例，不要照用作实际口令；含引号等情况按 [Docker 的 env 文件语法](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/#env-file-syntax)处理。

**Bearer 不是 OAuth。此版本通过 `--bearerToken` 接收 token；放进 `.env` 后仍会展开到容器命令参数，可能被有 Docker 管理权限或宿主机进程读取权限的人看到。私钥口令环境变量也不是秘密保险箱。不要公开 `.env`、`docker inspect` 或展开后的 `docker compose config` 输出。**

## config.toml

上游的角色、只读策略和审批策略在 TOML 中配置，不能只靠 `.env` 完成。创建 `config/config.toml`，将下列地址、用户名、工作目录和指纹替换为自己测试机的实际值：

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

- `192.0.2.10` 是文档示例地址，不能直接使用；指纹占位符也会导致连接被拒绝
- `group = "prod"` 在这里是最严格的权限分组，不表示应连接生产服务器
- 在目标机的可信控制台读取主机公钥指纹，例如 `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub -E sha256`。将实际协商使用的主机密钥对应的 `SHA256:...` 填入配置，并通过独立可信渠道核对。不要把未经核对的 `ssh-keyscan` 输出直接当作信任依据
- `--hostKeyMode=strict` 配合 `trustedHostKey` 固定主机身份，重建容器后仍有效。不要为解决连接错误而改成 insecure
- `viewer`、`readOnly = true` 和 `ask-all` 同时生效。审批通过也不会让被只读策略拒绝的写入命令变得可执行；保持只有这一个 profile，因为 HTTP Bearer 持有者可以使用此进程配置的所有 profile
- 不配置 `transferRoot`，保持需要本地文件目录授权的流式 SFTP 工具关闭。只读访问仍可能读取敏感内容，目标账号可读范围必须单独收紧

## 文件和权限

在 1Panel 编排实际使用的目录准备以下文件；相对路径都以该目录为准：

```text
ssh-mcp/
├── compose.yaml
├── .env
├── .gitignore
├── config/
│   └── config.toml
├── secrets/
│   └── id_ed25519
└── data/
```

`.gitignore` 至少包含：

```gitignore
.env
config/
secrets/
data/
```

在本机完成 `.env`、TOML 和专用私钥文件后，按下面方式设置权限。这里只调整当前试用目录中的文件，不要对自己的整个 SSH 目录递归执行：

```bash
# 在 compose.yaml 所在目录执行
mkdir -p config secrets data
chmod 600 .env config/config.toml secrets/id_ed25519
chmod 700 config secrets data
sudo chown 65532:65532 config config/config.toml secrets/id_ed25519 data

# 检查服务端 Engine 版本至少为 28.0.0
docker version

# 核对已有网络的驱动、网关模式和选项；还需检查上文的 daemon / 路由前提
# 不存在或不符合要求时先停止，不要在此直接重建共享网络
docker network inspect 1panel-network

# 只校验配置，不输出已展开的 token
docker compose --env-file .env config --quiet

# 确认目标账号、指纹和权限后再自行构建并启动
docker compose --env-file .env up -d --build
docker compose ps
curl --fail http://127.0.0.1:3000/health
```

如果改了 `SSH_MCP_HOST_PORT`，最后一行也要使用新端口。上面的 UID/GID 针对普通 Linux Docker；rootless Docker 或启用 user namespace 的环境需要按自己的 UID 映射调整，不要通过 `chmod 777` 绕过权限错误。

审计文件保存在 `data/audit.log`，Docker 容器日志另按上面的大小限制轮转。上游审计日志也有内置轮转，需为其预留磁盘并定期检查；日志可能含主机和命令信息，不应上传公开仓库。哈希链有助于发现篡改，不等于不可删除或完整的外部审计系统。

## 连接与验收

基础配置的 MCP 地址为 `http://127.0.0.1:3000/`，使用 Streamable HTTP，认证头为 `Authorization: Bearer <自己的 token>`。端点是根路径 `/`，不是 `/mcp` 或旧版 SSE 的 `/sse`。

1. `/health` 应返回 `healthy: true` 和 `configured: true`。这两个值不代表 SSH 已连通
2. 对 MCP 根路径发出不带 token 的请求应收到 `401`；`/health` 是上游公开的无认证存活探针
3. 使用支持 MCP elicitation 的客户端完成初始化，只在测试机试 `whoami`、`pwd` 等只读命令，检查每次都出现审批；拒绝一次审批，确认命令未执行
4. `ask-all` 依赖客户端的 elicitation 能力。若不支持或审批通信失败，命令应被拒绝；不要用 `auto` 绕过这一验收
5. 核对返回账号、主机指纹和审计记录，再考虑扩大试用范围
6. 从同一局域网的另一台机器确认不能通过宿主机非 loopback 地址或可路由的容器 IP 访问后端；若仍可达，先停用并检查 Docker 版本、网络模式、路由和防火墙

## 1Panel 反代与 ChatGPT

该 compose 的设计范围是本机和受信 Docker 网络中的 HTTP 后端，须先满足上面的版本和网络前提并验证实际可达范围。**没有配置公网入口、Cloudflare Access 或 OAuth，也没有验证 ChatGPT 的登录及逐条审批流程**。

- 1Panel 同网络反代可使用 `http://ssh-mcp:3000`。必须保留认证头，并将反代实际发送的精确 Host 值加入 `SSH_MCP_ALLOWED_HOSTS`；不要使用通配符。需要支持 MCP 的 POST、GET、DELETE、会话头及 SSE 流式响应，关闭响应缓冲并配置合适的超时
- 不要仅开一个公网 HTTPS 反代就视为安全接入。若以后接 Cloudflare Tunnel / Access，需要另外验证 Access token/JWT、OAuth 发现与回调、来源隔离，确保无法绕过认证入口直连后端。共享 `1panel-network` 不能充当这层隔离
- 不要假设 ChatGPT 能在现有连接流程里填写这个静态 Bearer，或其工具确认等同于上游 elicitation。先确认目标客户端支持的认证方式和审批能力，再设计独立的接入配置
- 当前模板保持 `--trustProxy` 关闭，反代后的请求会共享代理地址的限流额度。确有需要时，只信任已核实的代理 IP，不能仅为消除限流而信任任意 `X-Forwarded-For`

这里只完成配置清单和静态核对；尚未在实际 1Panel 环境构建镜像、启动容器、连接 SSH 或完成客户端端到端测试。

## 参考

- [上游 Dockerfile（固定提交）](https://github.com/tufantunc/ssh-mcp/blob/723a7c5a4846dfba822894d566212b1a58656b5e/Dockerfile)
- [上游配置字段](https://github.com/tufantunc/ssh-mcp/blob/723a7c5a4846dfba822894d566212b1a58656b5e/src/config/schema.ts)
- [上游 HTTP transport](https://github.com/tufantunc/ssh-mcp/blob/723a7c5a4846dfba822894d566212b1a58656b5e/src/transport/http.ts)
- [上游安全说明](https://github.com/tufantunc/ssh-mcp/blob/723a7c5a4846dfba822894d566212b1a58656b5e/SECURITY.md)
- [Docker Git 构建上下文](https://docs.docker.com/build/concepts/context/#url-fragments)
