---
title: WSL
date: 2026-10-14
order: 4
---

# WSL 使用指南

[WSL](https://learn.microsoft.com/windows/wsl/) 可以在 Windows 里运行 Linux 发行版。日常开发优先选 WSL 2：它通过轻量虚拟机运行真实 Linux 内核，不是双系统，也不是完全没有虚拟机。

## 1. 安装与更新

简化安装命令要求 Windows 10 2004（Build 19041）及以上，或 Windows 11。在管理员 PowerShell 中运行：

```powershell
wsl --install
```

按提示重启，首次打开发行版时创建 Linux 用户名和密码。它们独立于 Windows 账号。

默认安装 Ubuntu。想选其他发行版：

```powershell
wsl --list --online
wsl --install -d Debian
```

如果已有 WSL，`wsl --install` 只显示帮助，也可以用上面的 `-d` 显式安装。常规下载卡住时试：

```powershell
wsl --install --web-download -d Ubuntu
```

安装后检查：

```powershell
wsl --update
wsl --version
wsl --status
wsl -l -v
```

`wsl --version` 看 WSL 软件版本，`wsl -l -v` 看各发行版运行在 WSL 1 还是 WSL 2。老的系统内置 WSL 可能不认识 `--version`，先按[官方安装说明](https://learn.microsoft.com/windows/wsl/install)更新。

## 2. 常用命令

以下在 PowerShell 中执行，`<Distro>` 换成 `wsl -l -v` 显示的名称。

| 操作 | 命令 |
| :--- | :--- |
| 启动默认发行版 | `wsl` |
| 启动指定发行版 | `wsl -d <Distro>` |
| 设置默认发行版 | `wsl --set-default <Distro>` |
| 新安装默认用 WSL 2 | `wsl --set-default-version 2` |
| 转换已有发行版为 WSL 2 | `wsl --set-version <Distro> 2` |
| 停止一个发行版 | `wsl --terminate <Distro>` |
| 停止全部发行版和 WSL 2 虚拟机 | `wsl --shutdown` |
| 导出 | `wsl --export <Distro> <file.tar>` |
| 导入 | `wsl --import <Distro> <InstallDir> <file.tar>` |
| 删除发行版及其数据 | `wsl --unregister <Distro>` |

**`--unregister` 不是重启，会删除该发行版的数据。** 版本转换或删除前先导出需要保留的内容；Windows 盘、外部挂载和应用数据还要分别备份。

在 Linux shell 中调用这些管理命令时写 `wsl.exe`，例如 `wsl.exe -l -v`。

## 3. 文件放在哪里

原则很简单：**Linux 工具处理的项目放 Linux 文件系统，Windows 工具处理的项目放 Windows 文件系统**。

```text
Linux 项目：~/projects/my-project
Windows 项目：C:\Users\你的用户名\Projects\my-project
```

在 WSL 中访问 C 盘：

```bash
cd /mnt/c
```

在资源管理器地址栏查看 Linux 文件：

```text
\\wsl$\Ubuntu\home
```

也可以从 WSL 当前目录打开资源管理器：

```bash
explorer.exe .
```

不要直接修改发行版的 `ext4.vhdx`。Linux 下的 Git、依赖安装和编译如果在 `/mnt/c` 很慢，优先把项目搬到 `~/projects`。

### 命令互调

```powershell
# 从 PowerShell 执行 Linux 命令
wsl -d Ubuntu -- bash -lc 'uname -a'
```

Windows 程序不会自动把 Linux 路径转换成 Windows 路径。需要用记事本编辑 Linux 文件时，显式转换：

```bash
notepad.exe "$(wslpath -w ~/.bashrc)"
```

## 4. 网络与镜像模式

默认 NAT 模式下：

* Windows 访问 WSL 内开发服务，通常直接用 `localhost:端口`。
* WSL 访问 Windows 服务，通常使用 Windows 主机 IP；服务也要监听这个地址并允许对应防火墙流量。

在 WSL 内查询 NAT 网关地址：

```bash
ip route show default | awk '{print $3}'
```

Windows 11 22H2 及以上可以尝试 mirrored networking，改善 localhost 双向访问、IPv6 和 VPN 兼容性。在 `%UserProfile%\.wslconfig` 中添加：

```ini
[wsl2]
networkingMode=mirrored
```

保存工作后，在 PowerShell 中执行 `wsl --shutdown`，重新打开发行版。镜像模式不等于关闭 Windows / Hyper-V 防火墙；局域网访问仍要检查服务监听地址和规则。

## 5. 两个配置文件

| 文件 | 位置 | 用途 |
| :--- | :--- | :--- |
| `.wslconfig` | Windows 用户目录 | WSL 2 虚拟机的内存、CPU、网络等全局设置 |
| `wsl.conf` | Linux 内 `/etc/wsl.conf` | 单个发行版的用户、挂载、systemd、互操作设置 |

例如限制资源，以下数值只是示例，按机器配置调整；已有 `[wsl2]` 时合并到同一节：

```ini
[wsl2]
memory=8GB
processors=4
swap=4GB
```

需要让 Windows 盘保存 Linux 权限元数据时，在 `/etc/wsl.conf` 中添加：

```ini
[automount]
options="metadata,umask=022"
```

不写死 `uid=1000,gid=1000`，让它沿用发行版默认用户。`metadata` 也不能绕过 Windows 自身的文件权限。

`.wslconfig` 改动用 `wsl --shutdown` 后重新启动；只改某个发行版的 `wsl.conf`，可以用 `wsl --terminate <Distro>`。直接关掉再立刻打开一个终端，不一定已经完成发行版的停止过程。

### systemd

先看是否已经启用：

```bash
ps -p 1 -o comm=
systemctl status
```

未启用且确实需要时，确认使用 WSL 2、WSL 版本至少为 0.67.6，在 `/etc/wsl.conf` 合并：

```ini
[boot]
systemd=true
```

Debian / Ubuntu / Kali 还需安装 `systemd` 和 `systemd-sysv` 包。回到 PowerShell 执行 `wsl --shutdown`，重开后检查。systemd 服务本身不会让 WSL 永久驻留，长期运行的服务器另做安排。

## 6. 开发环境

* **VS Code**：在 Windows 安装 VS Code 和 **WSL** 扩展，再从 WSL 项目目录执行 `code .`，扩展与工具链运行位置更清楚。
* **Docker Desktop**：启用 WSL 2 backend 和目标发行版的 WSL Integration。先用 `docker context ls`、`docker version` 确认连接目标，不要同时装两套 Engine 却不知道 CLI 在操作哪一个。
* **Git / SSH**：Linux 项目优先使用 WSL 内的 Git 和 SSH。需要共用 Windows 凭据时再配置 GCM，不照抄旧教程中的固定安装路径。

## 7. 排错

| 现象 | 先检查 |
| :--- | :--- |
| 安装、内核错误 | `wsl --update`，以及虚拟化是否开启 |
| 配置没有生效 | 文件位置、INI 节名，停止后重新启动 |
| `/mnt/c` 构建慢 | 项目是否应该放 Linux 文件系统 |
| 网络异常 | NAT / mirrored 模式、VPN、服务监听和防火墙 |
| 版本不清楚 | `wsl --version`、`wsl --status`、`wsl -l -v` |

## 参考链接

* [安装](https://learn.microsoft.com/windows/wsl/install) / [基础命令](https://learn.microsoft.com/windows/wsl/basic-commands)
* [文件系统互操作](https://learn.microsoft.com/windows/wsl/filesystems)
* [网络](https://learn.microsoft.com/windows/wsl/networking)
* [高级配置](https://learn.microsoft.com/windows/wsl/wsl-config)
* [systemd](https://learn.microsoft.com/windows/wsl/systemd)
