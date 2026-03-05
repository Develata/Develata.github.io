---
title: Scoop
date: 2026-1-31
order: 3
---

# Scoop 使用指南

## 1. 什么是Scoop 
[Scoop github repo](https://github.com/ScoopInstaller/Scoop)

Scoop 是 Windows 下的命令行包管理器（类似 Debian 的 `apt` 或 macOS 的 `Homebrew`）。
*   **非侵入式**：默认安装在用户目录 (`~/scoop`)，无需管理员权限。
*   **环境整洁**：自动管理 Path 环境变量，不会污染注册表。
*   **脚本友好**：极其适合快速搭建开发环境。

---

## 2. 安装与部署

> **环境要求**：PowerShell 5.1+ (Windows 10/11 默认满足)。

### 2.1 一行命令安装
打开 PowerShell，直接运行：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
```

它将把 Scoop 安装到默认位置：`C:\Users\<YOUR USERNAME>\scoop`

如果系统询问你是否更改策略，输入 Y 并回车确认。


### 2.2 验证安装
安装完成后，输入以下命令查看帮助信息，如果能看到输出说明安装成功：

```powershell
scoop help
```


## 3. 快速上手

### 3.1 必备组件
安装完 Scoop 后，建议优先安装以下工具以提升体验：

```powershell
# 安装 Git (所有 bucket 的基础)
scoop install git

# 安装多线程下载器 Aria2 (极大提升下载速度)
scoop install aria2
scoop config aria2-enabled true
```

### 3.2 启用常用软件库 (Buckets)
Scoop 默认只有 `main` 库（精简 CLI 工具）。我们需要启用桶拓展 `bucket add` 以获取更多常用软件：


```powershell
# 通用软件库 (浏览器、VS Code 等)
scoop bucket add extras

# 游戏 - 开源及免费软件类视频游戏与游戏相关工具
scoop bucket add games

# 字体库 (Fira Code, JetBrains Mono 等)
scoop bucket add nerd-fonts

# 来自 Nirsoft 的 250 多款应用合集
scoop bucket add nirsoft

# 来自微软的 Sysinternals 工具集
scoop bucket add sysinternals

# nonportable 应用程序（可能触发 UAC 提示）
scoop bucket add nonportable

# 软件历史版本 (如 Python 2.7, Java 8)
scoop bucket add versions

# 适用于大多数版本的 PHP 安装程序
scoop bucket add php

# Java 专用库
scoop bucket add java
```

### 3.3 常用命令速查

| 操作 | 命令 | 示例 |
| :--- | :--- | :--- |
| **搜索** | `scoop search <app>` | `scoop search python` |
| **搜索** | `scoop search` |显示所有支持的软件|
| **安装** | `scoop install <app>` | `scoop install vscode` |
| **更新** | `scoop update *` | 更新所有软件 |
| **清理** | `scoop cleanup *` | 删除旧版本安装包 |
| **状态** | `scoop status` | 检查是否有更新 |

---

## 4. 开发环境配置 (最佳实践)

### 4.1 核心编程语言

**Python**
Scoop 安装的 Python 不会污染全局环境，且支持版本管理。
```powershell
scoop install python
```

**Go (Golang)**
Scoop 会自动配置 `GOPATH` 和 `GOBIN`，开箱即用。
```powershell
scoop install go
```

**Java (JDK)**
安装最新的 OpenJDK（需先添加 `java` bucket）：
```powershell
scoop install openjdk
# 或者安装特定版本
scoop install openjdk17
```

**Node.js**
推荐安装 LTS 版本：
```powershell
scoop install nodejs-lts
```

### 4.2 Rust (推荐方案)
Windows 上安装 Rust 最大的痛点是 C++ 链接器。我们推荐使用 `rustup` + `msvc`：

1.  **安装 Rustup**:
    ```powershell
    scoop install rustup
    ```
2.  **安装链接器 (Visual Studio Build Tools)**:
    由于 VS Build Tools 体积庞大且配置复杂，**不推荐用 Scoop 安装**。
    *   下载 [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) 安装程序。
    *   勾选 "C++ 桌面开发" 进行安装。
3.  **初始化**:
    ```powershell
    rustup-init
    ```

> *轻量替代方案*：如果你坚决不想装 VS Build Tools，可以安装 `gcc` 并使用 GNU 工具链：
> ```powershell
> scoop install gcc
> rustup default stable-x86_64-pc-windows-gnu
> ```

### 4.3 C/C++ (MinGW/GCC)
如果你只需要简单的 C/C++ 编译环境（如刷题、简单项目）：
```powershell
scoop install gcc
```
这会安装 MinGW-w64 工具链。

---

## 5. 命令行效率神器 (CLI Power Tools)

Scoop 是安装现代化 CLI 工具的最佳途径，以下神器强烈推荐：

| 工具 | 用途 | 命令 |
| :--- | :--- | :--- |
| **ripgrep** | 极速代码搜索 (比 grep 快得多) | `scoop install ripgrep` |
| **fd** | 极速文件搜索 (比 find 友好) | `scoop install fd` |
| **fzf** | 模糊查找神器 | `scoop install fzf` |
| **bat** | 带语法高亮的 cat 替代品 | `scoop install bat` |
| **neovim** | 现代化 Vim 编辑器 | `scoop install neovim` |
| **7zip** | 命令行解压工具 | `scoop install 7zip` |
| **ffmpeg** | 视音频处理瑞士军刀 | `scoop install ffmpeg` |

---

## 6. 进阶技巧

### 6.1 代理设置
如果下载速度慢，可以为 Scoop 单独设置代理（Aria2 也会生效）：
```powershell
scoop config proxy 127.0.0.1:10808
```

### 6.2 忘记 root 密码? (sudo)
Scoop 有一个名为 `sudo` 的包，可以让你在非管理员终端临时提权：
```powershell
scoop install sudo
sudo Set-Time  # 举例
```

## 7. scoop list

## 参考链接

- [Scoop GitHub 仓库](https://github.com/ScoopInstaller/Scoop)
