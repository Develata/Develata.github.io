---
title: docker个人镜像站
date: 2026-1-02
order: 2
---
我的建议：Github Actions（可以到我的仓库develata/docker-syncer 直接复制模板库）+阿里云ACR。

## Github Actions+阿里云ACR
我们将利用 **GitHub Actions（由于在海外，能秒下 DockerHub 镜像）** 作为搬运工，自动把镜像推送到你的 **阿里云 ACR（国内杭州/北京节点）**，然后你的服务器就可以在国内**跑满带宽**拉取了。

整个过程**完全免费**。

---

### 第一阶段：配置阿里云 ACR（准备仓库）
**目标**：在阿里云建立一个“收货地址”。

1. **开通服务**
    - 登录 [阿里云控制台](https://homenew.console.aliyun.com/)。
    - 搜索 **“容器镜像服务”** (ACR) 并进入。
    - 如果提示开通，点击开通（免费）。
2. **创建个人实例（关键！）**
    - 点击左侧 **“实例列表”**。
    - **选择地域**：一定要选离你服务器近的**国内地域**！比如 **“华东1（杭州）”** 或 **“华北2（北京）”**。不要选东京/香港，否则国内拉取会慢。Github可以直连dockerhub，虽然 GitHub 连国内阿里云有时候稍慢，但这是发生在 GitHub 的服务器上的，**你不需要等待，也不占你的带宽**。只要脚本跑完了，镜像就躺在杭州了。国内下载**走阿里云国内 BGP 线路，跑满带宽**，且极其稳定。
    - 点击页面顶部的 **“个人实例”** 标签（不要看企业版）。
    - 点击 **“创建个人实例”** -> 确认协议 -> 确定。
3. **设置访问密码**
    - 进入刚创建的实例。
    - 左侧菜单点击 **“访问凭证”**。
    - 点击右上角 **“设置固定密码”**。
    - **注意**：这个密码是专门给 `docker login` 用的，**不要**和你的阿里云登录密码一样，设置一个你记得住的。
4. **创建命名空间**
    - 左侧菜单点击 **“命名空间”** -> **“创建命名空间”**。
    - 名称：起个你喜欢的名字，比如 `my-docker-hub`（全网唯一，如果被占用了就换一个）。
    - 设置为 **“私有”**（如果你不想别人下载）或 **“公开”**（方便自己随便拉）。**建议先设为“私有”**。

---

### 第二阶段：配置 GitHub（准备搬运工）
**目标**：雇佣 GitHub 的免费服务器帮我们干活。

1. **创建仓库**
    - 登录 GitHub，点击右上角 `+` -> `New repository`。
    - Repository name: 随便填，比如 `docker-syncer`。
    - Visibility: **Private** (建议私有)。
    - 点击 `Create repository`。
2. **配置阿里云账号密码（Secrets）**
    - 在你的 GitHub 仓库页面，点击上方的 **Settings**。
    - 左侧边栏找到 **Secrets and variables** -> **Actions**。
    - 点击 **New repository secret**，我们需要添加 3 个变量（把阿里云的信息填进去）：

| **Name** | **Secret (Value) 填什么？** |
| --- | --- |
| `ALIYUN_USERNAME` | 你的阿里云全名（在 ACR“访问凭证”页可以看到，通常是 `用户名@账号ID`<br/> 这种格式） |
| `ALIYUN_PASSWORD` | 刚才在 ACR 里设置的那个“固定密码” |
| `ALIYUN_NAMESPACE` | 刚才创建的命名空间名字（例如 `my-docker-hub`<br/>） |
| `ALIYUN_REGISTRY` | 你的 ACR 公网地址（在 ACR“概览”页可以看到，例如 `registry.cn-hangzhou.aliyuncs.com`<br/>） |

_(注：填完这 4 个 Secret，GitHub 就有权限操作你的阿里云仓库了)_

---

### 第三阶段：编写搬运脚本
**目标**：告诉 GitHub 怎么干活。（可以直接复制我的模板库develata/docker-syncer ）

1. 在 GitHub 仓库页面，点击 **Actions** 标签。
2. 点击 **set up a workflow yourself** (或者 New workflow)。
3. 将文件名改为 `sync-image.yml`。
4. **复制粘贴以下代码**（我为你写了一个“万能输入框”版本的脚本）：

```plain
name: 搬运镜像到阿里云

on:
  workflow_dispatch:
    inputs:
      image_name:
        description: '原镜像名称 (例如: mysql:8.0 或 nginx:latest)'
        required: true
        default: 'nginx:latest'
      new_name:
        description: '保存到阿里云的名称 (留空则与原名一致)'
        required: false
        default: ''

jobs:
  push-to-aliyun:
    runs-on: ubuntu-latest
    steps:
      - name: 登录阿里云 ACR
        uses: docker/login-action@v2
        with:
          registry: ${{ secrets.ALIYUN_REGISTRY }}
          username: ${{ secrets.ALIYUN_USERNAME }}
          password: ${{ secrets.ALIYUN_PASSWORD }}

      - name: 拉取、重命名并推送
        run: |
          # 1. 解析输入
          SRC_IMAGE="${{ inputs.image_name }}"
          
          # 如果用户没填新名字，就提取原镜像的最后一段，比如 mysql:8.0
          if [ -z "${{ inputs.new_name }}" ]; then
            TARGET_IMAGE_TAG=$(echo "$SRC_IMAGE" | awk -F'/' '{print $NF}')
          else
            TARGET_IMAGE_TAG="${{ inputs.new_name }}"
          fi
          
          # 组合阿里云的目标地址
          ALIYUN_TARGET="${{ secrets.ALIYUN_REGISTRY }}/${{ secrets.ALIYUN_NAMESPACE }}/$TARGET_IMAGE_TAG"
          
          echo "正在从 $SRC_IMAGE 拉取..."
          docker pull $SRC_IMAGE
          
          echo "正在推送到 $ALIYUN_TARGET ..."
          docker tag $SRC_IMAGE $ALIYUN_TARGET
          docker push $ALIYUN_TARGET
          
          echo "✅ 成功！国内拉取地址: $ALIYUN_TARGET"
```

1. 点击右上角 **Commit changes** 保存。

---

### 第四阶段：实际使用（见证奇迹）
现在，你想要拉取任何被墙的镜像，只需要 3 步：

1. **在 GitHub 点一下**
    - 进入 GitHub 仓库 -> **Actions** 标签。
    - 左侧点击 **“搬运镜像到阿里云”**。
    - 右侧点击 **Run workflow**。
    - 在弹出框里输入你想拉的镜像，比如 `mysql:8.0`，然后点击绿色按钮 **Run workflow**。
2. **等待 1 分钟**
    - 你会看到一个圆圈在转，变绿勾✅表示成功。
    - 点进去看日志，它会告诉你最终的国内地址。
3. **在你的国内服务器/电脑上拉取**
    - **首次使用需要登录**（仅需一次）可以同时登录多个镜像站：

```plain
# 这里的地址、用户名填你自己的
sudo docker login --username=你的用户名 你的ACR公网地址例如registry.cn-hangzhou.aliyuncs.com
# 输入密码（那个固定密码）
```

    - **高速拉取**：

```plain
# 比如你的命名空间叫 my-docker-hub
sudo docker pull registry.cn-hangzhou.aliyuncs.com/my-docker-hub/mysql:8.0
```

---

### 这个方案的优势
1. **极速**：最后一步拉取走的是阿里云国内 BGP 线路，速度取决于你的带宽上限。
2. **私密**：你的仓库是私有的，别人拉不了。
3. **灵活**：你想拉 `gcr.io` (谷歌)、`quay.io` (红帽) 的镜像都可以，只需在 GitHub 输入框里填完整地址（例如 `gcr.io/google-samples/hello-app:1.0`）。
4. **干净**：你的服务器不需要安装任何乱七八糟的代理工具，只需要标准 Docker。

## 海外服务器中转
### 方案核心逻辑
+ **架构**：`国内服务器` -> `HTTPS 请求` -> `你的海外 VPS (Nginx + Registry 缓存)` -> `Docker Hub`

### 实施步骤 (基于 Docker Compose)
假设你的域名是 `docker.baidu.com`，并且解析到了你的海外 VPS IP。

#### 第一步：在海外 VPS 上部署 Registry (作为缓存)
我们需要部署官方的 `registry:2` 镜像，并开启 `proxy` 模式。

1. **创建目录**：

```plain
mkdir -p /opt/docker-mirror/data
mkdir -p /opt/docker-mirror/config
cd /opt/docker-mirror
```

2. 创建配置文件 config.yml：

官方 Registry 镜像需要一个配置文件来启用代理模式。

```plain
nano config/config.yml
```

写入以下内容：

```plain
version: 0.1
log:
  fields:
    service: registry
storage:
  cache:
    blobdescriptor: inmemory
  filesystem:
    rootdirectory: /var/lib/registry
http:
  addr: :5000
  headers:
    X-Content-Type-Options: [nosniff]
proxy:
  remoteurl: https://registry-1.docker.io # 关键：指向官方 Docker Hub
  username: "" # 如果你有 Docker Hub 账号，可填，否则留空
  password: ""
health:
  storagedriver:
    enabled: true
    interval: 10s
    threshold: 3
```

3. **创建 **`**docker-compose.yml**`：

```plain
nano docker-compose.yml
```

写入以下内容：

```plain
version: '3'
services:
  registry-mirror:
    image: registry:2
    container_name: docker-mirror
    restart: always
    ports:
      - "127.0.0.1:5000:5000" # 只监听本地，通过 Nginx 暴露更安全
    volumes:
      - ./config/config.yml:/etc/docker/registry/config.yml
      - ./data:/var/lib/registry # 缓存数据存这里
```

4. **启动容器**：

```plain
docker compose up -d
```

#### 第二步：配置 Nginx 反向代理 + HTTPS + 鉴权
直接暴露 5000 端口很危险，容易被白嫖流量。我们使用 Nginx 来加一层 SSL 和密码保护。

1. **安装 Nginx 和工具** (以 Ubuntu/Debian 为例)：

```plain
apt update && apt install nginx apache2-utils -y
```

2. 生成密码文件：

设置一个用户名（如 myuser）和密码。

```plain
htpasswd -Bc /etc/nginx/docker.htpasswd myuser
# 输入两次密码
```

3. **配置 Nginx 站点**：

```plain
nano /etc/nginx/sites-available/docker-mirror
```

写入配置（请替换你的域名）：

```plain
server {
    listen 80;
    server_name docker.baidu.com;
    # 强制跳转 HTTPS (建议配合 Certbot 使用)
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name docker.baidu.com;

    # SSL 证书配置 (推荐用 certbot 自动生成，这里仅为占位)
    ssl_certificate /etc/letsencrypt/live/docker.baidu.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/docker.baidu.com/privkey.pem;

    # 优化上传大小
    client_max_body_size 2G;

    location / {
        # 开启 Basic Auth 鉴权
        auth_basic "Registry Realm";
        auth_basic_user_file /etc/nginx/docker.htpasswd;

        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

_注：SSL 证书建议使用 _`_certbot --nginx_`_ 一键生成。_

4. **重启 Nginx**：

```plain
ln -s /etc/nginx/sites-available/docker-mirror /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### 第三步：在国内服务器上使用
现在你的海外 VPS 已经是一个带密码保护的私有镜像站了。

方式 A：作为镜像加速器（配置 daemon.json）

注意：Docker 的 registry-mirrors 配置项不支持带用户名密码的地址。

如果你在 Nginx 开启了 auth_basic，直接配置 registry-mirrors 会拉取失败。

**解决方法：**

1. 方案 1（推荐 - IP 白名单）：

在 VPS 的 Nginx 配置里，去掉 auth_basic，改为只允许你国内服务器的 IP 访问：

```plain
location / {
    allow 1.2.3.4; # 你国内服务器的公网 IP
    deny all;
    proxy_pass http://127.0.0.1:5000;
    ...
}
```

这样配置后，在国内服务器修改 `/etc/docker/daemon.json`：

```plain
{
  "registry-mirrors": ["https://docker.baidu.com"]
}
```

然后重启 Docker，以后 `docker pull nginx` 就会自动走你的 VPS。

2. 方案 2（手动 Login 模式）：

如果你无法固定国内 IP（比如家用宽带），保留 auth_basic。

使用时不能配置为 mirror，而是手动拉取：

```plain
# 登录私有仓库
docker login docker.baidu.com
# 输入 myuser 和密码

# 拉取镜像 (注意要加域名)
docker pull docker.baidu.com/library/nginx:latest
```

### 极客进阶建议
如果你的 VPS 硬盘比较小，不想存缓存数据，但又想做中转。你可以把第一步中的 `registry:2` 容器换成一个简单的 **SNI Proxy** 或者 **Nginx Stream Proxy**，直接在 TCP 层转发流量到 `registry-1.docker.io`。

但考虑到你追求“效率”，**带缓存的 Registry 方案（即上述方案）是最佳选择**。它能避免重复消耗你 VPS 的公网带宽。

## GitHub Packages
 这是 GitHub 官方提供的容器镜像托管服务。相当于你在 GitHub 上开了一个私有的 Docker Hub  

**原理**：

+ `GitHub Actions` 构建/拉取镜像 -> 推送到 `ghcr.io` (GitHub Container Registry)。
+ `你的服务器` -> 从 `ghcr.io` 拉取镜像。

### 核心概念
+ **地址域名**：`ghcr.io`
+ **镜像格式**：`ghcr.io/你的用户名/镜像名:标签`

### 第一阶段：准备工作（获取访问令牌）
由于 GitHub 不允许在命令行使用账号密码登录，你需要生成一个 **PAT (Personal Access Token)**。

1. **进入设置**：
    - 点击 GitHub 右上角头像 -> **Settings**。
    - 左侧边栏最底部 -> **Developer settings**。
    - 左侧 -> **Personal access tokens** -> **Tokens (classic)**。
    - 点击 **Generate new token (classic)**。
2. **配置权限（关键步骤）**：
    - **Note**: 随便填，例如 `docker-login-token`。
    - **Expiration**: 建议选 `No expiration`（永久）或者按需设置。
    - **Select scopes** (必须勾选以下几项):
        * ✅ `write:packages` (允许上传镜像)
        * ✅ `read:packages` (允许下载镜像)
        * ✅ `delete:packages` (允许删除镜像)
        * _(勾选 _`_write:packages_`_ 时，_`_repo_`_ 权限通常会自动勾选，保持即可)_。
    - 点击底部的 **Generate token**。
3. **保存 Token**：
    - **立刻复制**那个 `ghp_` 开头的长字符串。**这是你唯一的查看机会，关掉页面就看不到了！**

### 第二阶段：在本地电脑手动推送镜像
假设你在本地上推送镜像。

#### 1. 登录 (Login)
打开终端（Terminal / PowerShell），输入以下命令：

```plain
# 格式：echo "你的PAT" | docker login ghcr.io -u 你的用户名 --password-stdin

# 示例：
echo "ghp_AbC123..." | docker login ghcr.io -u develata --password-stdin
```

_提示 _`_Login Succeeded_`_ 即为成功。_

#### 2. 准备镜像 (Tag)
假设你想把本地的 `nginx:latest` 上传到 GitHub。GitHub 强制要求镜像名必须包含 `ghcr.io/用户名`。

```plain
# 1. 拉取一个原版镜像
docker pull nginx:latest

# 2. 打标签 (Tag)
# 注意：GitHub 用户名必须全部小写!
docker tag nginx:latest ghcr.io/你的用户名/my-nginx:v1
```

#### 3. 推送镜像 (Push)
```plain
docker push ghcr.io/你的用户名/my-nginx:v1
```

_进度条跑完后，你的镜像就已经存放在 GitHub 的服务器上了。_

#### 4. 在 GitHub 查看
+ 进入你的 GitHub 个人主页。
+ 点击顶部的 **Packages** 标签页。
+ 你应该能看到 `my-nginx` 这个包。

### 第三阶段：GitHub Actions 自动构建与推送
这是 GitHub Packages 最强大的地方：**无需手动登录，无需配置密码**，Actions 脚本里自带权限。

**场景**：你有一个 GitHub 仓库，里面有 `Dockerfile`，你希望每次提交代码，GitHub 自动帮你构建镜像并发布到 GHCR。

在你的仓库中创建 `.github/workflows/build-push.yml`：

```plain
name: 构建并推送到 GHCR

on:
  push:
    branches: [ "main" ] # 当 main 分支有代码提交时触发

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }} # 自动获取 "用户名/仓库名"

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write # 关键：赋予 Actions 写入 Packages 的权限

    steps:
      - name: 拉取代码
        uses: actions/checkout@v3

      - name: 登录到 GitHub Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }} 
          # 注意：GITHUB_TOKEN 是系统内置的，你不需要手动去 Secrets 里设置，直接用就行！

      - name: 提取元数据 (tags, labels)
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}

      - name: 构建并推送
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

**效果**：你只管写代码，Git Push 之后，镜像就自动出现在你的 Packages 列表里了。

### 第四阶段：镜像权限管理（私有 vs 公开）
默认情况下，你推送的镜像是 **私有（Private）**的。

#### 1. 私有镜像 (Private)
+ **下载方式**：必须先 `docker login`，且拥有权限。
+ **适用场景**：企业内部代码、个人私密服务。

#### 2. 公开镜像 (Public)
如果你想做开源，或者方便服务器**免登录拉取**：

1. 进入 GitHub 个人主页 -> **Packages**。
2. 点击你刚才上传的镜像进入详情页。
3. 点击右侧边栏底部的 **Package settings**。
4. 找到 **"Change visibility"** 区域。
5. 将 Visibility 改为 **Public**。

改为 Public 后：

任何人在任何服务器上，都可以直接拉取：

```plain
docker pull ghcr.io/你的用户名/my-nginx:v1
# 不需要 login，不需要密码
```

### 第五阶段：从 DockerHub 搬运到 GHCR
利用 **GitHub Actions** 作为云端搬运工。

#### 原理：
 GitHub Action 服务器 (美国) -> `docker pull` (从 DockerHub) -> `docker tag` (改名) -> `docker push` (到 GHCR)。  

#### 1. 创建 Action 脚本
在你的一个 GitHub 仓库中，创建文件 `.github/workflows/sync-to-ghcr.yml`：

```plain
name: 镜像搬运工 (DockerHub -> GHCR)

on:
  workflow_dispatch:
    inputs:
      image_name:
        description: '原镜像名称 (例如: mysql:8.0)'
        required: true
        default: 'nginx:alpine'
      target_name:
        description: '保存名称 (可选，留空则保持原名)'
        required: false

env:
  REGISTRY: ghcr.io

jobs:
  mirror:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write # 必须权限

    steps:
      # 1. (可选) 登录 DockerHub —— 防止拉取时被限流
      # 如果你不需要，可以删除这一步，但保留着更稳
      - name: 登录 DockerHub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
        # 如果没有配置 Secrets，这一步会跳过或报错；
        # 即使报错，只要不是"required"，通常不影响后续，建议去 Secrets 配个免费号
        continue-on-error: true 

      # 2. 登录 GHCR
      - name: 登录 GHCR
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      # 3. 核心逻辑
      - name: 拉取、重命名并推送
        run: |
          # --- 变量准备 ---
          SRC_IMAGE="${{ inputs.image_name }}"
          
          # 判断是否自定义了名称
          if [ -z "${{ inputs.target_name }}" ]; then
            # 提取原镜像名 (例如: library/nginx:alpine -> nginx:alpine)
            IMAGE_TAG=$(echo "$SRC_IMAGE" | awk -F'/' '{print $NF}')
          else
            IMAGE_TAG="${{ inputs.target_name }}"
          fi

          # 组合基础地址
          # 技巧: 直接在这里把整个字符串转为小写，一劳永逸
          FULL_TARGET="${{ env.REGISTRY }}/${{ github.repository_owner }}/$IMAGE_TAG"
          TARGET_IMAGE=$(echo "$FULL_TARGET" | tr '[:upper:]' '[:lower:]')

          # --- 执行命令 ---
          echo "1️⃣ 正在从 DockerHub 拉取: $SRC_IMAGE"
          docker pull $SRC_IMAGE

          echo "2️⃣ 正在打标签: $TARGET_IMAGE"
          docker tag $SRC_IMAGE $TARGET_IMAGE

          echo "3️⃣ 正在推送到 GHCR..."
          docker push $TARGET_IMAGE

          echo "✅ 完成! 你的拉取地址是:"
          echo "docker pull $TARGET_IMAGE"
```

#### 2. 如何使用
1. 点击仓库顶部的 **Actions**。
2. 左侧选择 **“镜像搬运工”**。
3. 点击 **Run workflow**。
4. 输入 `redis:7.0`，点击运行。
5. 一分钟后，你的 GHCR 里就有了 `ghcr.io/你的用户名/redis:7.0`。

#### GitHub Packages 的上限是多少？（避坑必读）
GitHub Packages 的计费策略分为 **“公开包 (Public)”** 和 **“私有包 (Private)”**，区别极其巨大。

存储空间 (Storage) 

| **类型** | **限制/额度** | **评价** |
| --- | --- | --- |
| **公开包 (Public)** | **完全免费，无限制** | ⭐⭐⭐⭐⭐ |
| **私有包 (Private)** | **500 MB (免费版)** | ❌ **** |
| | 2 GB (Pro 版) | 勉强够用 |

+ **警告**：Docker 镜像通常很大。一个 `mysql:8.0` 大约 500MB，一个 `pytorch` 镜像可能 2GB+。
+ **后果**：如果你把仓库设为私有，**传 1-2 个镜像你的免费额度就爆了**。一旦超额，GitHub Actions 可能会报错，或者要求你绑定信用卡扣费（$0.25 / GB / 月）。

从 GitHub Packages 下载镜像所产生的流量（出站流量）：

| **类型** | **限制/额度** | **评价** |
| --- | --- | --- |
| **公开包 (Public)** | **完全免费，无限制** | ⭐⭐⭐⭐⭐ |
| **私有包 (Private)** | **1 GB / 月 (免费版)** | ❌ **** |
| | 10 GB / 月 (Pro 版) | 也不多 |

+ **后果**：如果你设为私有，然后在服务器上 `docker pull`，1GB 流量瞬间用完（拉两次 MySQL 就没了）。

基于上述限制，如果你决定使用 GHCR，请务必“公开”

### 注
如果你的服务器在海外，GHCR 是最好用的（比 DockerHub 好用，因为 Actions 集成度高）。如果你的服务器在国内，GHCR 仅适合作为代码构建的产物存储，最终运行还是建议同步到阿里云 ACR。

## GitHub Actions+网盘
这个方案是利用 GitHub Actions 的**免费且高速的海外网络**，帮你把 Docker Hub 的镜像下载下来，打包成文件，然后**自动上传到你的网盘**。

这样，你的国内服务器只需要从网盘（Alist 挂载）里读取文件即可，**全程跑满国内带宽**。

## Cloudflare中转
**根据 Cloudflare 协议 中，2.2.1 第 (j) use the Services to provide a virtual private network or other similar proxy services.**

**使用本服务可能存在被 Cloudflare 封号的潜在风险，请自行斟酌使用风险。**

**如果你选择了“根据主机名选择对应的上游地址”方式部署，你可能会:**

**被 Netcraft 扫描到，收到警告邮件**

**被 Netcraft 同步到 Google Safe Browsing 标记为钓鱼网站**

**被 Netcraft 投诉到 Cloudflare 标记为钓鱼网站, 无法正常 pull 镜像**

**收到律师函**

****

基于 Cloudflare Workers 的方案与之前的“阿里云存储”方案逻辑完全不同。

+ **阿里云方案**：是**仓库（Storage）**。你需要先把镜像“搬”进去，才能下载。
+ **Cloudflare 方案**：是**即时代理（Proxy）**。它不需要搬运，你请求什么，它就帮你去 DockerHub 抓什么，然后转发给你。它是一个“梯子”。

由于你已经有了自己的域名 `baidu.com`，这个方案实施起来非常快，**5 分钟内**即可完成。

我们采用目前社区维护最活跃、功能最全的开源项目：[**cmliu/CF-Workers-docker.io**](https://github.com/cmliu/CF-Workers-docker.io)。

### 第一步：创建 Cloudflare Worker
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 左侧菜单点击 **Workers & Pages**。
3. 点击 **Create** (创建应用) -> **Create Worker** (创建 Worker)。
4. 名字随便起，例如 `docker-proxy`，点击 **Deploy** (部署)。
    - _此时你会得到一个 _`_xxx.workers.dev_`_ 的地址，这个地址在国内是被墙的，先不管它。_

### 第二步：部署代理代码
1. 进入刚才创建的 Worker，点击 **Edit code** (编辑代码)。
2. **删除** 编辑器里原本自带的所有代码。
3. 去 GitHub 复制大神写好的代码：
    - 打开链接：[worker.js 源码](https://www.google.com/search?q=https://raw.githubusercontent.com/cmliu/CF-Workers-docker.io/main/worker.js)
    - **全选 (Ctrl+A) -> 复制**。
4. 回到 Cloudflare 编辑器，**粘贴**代码。
5. 点击右上角的 **Deploy** 保存。

### 第三步：绑定你的域名 (关键！)
因为 Cloudflare 自带的 `*.workers.dev` 域名在国内无法访问，必须绑定你自己的域名。

1. 回到 Worker 的详细页面，点击 **Settings** (设置) -> **Triggers** (触发器)。
2. 点击 **Add Custom Domain** (添加自定义域名)。
3. 输入你想用的二级域名，例如：`docker.baidu.com`。
    - _前提：你的域名 _`baidu.com`_ 必须是托管在 Cloudflare 上的（DNS 解析在 CF）。如果不是，你需要先将域名的 DNS 服务器改为 Cloudflare。_
4. 点击 **Add Custom Domain**。
    - _等待几分钟，直到状态变为 Active (有效)。_

### 第四步：如何使用？
现在，`docker.baidu.com` 就是你专属的 Docker Hub 加速器了。你有两种用法：

#### 用法 A：直接替换前缀 (临时用)
原本你要拉取 `nginx`：

```plain
docker pull nginx:latest
```

现在改成：

```plain
docker pull docker.baidu.com/library/nginx:latest
```

_(注意：官方镜像如 nginx, mysql 需要加 _`_/library/_`_ 前缀，或者代码里有自动补全逻辑)_

#### 用法 B：配置镜像加速器 (推荐，永久生效)
这样配置后，你不需要改任何命令，直接 `docker pull nginx` 就会自动走你的 CF 代理。

1. 修改 Docker 配置：

编辑服务器上的 /etc/docker/daemon.json 文件（如果没有就新建）：

```plain
{
  "registry-mirrors": [
    "https://docker.baidu.com"
  ]
}
```

2. **重启 Docker**：

```plain
sudo systemctl daemon-reload
sudo systemctl restart docker
```

3. 验证：

输入 docker info，看输出信息的最后几行，如果有 Registry Mirrors 并且显示了你的域名，说明成功了。

### 进阶优化：防止被滥用 (可选)
既然你的域名是公开的，别人也能用你的流量。虽然 Cloudflare 每天有 10 万次免费请求，但为了安全，建议加个密码。

1. 回到 Cloudflare Worker 的代码编辑页面。
2. 在代码的最开头（通常在前几行），找到 `const TOKEN = '';` 这种变量定义（不同版本的代码位置可能不同，cmliu 的代码通常支持环境变量）。
3. **推荐做法**：使用环境变量配置。
    - Worker 页面 -> **Settings** -> **Variables**.
    - 添加变量：
        * `TOKEN`: 设置一个密码，例如 `mypassword123`.
    - 保存并部署。

设置了密码后怎么用？

你就不能用“用法 B”了，必须用 docker login：

```plain
docker login docker.baidu.com
# 用户名：随便填 (例如 admin)
# 密码：填刚才设置的 TOKEN (mypassword123)
```

登录后，再 `docker pull docker.baidu.com/library/nginx`。

## Github Actions双重同步到阿里云与Github Packages
先搭建好github packages和阿里云ACR的actions在一个仓库中

在同一仓库中（也可以在任意仓库中）新建一个 `.github/workflows/sync-double.yml`

```plain
name: 双重同步 (阿里云 + GHCR)

on:
  workflow_dispatch:
    inputs:
      image_name:
        description: '原镜像名称 (如: mysql:8.0)'
        required: true
        default: 'nginx:alpine'

env:
  # 阿里云配置
  ALIYUN_REGISTRY: ${{ secrets.ALIYUN_REGISTRY }}
  ALIYUN_NAMESPACE: ${{ secrets.ALIYUN_NAMESPACE }}
  # GHCR 配置
  GHCR_REGISTRY: ghcr.io

jobs:
  double-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write # 必须赋予写 GHCR 的权限

    steps:
      - name: 1. 登录阿里云
        uses: docker/login-action@v2
        with:
          registry: ${{ env.ALIYUN_REGISTRY }}
          username: ${{ secrets.ALIYUN_USERNAME }}
          password: ${{ secrets.ALIYUN_PASSWORD }}

      - name: 2. 登录 GHCR
        uses: docker/login-action@v2
        with:
          registry: ${{ env.GHCR_REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: 3. 拉取原镜像
        run: |
          docker pull ${{ inputs.image_name }}

      - name: 4. 推送到 阿里云
        run: |
          # 提取镜像名和标签 (例如 mysql:8.0)
          IMAGE_TAG=$(echo "${{ inputs.image_name }}" | awk -F'/' '{print $NF}')
          
          # 组合地址
          ALI_TARGET="$ALIYUN_REGISTRY/$ALIYUN_NAMESPACE/$IMAGE_TAG"
          
          echo "🚀 推送至阿里云: $ALI_TARGET"
          docker tag ${{ inputs.image_name }} $ALI_TARGET
          docker push $ALI_TARGET

      - name: 5. 推送到 GHCR
        run: |
          IMAGE_TAG=$(echo "${{ inputs.image_name }}" | awk -F'/' '{print $NF}')
          
          # 关键步骤：GitHub 用户名转小写 (GHCR 强制要求)
          OWNER=$(echo "${{ github.repository_owner }}" | tr '[:upper:]' '[:lower:]')
          
          # 组合地址
          GHCR_TARGET="$GHCR_REGISTRY/$OWNER/$IMAGE_TAG"
          
          echo "🚀 推送至 GHCR: $GHCR_TARGET"
          docker tag ${{ inputs.image_name }} $GHCR_TARGET
          docker push $GHCR_TARGET

      - name: 6. 总结
        run: |
          echo "✅ 同步完成！"
```

