---
title: Gitea
date: 2026-07-05
order: 1
---

## Github Repo

[Gitea Github Repo](https://github.com/go-gitea/gitea)

## 官方文档

[Gitea Docs](https://docs.gitea.com/)

## Gitea 是什么

Gitea 是一个轻量的自托管代码平台，可以理解为自建版的 GitHub / GitLab 精简形态。它提供 Git 仓库托管、Issue、Pull Request、Wiki、Release、Package Registry 和 Actions 等功能。

这里的部署目标不是替代 GitHub 全生态，而是把 Gitea 作为自己的代码保险库：

- 直接 mirror GitHub 上的重要仓库。
- 当 GitHub 挂了、账号出问题或访问受限时，服务器上至少保留完整 Git 历史。
- 极少数个人私有库可以直接 push 到 Gitea。
- CI 仍然优先使用 GitHub Actions，并把计算任务交给自己的 GitHub self-hosted runner。
- Pages 不是核心需求；需要时可以继续用 GitHub Pages，或单独用 OpenResty / Nginx 托管静态站。

一句话：Gitea 在这里不是 GitHub 替身，而是 GitHub 代码资产的自主管理副本。

## 为什么选择 Gitea

同类选择主要有 GitLab、Forgejo、Gitea。

这套方案选择 Gitea 的原因：

1. 比 GitLab 轻很多，更适合 VPS 和个人长期维护。
2. 比 Forgejo 更大众，资料、教程、第三方经验更多。
3. 开源核心是 MIT 许可证，同时项目有商业化团队和资金来源，长期维护能力相对清晰。
4. 支持 GitHub repository mirror，适合做代码备份。
5. 支持 Package Registry，偶尔放私有包或容器镜像也够用。
6. Gitea Actions 存在，但不强行把 CI 从 GitHub Actions 迁走。

不选择 GitLab 的原因也很直接：GitLab 是完整 DevOps 平台，CI、Package、Pages 都强，但组件重、升级重、备份恢复复杂。对于个人代码备份，属于杀鸡用牛刀。

## 推荐架构

```text
GitHub
  ├── 主仓库
  ├── GitHub Actions
  └── GitHub self-hosted runner 使用自己的机器跑 CI

Gitea
  ├── mirror GitHub repositories
  ├── 保存少量个人私有库
  ├── SQLite
  ├── Docker Compose
  └── /data 定时备份到另一位置
```

这套架构的分工：

- GitHub：继续做公开协作、主仓、Actions 调度、Pages。
- Gitea：做自主管理的代码副本和私有仓库。
- GitHub self-hosted runner：只负责给 GitHub Actions 提供算力，不属于 Gitea。

注意：Gitea 不能直接调用 GitHub self-hosted runner。GitHub self-hosted runner 注册到 GitHub，只接受 GitHub Actions 调度。如果以后要在 Gitea 里跑 Actions，需要单独部署 Gitea `act_runner`。

## 部署方式选择

Gitea 官方支持 Docker Compose。个人自用建议先使用 SQLite，不额外引入 PostgreSQL / MySQL。

推荐部署结构：

```text
/opt/gitea
├─ .env
├─ docker-compose.yml
├─ data/
└─ backups/
```

其中：

- `data/` 是 Gitea 的核心持久化目录。
- SQLite 数据库、仓库、附件、LFS、配置等都会在这个目录下。
- `backups/` 用来保存 `gitea dump` 和打包后的备份文件。

Docker Compose 模板放在这里：

[Gitea Docker Compose](/knowledge/sharing/docker/compose/gitea)

## 前置准备

### 1. 准备目录

建议放在 `/opt/gitea`：

```bash
sudo mkdir -p /opt/gitea
cd /opt/gitea
```

写入：

```text
.env
docker-compose.yml
```

### 2. 准备域名

建议给 Gitea 单独准备子域名：

```text
git.example.com
```

生产环境不建议直接暴露：

```text
http://服务器IP:3000
```

更合理的访问链路是：

```text
用户 -> HTTPS 反向代理 -> 127.0.0.1:3000 -> Gitea
```

SSH 端口可以单独暴露，例如：

```text
服务器 2222 -> Gitea 容器 22
```

以后 clone 地址类似：

```bash
git clone ssh://git@git.example.com:2222/用户名/仓库名.git
```

## 首次初始化

启动：

```bash
cd /opt/gitea
docker compose up -d
```

查看日志：

```bash
docker compose logs -f gitea
```

浏览器打开：

```text
https://git.example.com
```

首次安装时重点检查：

```text
Database Type: SQLite3
Site Title: 自己喜欢的名字
Server Domain: git.example.com
Gitea Base URL: https://git.example.com/
SSH Server Port: 2222
```

第一次启动后 Gitea 会生成 `/data/gitea/conf/app.ini`。后续修改域名、端口、注册策略等配置时，优先改 `.env` 和 compose 里的 `GITEA__section__KEY` 环境变量，再重启容器；官方 Docker 镜像会在启动时把这些环境变量写入 `app.ini`。

不要随意删除 `app.ini`。它既是安装状态记录，也是 Gitea 的实际运行配置之一。

## OpenResty 反向代理

如果使用 OpenResty，可以新建配置：

```bash
sudo nano /usr/local/openresty/nginx/conf/conf.d/gitea.conf
```

HTTP 到 HTTPS 跳转：

```nginx
server {
    listen 80;
    server_name git.example.com;

    return 301 https://$host$request_uri;
}
```

HTTPS 反向代理：

```nginx
server {
    listen 443 ssl;
    server_name git.example.com;

    ssl_certificate      /usr/local/openresty/nginx/conf/ssl/example.com.crt;
    ssl_certificate_key  /usr/local/openresty/nginx/conf/ssl/example.com.key;

    ssl_protocols TLSv1.2 TLSv1.3;

    client_max_body_size 512m;

    location / {
        proxy_pass http://127.0.0.1:3000;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_connect_timeout 10s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
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

## GitHub Mirror

Gitea 支持 repository mirror，可以把 GitHub 仓库定期拉到 Gitea。

适合本文目标的是 pull mirror：

```text
GitHub -> Gitea
```

创建方式：

1. 右上角 `+`。
2. 选择 `New Migration`。
3. 选择 GitHub 或 Git。
4. 填入 GitHub 仓库地址。
5. 如果是私有仓库，填 GitHub Personal Access Token。
6. 勾选 `This repository will be a mirror`。
7. 创建迁移。

创建后，Gitea 会周期性从 GitHub 同步 branches、tags、commits。

注意：Gitea 官方文档明确提醒，pull mirror 只能在创建仓库时设置；仓库已经创建后，不能再直接转换成 pull mirror。

### GitHub Token 权限

如果只 mirror public repo，可以不用 token。

如果 mirror private repo，需要 GitHub token。最小原则是：只给读取需要 mirror 的仓库所需权限，不要给过大的全局权限。

可以优先使用 Fine-grained personal access token，并限制到指定仓库。

## 私有仓库直接 push 到 Gitea

如果某些个人私有仓库不想放在 GitHub，或者担心 GitHub 容量限制，可以直接把 Gitea 当主 remote。

示例：

```bash
git remote add origin ssh://git@git.example.com:2222/用户名/private-repo.git
git push -u origin main
```

也可以同时保留两个 remote：

```bash
git remote add origin git@github.com:用户名/repo.git
git remote add backup ssh://git@git.example.com:2222/用户名/repo.git
```

平时 push GitHub：

```bash
git push origin main
```

需要手动写入备份 remote：

```bash
git push backup main
```

## GitHub Actions self-hosted runner

如果目标是免费使用自己的机器跑 CI，同时保持 GitHub Actions 兼容，推荐继续使用 GitHub Actions 的 self-hosted runner。

这和 Gitea 是两件事：

```text
GitHub Actions -> GitHub self-hosted runner
Gitea Actions  -> Gitea act_runner
```

本文推荐只部署第一种。

在 GitHub 仓库或组织中添加 self-hosted runner 后，workflow 可以写：

```yaml
runs-on: self-hosted
```

更建议加自定义 label，避免误调度：

```yaml
runs-on: [self-hosted, linux, x64, develata]
```

安全建议：

- 不要让陌生 fork PR 自动跑 self-hosted runner。
- runner 上不要放长期高权限密钥。
- 公开仓库尽量使用 GitHub-hosted runner 或严格限制触发条件。
- 私有仓库和可信分支更适合使用自己的 runner。

## Package Registry

Gitea 从 1.17 起支持 Package Registry，可作为 public 或 private registry 使用。

支持类型包括：

```text
Container / OCI
Generic
Cargo
npm
PyPI
Maven
NuGet
Go
Helm
Debian
RPM
RubyGems
Terraform
Vagrant
```

个人使用中最常见的是：

- Container Registry：保存自己构建的 Docker / OCI 镜像。
- Generic Package：保存 release 二进制、压缩包、构建产物。
- Cargo / npm / PyPI：保存少量私有包。

注意：Gitea 的 package 属于 user 或 organization，不是天然属于某个 repository；可以在 package 设置里 link 到 repository。

## 更新 Gitea

进入部署目录：

```bash
cd /opt/gitea
```

拉取新镜像：

```bash
docker compose pull
```

重建并启动：

```bash
docker compose up -d
```

查看日志：

```bash
docker compose logs -f gitea
```

清理旧镜像：

```bash
docker image prune -f
```

建议不要使用 `latest` 做长期生产部署。可以固定到当前稳定版本，例如：

```env
GITEA_IMAGE=docker.gitea.com/gitea:1.26.4
```

升级前先备份 `data/`。

## 备份策略

Gitea 备份有两个层次：

1. Gitea 官方 `dump`。
2. 对整个 `/opt/gitea/data` 做文件级备份。

官方文档说明，Gitea 当前有 `dump` 命令，但没有内置 restore 命令；恢复是手动过程。为了避免数据库、仓库和附件状态不一致，备份时最好停止 Gitea。

推荐脚本思路：

```bash
cd /opt/gitea
mkdir -p backups

docker compose stop gitea

tar -czf backups/gitea-data-$(date +%F-%H%M%S).tar.gz data

docker compose start gitea
```

如果需要使用 Gitea 自带 dump：

```bash
docker compose exec --user git --workdir /tmp gitea \
    gitea dump -c /data/gitea/conf/app.ini
```

然后把容器里的 dump 文件复制出来，或在脚本中统一移动到 `backups/`。

最小异地备份建议：

```text
每天备份 /opt/gitea/data
保留 7 个 daily
每周同步到另一台 VPS 或本地电脑
```

如果仓库很重要，Gitea 服务器本身不应是唯一副本。

## 常见问题

### 1. 容器启动失败，提示权限问题

Gitea Docker 文档要求挂载目录归 `USER_UID` / `USER_GID` 对应用户所有。

本文默认：

```env
USER_UID=1000
USER_GID=1000
```

如果宿主机部署用户不是 1000，需要修改 `.env`，或者调整目录权限。

### 2. 网页能打开，但 SSH clone 失败

检查三件事：

```bash
ssh -T -p 2222 git@git.example.com
```

```bash
docker compose ps
```

```bash
docker compose logs -f gitea
```

确认：

- compose 里 `GITEA_SSH_HOST_PORT=2222`。
- 云服务器安全组放行 2222。
- Gitea 管理后台 / app.ini 里的 SSH 端口和实际端口一致。
- 用户 SSH public key 已经添加到 Gitea。

### 3. Mirror 私有 GitHub 仓库失败

常见原因：

- GitHub token 权限不足。
- token 没有授权到目标 private repo。
- 仓库 URL 写错。
- 目标仓库需要 SSO 授权。
- GitHub 访问被网络阻断。

先在服务器上测试：

```bash
git ls-remote https://github.com/用户名/仓库名.git
```

私有仓库则需要带 token 的认证方式，注意不要把 token 写进 shell history 或公开文档。

### 4. 直接把 3000 暴露到公网可以吗

不建议。

更推荐：

```text
HOST_IP=127.0.0.1
GITEA_HTTP_HOST_PORT=3000
OpenResty / Nginx / 1Panel 反向代理 HTTPS
```

这样公网只看到 80/443，Gitea 后端端口只在本机访问。

### 5. 要不要启用 Gitea Actions

当前方案不需要。

原因：你真正需要的是 GitHub Actions 兼容，而最兼容的方式就是继续用 GitHub Actions，并把 runner 放到自己的机器上。

只有当你想让 Gitea 本身调度 CI 时，才需要部署 Gitea `act_runner`。

## 推荐配置

个人自用代码保险库建议：

```env
HOST_IP=127.0.0.1
GITEA_HTTP_HOST_PORT=3000
GITEA_SSH_HOST_PORT=2222
GITEA_DOMAIN=git.example.com
GITEA_ROOT_URL=https://git.example.com/
GITEA_DISABLE_REGISTRATION=true
GITEA_REQUIRE_SIGNIN_VIEW=true
```

含义：

- HTTP 只监听本机，通过反代访问。
- SSH 单独暴露 2222。
- 关闭公开注册。
- 未登录用户不能浏览私有内容。
- SQLite 作为默认数据库，减少组件。

## 参考链接

- [go-gitea/gitea](https://github.com/go-gitea/gitea)
- [Gitea 官方文档](https://docs.gitea.com/)
- [Gitea Docker 安装文档](https://docs.gitea.com/installation/install-with-docker)
- [Gitea Repository Mirror](https://docs.gitea.com/usage/repo-mirror)
- [Gitea Backup and Restore](https://docs.gitea.com/administration/backup-and-restore)
- [Gitea Package Registry](https://docs.gitea.com/usage/packages/overview)
- [GitHub self-hosted runners](https://docs.github.com/actions/hosting-your-own-runners)
