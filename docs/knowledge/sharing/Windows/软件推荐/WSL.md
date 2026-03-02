---
title: WSL
date: 2026-3-1
order: 4
---

# WSL 使用指南
[WSL github repo](https://github.com/microsoft/WSL)

## 1. 什么是 WSL

WSL（Windows Subsystem for Linux）是微软官方提供的兼容层，让你在 Windows 上直接运行完整的 GNU/Linux 环境——无需虚拟机，无需双系统。

- **原生集成**：可在 Windows 文件系统与 Linux 互相访问，共享网络。
- **低开销**：WSL 2 基于轻量级 Hyper-V VM，启动快、内存占用低。
- **开发首选**：与 VS Code Remote、Docker Desktop 深度集成，是 Windows 开发者的最佳伴侣。

---

## 2. 安装

### 2.1 一行命令安装（推荐）

以**管理员身份**打开 PowerShell 或 Windows Terminal，执行：

```powershell
wsl --install
```

此命令会自动完成：启用必要的 Windows 功能、安装 WSL 2 内核、安装默认发行版（Ubuntu）。**安装完成后需重启**。

> **系统要求**：Windows 10 版本 2004（Build 19041）及以上，或 Windows 11。

### 2.2 安装指定发行版

```powershell
# 查看可用发行版列表
wsl --list --online

# 安装指定发行版（如 Debian、Kali）
wsl --install -d Debian
wsl --install -d kali-linux
```

### 2.3 验证安装

```powershell
wsl --version
wsl --status
wsl -l -v        # 列出已安装发行版及 WSL 版本
```

---

## 3. 常用命令速查

| 目的 | 命令 |
| :--- | :--- |
| 启动默认发行版 | `wsl` |
| 启动指定发行版 | `wsl -d <DistroName>` |
| 查看已安装发行版 | `wsl -l -v` |
| 设置默认发行版 | `wsl --set-default <DistroName>` |
| 停止指定发行版 | `wsl --terminate <DistroName>` |
| 停止所有发行版 | `wsl --shutdown` |
| 更新 WSL 内核 | `wsl --update` |
| 导出发行版备份 | `wsl --export <Distro> <file.tar>` |
| 导入发行版 | `wsl --import <Distro> <InstallDir> <file.tar>` |
| 卸载发行版 | `wsl --unregister <DistroName>` |

---

## 4. 文件系统互操作

### 4.1 从 Windows 访问 Linux 文件

在资源管理器地址栏输入 `\\wsl$` 或 `\\wsl.localhost`，可浏览所有发行版的文件系统。

Linux 文件路径映射示例：

```
\\wsl.localhost\Ubuntu\home\username\project
```

### 4.2 从 Linux 访问 Windows 文件

Windows 的各盘符挂载在 `/mnt/` 下：

```bash
ls /mnt/c/Users
cd /mnt/d/Projects
```

### 4.3 互调命令

```powershell
# 在 PowerShell 中执行 Linux 命令
wsl ls -la /home

# 混合管道
wsl ls -la | findstr ".md"
dir | wsl grep ".md"
```

```bash
# 在 WSL 中调用 Windows 程序
notepad.exe .bashrc
explorer.exe .        # 用资源管理器打开当前目录
code .                # 用 VS Code 打开
```

> **性能提示**：将项目文件放在 Linux 文件系统（`~/projects`）内，而非 `/mnt/c/`，可获得显著更好的 IO 性能。

---

## 5. 配置文件

WSL 有两个配置文件，分别作用于不同范围：

### 5.1 `.wslconfig`（全局，WSL 2 VM 设置）

位于 `%UserProfile%\.wslconfig`（即 `C:\Users\<你的用户名>\.wslconfig`），控制 WSL 2 虚拟机资源。

```ini
# 全局 WSL 2 虚拟机设置
[wsl2]
# 限制内存（默认为物理内存的 50%）
memory=4GB

# 分配虚拟 CPU 数量
processors=4

# 交换空间（默认为 RAM 的 25%）
swap=2GB

# 启用镜像网络（Windows 11 22H2+，让 WSL 与 Windows 共享同一 IP）
# networkingMode=mirrored

[experimental]
# 稀疏 VHD，按需分配磁盘，节省空间
sparseVhd=true
```

修改后执行 `wsl --shutdown` 再重启生效。

### 5.2 `wsl.conf`（per-distro，发行版内部设置）

在 Linux 发行版内编辑 `/etc/wsl.conf`，控制该发行版的行为。

```ini
[boot]
# 启用 systemd（Ubuntu 22.04+ / Debian 推荐开启）
systemd=true

[automount]
# 自动挂载 Windows 盘符
enabled=true
options="metadata,uid=1000,gid=1000,umask=022"

[network]
hostname=my-wsl
generateResolvConf=true

[interop]
# 允许从 WSL 调用 Windows 程序
enabled=true
appendWindowsPath=true
```

---

## 6. 开发环境最佳实践

### 6.1 与 VS Code 集成

安装 VS Code 扩展 **Remote - WSL**（或 Remote Development 包），然后在 WSL 终端中：

```bash
code .
```

VS Code 将在 WSL 内运行服务器，完全原生 Linux 开发体验。

### 6.2 与 Docker Desktop 集成

Docker Desktop 支持 WSL 2 后端。在 Docker Desktop 设置中启用 **Use the WSL 2 based engine**，并在 Resources → WSL Integration 中勾选目标发行版。之后在 WSL 内即可直接使用 `docker` 命令。

### 6.3 Git 凭据共享

让 WSL 内的 Git 使用 Windows 的凭据管理器，避免重复登录：

```bash
git config --global credential.helper "/mnt/c/Program\ Files/Git/mingw64/bin/git-credential-manager.exe"
```

---

## 7. 故障排查

```powershell
# 查看 WSL 版本与内核信息
wsl --version

# 更新 WSL 内核
wsl --update

# 强制重置 WSL 2 内核（修复异常）
wsl --update --rollback

# 重启所有 WSL 实例
wsl --shutdown
```

常见问题：

| 现象 | 原因 / 解决 |
| :--- | :--- |
| `wsl --install` 报错 0x800701bc | WSL 内核未更新，运行 `wsl --update` |
| 发行版启动后立即退出 | 尝试 `wsl --shutdown` 再重启；或检查 `wsl.conf` 语法 |
| 访问 `/mnt/c` 性能慢 | 将项目迁移到 Linux 文件系统内（`~/`） |
| 网络无法访问 | 执行 `wsl --shutdown` 重启；或检查 `.wslconfig` 网络设置 |

---

## 参考链接

- [WSL 官方文档](https://learn.microsoft.com/windows/wsl/)
- [WSL GitHub 仓库](https://github.com/microsoft/WSL)
- [WSL 配置参考（.wslconfig & wsl.conf）](https://learn.microsoft.com/windows/wsl/wsl-config)