---
title: Homebrew
date: 2026-10-14
order: 1
---

# Homebrew 使用指南

[Homebrew](https://brew.sh/) 不只适用于 macOS，也可以在 Linux 和 WSL 2 上使用。这里主要记录 Linux 的安装和日常命令：系统组件留给 `apt` / `dnf` / `pacman`，Homebrew 用来补充较新的 CLI 和开发工具。

## 1. 安装

Linux 默认前缀是 `/home/linuxbrew/.linuxbrew`。尽量沿用它，很多预编译包（bottle）依赖这个路径；自定义目录可能让安装变成漫长的源码编译。

先安装基础编译与下载工具，按发行版选一组：

```bash
# Debian / Ubuntu
sudo apt-get update
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

运行官方安装器：

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

用普通用户运行，安装器会按需请求 `sudo`；日常安装软件不需要 `sudo brew install`。

按安装器最后的 **Next steps** 配置 shell。默认 Linux 路径、Bash 的例子：

```bash
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.bashrc
```

Zsh 则写入 `~/.zshrc`，这行配置添加一次即可。

```bash
brew --version
brew config
brew doctor
brew install hello
hello
```

新机器优先使用受支持的 64 位 Linux 或 WSL 2。WSL 1 和 ARM32 的支持有限，32 位 x86 不受支持；发行版、glibc 和 CPU 的具体要求看 [Support Tiers](https://docs.brew.sh/Support-Tiers#linux)，不必在笔记里维护一份容易过期的版本表。

## 2. 常用命令

下表的 `<formula>` 表示软件包名，执行时换成 `jq`、`ripgrep` 等实际名称。

| 操作 | 命令 |
| :--- | :--- |
| 搜索 | `brew search <keyword>` |
| 查看详情与安装提示 | `brew info <formula>` |
| 安装、卸载 | `brew install <formula>`、`brew uninstall <formula>` |
| 已安装软件及版本 | `brew list --versions` |
| 更新 Homebrew 和软件描述 | `brew update` |
| 查看可升级项 | `brew outdated` |
| 升级单个软件 | `brew upgrade <formula>` |
| 升级全部 | `brew upgrade` |
| 预览无用依赖 | `brew autoremove --dry-run` |
| 预览清理、实际清理 | `brew cleanup --dry-run`、`brew cleanup` |
| 排错 | `brew doctor`、`brew config` |

`update` 更新的是软件描述，`upgrade` 才升级已安装软件。通常这样就够了：

```bash
brew update
brew outdated
brew upgrade
```

编译器、数据库等不方便马上升级的工具，可以先只升级其他包，或临时 pin：

```bash
brew pin node
brew unpin node
```

Pin 不是版本锁文件，也不能用来安装任意历史版本。

## 3. 常用开发工具

按需选，不必整行全装：

```bash
brew install jq ripgrep fd fzf bat eza zoxide neovim
brew install python node go openjdk
brew install cmake pkgconf
```

几个容易踩的点：

* `keg-only` 表示不会链接进默认前缀下的 `bin` 等目录。先看 `brew info` 的提示，再决定是否改 PATH。
* OpenJDK 的安装提示用 `brew info openjdk` 查看；也可以直接运行 `"$(brew --prefix openjdk)/bin/java" --version`。
* `pkgconf` 提供 `pkg-config` 命令。
* Homebrew 的新版本 Python 遵循 externally managed 规则，项目依赖放进虚拟环境，不全局 `pip install`。

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install requests
```

内核、驱动、系统编译依赖仍用发行版包管理器；Python、Node、Java 项目内部的依赖则交给各自的项目工具。

## 4. 用 Brewfile 搬家

在当前目录导出清单：

```bash
brew bundle dump
```

已有 Brewfile 且确实要覆盖时才加 `--force`。新机器上查看清单，再安装：

```bash
brew bundle check --verbose
brew bundle install
```

也可以用全局清单：

```bash
brew bundle dump --global
brew bundle install --global
```

Brewfile 记录要装哪些工具，不是精确版本 lockfile。`brew bundle install` 默认也会升级已安装项；只想补齐缺少的软件时：

```bash
brew bundle install --no-upgrade
```

项目锁文件、配置和数据库还要单独保留。注意 `brew cleanup` 清理旧版本与缓存，而 **`brew bundle cleanup` 会移除清单之外的软件**，不是同一回事。

## 5. 服务、代理与排错

### 服务

对于提供服务定义的软件：

```bash
brew services list
brew services info redis
brew services start redis
brew services stop redis
```

Linux 上默认管理当前用户的 systemd 服务，一般在登录时启动；系统级服务与开机启动是另一种用法，见 [brew services](https://docs.brew.sh/Manpage#services-subcommand)。数据库的数据目录不会因为导出了 Brewfile 就自动备份。

### 代理

在当前 shell 设置代理，地址和端口换成自己的：

```bash
export http_proxy="http://127.0.0.1:7890"
export https_proxy="$http_proxy"
```

不再需要时：

```bash
unset http_proxy https_proxy
```

### 排错与卸载

先看 `brew doctor`、`brew config` 和 `brew info <formula>`。下载失败检查网络；大量源码编译检查默认前缀与平台支持；命令版本不对则检查 PATH。`doctor` 的 warning 是排查线索，不必为了消除提示删除系统软件。

卸载 Homebrew 按[官方 FAQ](https://docs.brew.sh/FAQ#how-do-i-uninstall-homebrew)操作，先保留 Brewfile 和需要的数据。

## 参考链接

* [Homebrew on Linux](https://docs.brew.sh/Homebrew-on-Linux)
* [安装说明](https://docs.brew.sh/Installation)
* [命令手册](https://docs.brew.sh/Manpage)
* [Bundle 与 Brewfile](https://docs.brew.sh/Brew-Bundle-and-Brewfile)
* [Homebrew 与 Python](https://docs.brew.sh/Homebrew-and-Python)
