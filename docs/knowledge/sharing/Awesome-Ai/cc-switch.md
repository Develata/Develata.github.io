---
title: CC Switch
date: 2026-04-13
order: 3
---

# CC Switch 使用指南

## 1. CC Switch 是什么
[Github Repo](https://github.com/farion1231/cc-switch)

CC Switch (Cloud/Code Switch) 是一个可视化的终端配置管理工具，目前主要支持 **Claude Code**、**Codex** 以及 **Gemini CLI**。

> 补充：截至 **2026-04-13**，仓库 README 展示的当前版本为 **v3.9.1**。

**核心能力：**
*   **多环境切换**：一键覆写 Claude/Codex/Gemini 的配置文件，毫秒级生效。
*   **MCP 统一管理**：在一个面板管理所有 CLI 的 MCP Server，支持一键开关与同步。
*   **Prompts 系统**：可视化管理 `CLAUDE.md`、`AGENTS.md` 和 `GEMINI.md` 系统提示词。
*   **Skills 仓库**：自动扫描管理Skills，并支持一键安装 GitHub 上的 Claude Skills。

---

## 2. 安装与更新

> 支持 macOS, Windows, Linux 全平台 (基于 Tauri v2)。

### 2.1 macOS
推荐使用 Homebrew 安装：

```bash
# 1. 订阅 Tap
brew tap farion1231/ccswitch

# 2. 安装
brew install --cask cc-switch
```

更新：
```bash
brew upgrade --cask cc-switch
```

### 2.2 Windows

推荐使用 scoop 安装:
```
scoop install --cask cc-switch
```

更新：
```bash
scoop upgrade --cask cc-switch
```

其它安装方式：
*   **安装包**：下载 `.msi` 安装程序。
*   **便携版**：下载 `.zip` 解压即用。
*   [前往 GitHub Releases 下载](https://github.com/farion1231/cc-switch/releases)



### 2.3 Linux
*   **Arch Linux (AUR)**:
    ```bash
    paru -S cc-switch-bin
    ```
*   **Flatpak**:
    ```bash
    flatpak install --user ./CC-Switch-v{version}-Linux.flatpak
    flatpak run com.ccswitch.desktop
    ```
*   **其他发行版**: 提供 `.deb`, `.rpm` 和 `.AppImage`。

---

## 3. 快速上手

### 3.1 添加配置 (Add Provider)
> *提示：使用前请确保已安装对应的 CLI 工具（如 `npm i -g @anthropic-ai/claude-code`），否则无法生效。*

CC Switch 的核心概念是 **Provider**（配置预设）。
1.  点击主界面右上角的 **Add Provider**。
2.  **选择模版**：
    *   **Claude Official**: 官方 OAuth 登录模式。
    *   **OpenAI Compatible**: 适用于 Codex 或使用中转服务的 Claude Code (如 DeepSeek, PackyCode)。
    *   **Gemini Official**: Google 官方 API。
3.  填写对应的 `API Key` 和 `Base URL`。
    *   *注意：中转服务地址通常需包含 `/v1` 后缀（如 `https://api.example.com/v1`）。*

### 3.2 一键切换
1.  在列表中选中你想要使用的环境。
2.  点击 **Enable**（或在系统托盘直接选择）。
3.  **生效机制**：
    *   CC Switch 会自动修改对应 CLI 的配置文件（如 `~/.claude/settings.json` 或 `~/.codex/auth.json`）。
    *   **通常需要重启终端或对应客户端**：例如重新运行 `claude`、`codex` 或 Gemini CLI 后生效。

---

## 4. 深度功能解析

### 4.1 MCP 管理中心 (Unified MCP)
不再需要手动编辑复杂的 JSON 配置文件。CC Switch 提供了一个统一的面板来管理所有工具的 MCP Server。

*   **多工具同步**：你可以定义一个 MCP Server（如 `filesystem`），并勾选它同步到 Claude 和 Codex。
*   **配置隔离**：也可以为特定工具设置独享的 MCP。
*   **导入导出**：支持从现有的 `claude.json` 导入配置。

### 4.2 Prompts (系统提示词) 管理
针对不同项目或角色，快速切换系统级指令。

*   **文件映射**：
    *   Claude -> `CLAUDE.md`
    *   Codex -> `AGENTS.md`
    *   Gemini -> `GEMINI.md`
*   **特色功能**：内置 Markdown 编辑器，支持实时预览。切换 Preset 时，会自动备份当前目录下的原有文件，防止误覆盖。

### 4.3 Skills 技能库 (v3.7+)
*   **自动发现**：输入 GitHub 仓库地址（如 `User/Repo`），自动扫描其中的 Skills。
*   **一键安装**：将扫描到的工具直接安装到 `~/.claude/skills/` 目录，Claude Code 启动时会自动加载。

---

## 5. 配置文件与数据架构

### 5.1 数据存储
CC Switch 采用 **SQLite + JSON** 双层架构 (v3.8+)：
*   **核心数据 (SSOT)**: `~/.cc-switch/cc-switch.db` 存储所有 Provider、MCP、Prompts 和 Skills 数据。
*   **本地设置**: `~/.cc-switch/settings.json` 存储窗口状态、路径等设备级配置。

### 5.2 云同步 (Cloud Sync)
实现多台电脑配置一致：
1.  进入 **Settings** -> **Custom Configuration Directory**。
2.  选择你的云同步目录（如 Dropbox, OneDrive, iCloud Drive）。
3.  应用重启后，数据将迁移至该目录，在其他电脑指向同一目录即可实现同步。

### 5.3 CLI 配置文件路径参考
CC Switch 修改的目标文件如下，了解这些有助于排查问题：

| 工具 | 配置文件路径 | 说明 |
| :--- | :--- | :--- |
| **Claude Code** | `~/.claude/settings.json` / `~/.claude.json` | 存储配置、认证与 MCP |
| **Codex** | `~/.codex/auth.json` | 存储认证信息 |
| **Codex** | `~/.codex/config.toml` | 存储 MCP Server |
| **Gemini CLI** | `~/.gemini/.env` | 存储 API Key |
| **Gemini CLI** | `~/.gemini/settings.json` | 存储认证模式和 MCP |

---

## 6. 常见问题

### Q: 切换后 Claude Code 报错 401？
*   检查 **Base URL** 是否正确。如果使用中转，通常需要带上 `/v1`（如 `https://api.example.com/v1`）。
*   如果是官方模式，尝试重新进行 OAuth 授权。

### Q: 什么是 Deep Link？
*   CC Switch 支持 `ccswitch://` 协议。
*   你可以将配置导出为链接分享给同事，对方点击链接即可一键导入复杂的 API 和 MCP 配置。
