---
title: Ubuntu 22.04 LTS 指令大全
date: 2025-11-23 23:15
order: 3
---
# Ubuntu 22.04 LTS 指令大全

## 1. 常用核心指令 (高频精简版)

| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| **sudo** | `sudo <命令>` | 以管理员权限执行命令 |
| **apt update** | `sudo apt update` | 更新软件源索引 |
| **apt upgrade** | `sudo apt upgrade` | 升级已安装的软件包 |
| **snap install** | `sudo snap install <包名>` | 安装 Snap 应用 (Ubuntu 特色) |
| **ufw** | `sudo ufw allow <端口>` | 开放防火墙端口 |
| **netplan** | `sudo netplan apply` | 应用网络配置更改 |
| **systemctl** | `sudo systemctl restart <服务>` | 重启系统服务 |
| **ip addr** | `ip addr` | 查看 IP 地址 |
| **ssh** | `ssh <用户>@<IP>` | 远程登录 |
| **reboot** | `sudo reboot` | 重启系统 |

---

## 2. Ubuntu 22.04 全面指令 (分类速查)

### 2.1 高级包管理 (APT & PPA)
*Ubuntu 的传统包管理，支持 PPA 第三方源。*

| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| `apt update` | `sudo apt update` | 刷新软件源列表 |
| `apt upgrade` | `sudo apt upgrade` | 升级所有软件包 |
| `apt install` | `sudo apt install <包名>` | 安装软件包 |
| `apt remove` | `sudo apt remove <包名>` | 卸载软件 (保留配置) |
| `apt purge` | `sudo apt purge <包名>` | 彻底卸载 (删除配置) |
| `apt autoremove`| `sudo apt autoremove` | 清理无用的依赖包 |
| `apt search` | `apt search <关键词>` | 搜索软件包 |
| `add-apt-repository`| `sudo add-apt-repository <PPA源>` | 添加第三方 PPA 仓库 |
| `add-apt-repository`| `sudo add-apt-repository -r <PPA源>`| 移除 PPA 仓库 |
| `apt-mark hold` | `sudo apt-mark hold <包名>` | 锁定版本禁止自动升级 |

### 2.2 Snap 包管理 (Snap Store)
*Ubuntu 核心集成的容器化包管理系统。*

| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| `snap install` | `sudo snap install <包名>` | 安装应用 |
| `snap install` | `sudo snap install <包> --classic`| 安装需要经典模式权限的应用 |
| `snap remove` | `sudo snap remove <包名>` | 卸载应用 |
| `snap refresh` | `sudo snap refresh` | 更新所有 Snap 应用 |
| `snap list` | `snap list` | 列出已安装的 Snap 应用 |
| `snap find` | `snap find <关键词>` | 搜索商店中的应用 |
| `snap revert` | `sudo snap revert <包名>` | 回滚应用到上一个版本 |
| `snap services`| `snap services` | 查看 Snap 应用的服务状态 |

### 2.3 网络配置 (Netplan)
*Ubuntu 18.04+ 标准的声明式网络配置工具。*

| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| `netplan apply` | `sudo netplan apply` | 应用配置 (无需重启) |
| `netplan try` | `sudo netplan try` | 尝试配置，失败自动回滚 (安全) |
| `netplan generate`| `sudo netplan generate` | 生成后端配置文件 |
| `netplan ip` | `netplan ip leases <接口>` | 查看 DHCP 租约详情 |
| `ip addr` | `ip addr show` | 查看当前 IP 配置 |
| `resolvectl` | `resolvectl status` | 查看 DNS 解析状态 |

### 2.4 防火墙管理 (UFW)
*Ubuntu 默认预装的简易防火墙配置工具。*

| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| `ufw enable` | `sudo ufw enable` | 启用防火墙 |
| `ufw disable` | `sudo ufw disable` | 禁用防火墙 |
| `ufw allow` | `sudo ufw allow <端口/服务>` | 允许入站连接 (如 22/tcp) |
| `ufw deny` | `sudo ufw deny <端口>` | 拒绝入站连接 |
| `ufw delete` | `sudo ufw delete allow <端口>` | 删除某条规则 |
| `ufw status` | `sudo ufw status numbered` | 查看带编号的状态列表 |
| `ufw reload` | `sudo ufw reload` | 重载防火墙配置 |

### 2.5 驱动与硬件管理 (Hardware)
*Ubuntu 特有的硬件支持工具。*

| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| `ubuntu-drivers`| `ubuntu-drivers devices` | 列出建议的专有驱动 |
| `ubuntu-drivers`| `ubuntu-drivers autoinstall` | 自动安装推荐驱动 |
| `lshw` | `sudo lshw -short` | 查看硬件列表简报 |
| `lsusb` | `lsusb` | 查看 USB 设备 |
| `lspci` | `lspci` | 查看 PCI 设备 (显卡/网卡) |

### 2.6 系统维护与更新 (System Maint)
| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| `do-release-upgrade`| `sudo do-release-upgrade` | 升级到新版 Ubuntu (如 22.04->24.04) |
| `pro` | `sudo pro attach <token>` | 启用 Ubuntu Pro (ESM 更新) |
| `lsb_release` | `lsb_release -a` | 查看系统版本详情 |
| `shutdown` | `sudo shutdown -h now` | 立即关机 |
| `reboot` | `sudo reboot` | 重启系统 |

### 2.7 服务管理 (Systemd)
| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| `systemctl start` | `sudo systemctl start <服务>` | 启动服务 |
| `systemctl stop` | `sudo systemctl stop <服务>` | 停止服务 |
| `systemctl restart`| `sudo systemctl restart <服务>`| 重启服务 |
| `systemctl enable` | `sudo systemctl enable <服务>` | 开机自启 |
| `systemctl status` | `systemctl status <服务>` | 查看运行状态 |
| `journalctl` | `journalctl -u <服务> -f` | 实时查看服务日志 |