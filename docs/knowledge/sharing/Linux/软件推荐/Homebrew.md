---
title: Homebrew
date: 2026-3-9
order: 1
---

# Homebrew 使用指南

## 1. 什么是 Homebrew
[Homebrew 官网](https://brew.sh/)

Homebrew 是 macOS / Linux 上常用的命令行包管理器。在 Linux 上，它更适合扮演“系统包管理器的补充”：
- **适合装新工具**：当发行版仓库版本偏旧时，Homebrew 往往能提供更现代的 CLI / 开发工具。
- **跨平台一致**：同一套 `brew` 命令可以同时管理 macOS、Linux，甚至 WSL 2 环境。
- **隔离性较好**：默认安装到 `/home/linuxbrew/.linuxbrew`，尽量减少对系统目录的直接污染。

> 建议把 Homebrew 理解为 `apt` / `dnf` / `pacman` 的补充，而不是替代品。内核、驱动、system library、桌面核心组件仍优先交给发行版自身管理。

---

## 2. 安装与部署

### 2.1 环境要求
Homebrew 官方对 Linux 的推荐环境大致如下：
- **Tier 1**：支持窗口内的 Ubuntu，或 Homebrew 官方 Docker 镜像。
- **默认前缀**：`/home/linuxbrew/.linuxbrew`
- **架构**：`x86_64` 或 `ARM64/AArch64`
- **glibc**：`>= 2.35` 最稳；`2.13 ~ 2.34` 仍可用，但通常会自动补装 Homebrew 自己的 `glibc`

如果你装在默认前缀之外，很多包会失去 bottle（二进制包）优势，被迫源码编译，速度更慢、问题更多。

### 2.2 安装依赖
先用系统包管理器装好基础依赖：

```bash
# Debian / Ubuntu
sudo apt-get install build-essential procps curl file git

# Fedora
sudo dnf group install development-tools
sudo dnf install procps-ng curl file

# CentOS Stream / RHEL
sudo dnf group install 'Development Tools'
sudo dnf install procps-ng curl file

# Arch Linux
sudo pacman -S base-devel procps-ng curl file git
```

### 2.3 一行命令安装
执行官方安装脚本：

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Linux 下推荐安装位置是：

```bash
/home/linuxbrew/.linuxbrew
```

安装过程中可能会请求 `sudo` 来创建或修复默认前缀；安装完成后，日常 `brew install` 一般不再需要 `sudo`。

### 2.4 配置环境变量
安装完成后，把 `brew` 加入当前 shell：

```bash
test -d ~/.linuxbrew && eval "$(~/.linuxbrew/bin/brew shellenv)"
test -d /home/linuxbrew/.linuxbrew && eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
echo 'eval "$($(brew --prefix)/bin/brew shellenv)"' >> ~/.bashrc
```

如果你用的是 `zsh`，把最后一行写入 `~/.zshrc` 即可。

### 2.5 验证安装
```bash
brew --version
brew config
brew doctor
```

其中 `brew --version` 用来确认命令存在，`brew config` 用来查看当前前缀和系统信息，`brew doctor` 用来排查常见环境问题。

---

## 3. 快速上手

### 3.1 常用命令速查

| 操作 | 命令 | 示例 |
| :--- | :--- | :--- |
| 搜索软件 | `brew search <keyword>` | `brew search python` |
| 查看详情 | `brew info <formula>` | `brew info node` |
| 安装软件 | `brew install <formula>` | `brew install wget` |
| 查看已装 | `brew list` | `brew list` |
| 检查更新 | `brew outdated` | `brew outdated` |
| 更新索引 | `brew update` | `brew update` |
| 升级软件 | `brew upgrade` | `brew upgrade` |
| 卸载软件 | `brew uninstall <formula>` | `brew uninstall wget` |
| 清理缓存/旧版本 | `brew cleanup` | `brew cleanup` |
| 清理无用依赖 | `brew autoremove` | `brew autoremove` |

### 3.2 先装几个高频工具
Homebrew 在 Linux 上最适合先装现代 CLI 工具：

```bash
brew install wget curl jq ripgrep fd fzf bat eza zoxide neovim
```

如果你是第一次使用，建议顺手了解两个目录：

```bash
brew --prefix
brew --cellar
```

`prefix` 是 Homebrew 当前工作前缀，`cellar` 是公式实际安装目录。

### 3.3 你应该形成的基本习惯
日常维护通常就是这一套：

```bash
brew update
brew outdated
brew upgrade
brew cleanup
```

Homebrew 会自动做部分清理，但手动执行一次 `brew cleanup` 仍然是好习惯。

---

## 4. 开发环境配置（最佳实践）

### 4.1 核心编程语言

**Python**
```bash
brew install python
python3 --version
pip3 --version
```

**Node.js**
```bash
brew install node
node --version
npm --version
```

**Go**
```bash
brew install go
go version
```

**Java（OpenJDK）**
```bash
brew install openjdk
java --version
```

### 4.2 常见构建工具
```bash
brew install cmake pkg-config
```

如果你经常自己编译项目，这两个包基本是高频常客。

### 4.3 一条建议
在 Linux 上：
- **系统编译链**（如 `gcc`、`make`、基础头文件）优先走发行版仓库
- **用户态开发工具**（如 `node`、`go`、`python`、`neovim`、`fzf`）优先考虑 Homebrew

这样更稳，也更容易排查问题。

---

## 5. 命令行效率神器（CLI Power Tools）

| 工具 | 用途 | 命令 |
| :--- | :--- | :--- |
| `ripgrep` | 极速全文搜索 | `brew install ripgrep` |
| `fd` | 更友好的文件搜索 | `brew install fd` |
| `fzf` | 模糊查找 | `brew install fzf` |
| `bat` | 带高亮的 `cat` 替代品 | `brew install bat` |
| `eza` | 更现代的 `ls` | `brew install eza` |
| `zoxide` | 智能目录跳转 | `brew install zoxide` |
| `jq` | JSON 处理 | `brew install jq` |
| `neovim` | 现代编辑器 | `brew install neovim` |

---

## 6. 进阶技巧

### 6.1 锁定版本，防止被升级
如果某个工具版本很关键，可以 pin 住：

```bash
brew pin node
brew unpin node
```

### 6.2 用 Brewfile 复刻环境
`brew bundle` 很适合把你的开发机环境声明化：

```bash
brew bundle dump --describe --force
brew bundle
brew bundle check
```

这会在当前目录生成 `Brewfile`。以后换机器时，直接在同目录执行 `brew bundle` 即可恢复常用工具。

### 6.3 管理后台服务
如果某些公式带 service 定义，可以在 Linux + `systemd` 环境下这样管理：

```bash
brew services list
brew services start mysql
brew services stop mysql
```

### 6.4 故障排查
遇到安装失败、链接异常、路径混乱时，优先执行：

```bash
brew doctor
brew config
brew info <formula>
```

如果某个包总是在源码编译，先检查自己是不是偏离了默认前缀。

## 参考链接

- [Homebrew 官网](https://brew.sh/)
- [Homebrew 官方安装文档](https://docs.brew.sh/Installation)
- [Homebrew on Linux 官方文档](https://docs.brew.sh/Homebrew-on-Linux)
- [Homebrew 官方命令手册](https://docs.brew.sh/Manpage)
- [Homebrew FAQ](https://docs.brew.sh/FAQ)
