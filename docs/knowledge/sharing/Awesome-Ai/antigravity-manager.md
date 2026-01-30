---
title: Antigravity-Manager
order: 2
---

# Antigravity-Manager 使用指南

## 1. Antigravity-Manager 是什么
[Antigravity-Manager github repo](https://github.com/lbjlaq/Antigravity-Manager)

Antigravity-Manager 将antigravity 的 gemini 和 claude 额度反代为api。

**核心能力：**
*   **账号管理**：一键无缝切换 Google Antigravity 账号，可视化监控配额。
*   **协议反代 (API Proxy)**：将非标准会话转换为标准的 OpenAI (`/v1/chat/completions`) 和 Anthropic (`/v1/messages`) 接口。

---

## 2. 安装与部署

> 支持 macOS, Windows, Linux 及 Docker (NAS/Server) 部署。

### 2.1 macOS
推荐使用 Homebrew 安装：

```bash
# 1. 订阅 Tap
brew tap lbjlaq/antigravity-manager https://github.com/lbjlaq/Antigravity-Manager

# 2. 安装
brew install --cask antigravity-tools
```

### 2.2 Windows
*   **安装包**：下载最新版本的安装包（通常以 `.msi` 或 `.exe` 结尾）。

### 2.3 Linux (Arch/Debian)
*   **Arch Linux**:
**方式 1：一键安装脚本 (推荐)**
可以选择通过一键安装脚本或 Homebrew 进行安装：
    ```bash
    curl -sSL https://raw.githubusercontent.com/lbjlaq/Antigravity-Manager/main/deploy/arch/install.sh | bash
    ```
    **方式 2：通过 Homebrew (如果您已安装 Linuxbrew)**

    ```bash
    brew tap lbjlaq/antigravity-manager https://github.com/lbjlaq/Antigravity-Manager
    brew install --cask antigravity-tools
    ```
*   **其他发行版**: 下载 `.AppImage` 或 `.deb` 包。

### 2.4 Docker 部署 (服务端/NAS 推荐)

#### 启动命令 (标准模式)

```bash
docker run -d --name antigravity-manager \
  -p 8045:8045 \
  -e API_KEY=sk-your-secret-key \
  -e WEB_PASSWORD=your-admin-password \
  -e ABV_MAX_BODY_SIZE=104857600 \
  -v ~/.antigravity_tools:/root/.antigravity_tools \
  lbjlaq/antigravity-manager:latest
```

#### 关键环境变量说明

| 变量名 | 必填 | 说明 |
| :--- | :--- | :--- |
| `API_KEY` | **是** | **服务鉴权密钥**。用于所有 AI 客户端（如 Cherry Studio）连接时的 `Authorization`。 |
| `WEB_PASSWORD` | 否 | **管理后台密码**。用于浏览器登录 Web UI。如果不填，默认使用 `API_KEY` 作为登录密码。 |
| `ABV_MAX_BODY_SIZE` | 否 | 请求体大小限制（字节）。默认为 10MB，若需上传高清图/大文件建议设为 100MB+。 |

> **安全最佳实践**：建议同时设置 `API_KEY` 和 `WEB_PASSWORD`。
> *   将 `API_KEY` 分发给团队成员或填入软件中使用。
> *   保留 `WEB_PASSWORD` 仅供管理员登录后台管理账号，避免管理权限泄露。

#### 🔐 鉴权逻辑说明
*   **场景 A：仅设置了 `API_KEY`**
    - **Web 登录**：使用 `API_KEY` 进入后台。
    - **API 调用**：使用 `API_KEY` 进行 AI 请求鉴权。
*   **场景 B：同时设置了 `API_KEY` 和 `WEB_PASSWORD` (推荐)**
    - **Web 登录**：**必须**使用 `WEB_PASSWORD`，使用 API Key 将被拒绝（更安全）。
    - **API 调用**：统一使用 `API_KEY`。这样您可以将 API Key 分发给成员，而保留密码仅供管理员使用。

#### 🛠️ 进阶操作 (Advanced)

**1. 忘记密钥？**
可以通过查看容器日志找回：
```bash
docker logs antigravity-manager 2>&1 | grep -E "API_KEY|WEB_PASSWORD"
# 或者直接查看配置文件
grep -E '"api_key"|"admin_password"' ~/.antigravity_tools/gui_config.json
```

**2. 使用 Docker Compose 部署**
在项目目录下创建 `docker-compose.yml`：
```yaml
version: '3'
services:
  antigravity:
    image: lbjlaq/antigravity-manager:latest
    container_name: antigravity-manager
    ports:
      - "8045:8045"
    environment:
      - API_KEY=sk-your-secret-key
      - WEB_PASSWORD=your-admin-password
      - ABV_MAX_BODY_SIZE=104857600
    volumes:
      - ~/.antigravity_tools:/root/.antigravity_tools
    restart: always
```
启动服务：
```bash
docker compose up -d
```

**3. 密码优先级逻辑**
*   **第一优先级 (环境变量)**: `WEB_PASSWORD`。只要设置了环境变量，系统将始终使用它。
*   **第二优先级 (配置文件)**: `gui_config.json` 中的 `admin_password` 字段。UI 的“保存”操作会更新此值。
*   **保底回退**: 若上述均未设置，则回退使用 `API_KEY` 作为登录密码。


---

## 3. 快速上手

启动应用（或访问 Docker 的 Web UI `http://localhost:8045`）后：

### 3.1 仪表盘 (Dashboard)
*   **全览监控**：查看所有账号（Gemini/Claude）的存活状态和剩余配额。
*   **一键切换**：系统会自动计算“最佳账号”（配额最充足），点击即可切换为当前活跃账号。

### 3.2 添加账号
进入 **Accounts** 页面：
1.  点击 **Add Account**。
2.  **OAuth 2.0 授权**：复制生成的授权链接在浏览器打开，登录 Google/Anthropic 账号。
3.  授权完成后，应用会自动捕获 Token 并保存。
4.  支持 JSON 批量导入备份的账号数据。

### 3.3 开启 API 服务
进入 **System Settings** 或 **Proxy** 页面，确保服务已启动。
*   **默认端口**：`8045`
*   **基础地址 (Base URL)**：`http://127.0.0.1:8045/v1`

---

## 4. 客户端集成指南

Antigravity-Manager 兼容 OpenAI 和 Anthropic 协议，几乎所有支持自定义 Endpoint 的 AI 工具均可连接。

### 4.1 集成到 Cherry Studio / NextChat

这是最常见的用法，将 Antigravity 作为你的私有 API Provider。

*   **Provider 类型**：选择 **OpenAI Compatible** (推荐) 或 **Anthropic**。
*   **API Key**：填入你在 Docker 环境变量或设置中配置的 `API_KEY`。
*   **API Endpoint (Base URL)**：
    *   `http://<你的IP>:8045/v1`
*   **模型名称 (Model ID)**：
    *   `claude-3-5-sonnet-20241022` (自动路由到 Claude 账号)
    *   `gemini-1.5-pro` (自动路由到 Google 账号)
    *   `gemini-2.0-flash-exp`

> **特色功能**：在 Cherry Studio 中，Antigravity 支持原生的**搜索引文回显**。当模型进行联网搜索时，来源链接会以卡片形式展示。

### 4.2 集成到 Claude Code (CLI)

Antigravity 完美支持 Anthropic 官方的命令行工具 `claude-code`，支持其复杂的系统提示词和思维链功能。

**配置步骤：**

1.  在终端设置环境变量，将流量指向 Antigravity：

    ```bash
    # Linux/macOS
    export ANTHROPIC_BASE_URL="http://127.0.0.1:8045/v1"
    export ANTHROPIC_API_KEY="sk-your-antigravity-key"

    # Windows PowerShell
    $env:ANTHROPIC_BASE_URL="http://127.0.0.1:8045/v1"
    $env:ANTHROPIC_API_KEY="sk-your-antigravity-key"
    ```

2.  运行 Claude Code：
    ```bash
    claude
    ```

**优化策略**：
Antigravity 后端会自动识别 Claude CLI 生成的后台任务（如自动生成对话标题），并将其智能降级路由到 `Flash` 模型，从而节省你的 `Pro` 账号高算力配额。

---

## 5. 进阶功能

### 5.1 智能模型路由 (Model Router)
你不需要死记硬背具体的模型版本号。Antigravity 支持“家族式映射”：
*   请求 `gpt-4o` -> 自动映射到系统内配置的 **Gemini 1.5 Pro** 或 **Claude 3.5 Sonnet**（可在设置中自定义）。
*   支持**正则匹配**：定义规则让所有 `dev-*` 开头的模型请求都走免费账号。

### 5.2 多模态与 Imagen 3
*   支持 OpenAI 格式的图片生成请求 (`dall-e-3`) 自动转换为 **Imagen 3** 调用。
*   **画质映射**：OpenAI 的 `size="1024x1024"` 参数会自动适配 Imagen 的纵横比设置。

### 5.3 网络与风控
*   **403/429 自愈**：当某个账号遇到 Google/Anthropic 的风控或限流时，网关会毫秒级自动重试并切换到下一个可用账号，前端用户无感知。
*   **IP 监控**：内置 IP 纯净度检测，防止因脏 IP 导致账号连坐封禁。
