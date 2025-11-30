---
title: Ubuntu 22.04 LTS 指令大全
date: 2025-11-23 23:15
order: 3
---
# Ubuntu 22.04 LTS 指令大全

## 1. Ubuntu 常用核心指令 (高频精简版)

| 指令 | 描述 | 常用示例 |
| :--- | :--- | :--- |
| **sudo** | 获取管理员权限 (Ubuntu 默认禁用 root 登录) | `sudo -i` (切换为 root) |
| **apt update** | 更新软件源索引 | `sudo apt update` |
| **apt upgrade** | 升级 APT 软件包 | `sudo apt upgrade` |
| **snap install** | 安装 Snap 格式应用 (Ubuntu 特色) | `sudo snap install certbot --classic` |
| **netplan apply**| 应用网络配置 (Ubuntu Server 默认) | `sudo netplan apply` |
| **ufw** | 简单防火墙管理 | `sudo ufw allow 80` |
| **add-apt-repository**| 添加第三方 PPA 仓库 | `sudo add-apt-repository ppa:user/repo` |
| **ubuntu-drivers**| 自动安装硬件驱动 (如显卡) | `sudo ubuntu-drivers autoinstall` |
| **do-release-upgrade**| 升级到下一个 Ubuntu 发行版 | `sudo do-release-upgrade` |
| **systemctl** | 管理服务 | `sudo systemctl status ssh` |

---

## 2. Ubuntu 22.04 全面管理指令 (分类速查)

### 2.1 Snap 包管理 (Snap Store)
Ubuntu 核心差异点，用于安装容器化的软件包，版本通常比 APT 更新。

| 指令 | 描述 |
| :--- | :--- |
| `snap install <pkg>` | 安装 Snap 包 |
| `snap remove <pkg>` | 卸载 Snap 包 |
| `snap refresh` | 更新所有 Snap 包 |
| `snap list` | 列出已安装的 Snap 包 |
| `snap find <kw>` | 搜索 Snap 商店中的软件 |
| `snap changes` | 查看最近的系统更改/更新记录 |
| `snap switch --channel`| 切换软件分支 (如 stable/edge) |

### 2.2 APT 与 PPA 管理 (Advanced Package Tool)
Ubuntu 在 Debian APT 的基础上增加了 PPA (Personal Package Archives) 管理，方便安装最新软件。

| 指令 | 描述 |
| :--- | :--- |
| `apt update` | 更新软件源列表 |
| `apt upgrade` | 升级已安装的软件包 |
| `apt install <pkg>` | 安装软件包 |
| `apt remove <pkg>` | 卸载软件 (保留配置) |
| `apt purge <pkg>` | 彻底卸载 (删除配置) |
| `apt autoremove` | 自动清理无用依赖 |
| `add-apt-repository`| 添加 PPA 源 (例如: `ppa:ondrej/php`) |
| `add-apt-repository -r`| 移除 PPA 源 |
| `apt-mark hold <pkg>`| 锁定软件包版本，防止被升级 |
| `apt-mark unhold` | 解锁软件包 |

### 2.3 网络配置 (Netplan)
Ubuntu 18.04+ (尤其是 Server 版) 使用 Netplan 替代了传统的 `/etc/network/interfaces`。配置文件位于 `/etc/netplan/*.yaml`。

| 指令 | 描述 |
| :--- | :--- |
| `netplan apply` | 应用 `/etc/netplan/` 下的配置更改 |
| `netplan try` | 尝试应用配置，若网络断开则自动回滚 (安全) |
| `netplan generate` | 生成后端配置 (通常由 apply 自动调用) |
| `ip a` | 查看 IP 地址 (通用) |
| `resolvectl status` | 查看 DNS 解析状态 (Systemd-resolved) |

### 2.4 防火墙管理 (UFW - Uncomplicated Firewall)
Ubuntu 默认安装并推荐使用的防火墙前端。

| 指令 | 描述 |
| :--- | :--- |
| `ufw enable` | 启用防火墙 (默认拒绝入站，允许出站) |
| `ufw disable` | 禁用防火墙 |
| `ufw allow <port>` | 允许端口 (如 `ufw allow 22/tcp`) |
| `ufw deny <port>` | 拒绝端口 |
| `ufw delete allow <port>`| 删除规则 |
| `ufw status` | 查看防火墙状态 |
| `ufw status numbered`| 带编号查看状态 (方便删除特定规则) |
| `ufw reload` | 重载配置 |

### 2.5 系统维护与驱动 (Maintenance & Drivers)
Ubuntu 独有的硬件和系统维护工具。

| 指令 | 描述 |
| :--- | :--- |
| `ubuntu-drivers devices`| 列出系统需要的驱动程序 (如 NVIDIA) |
| `ubuntu-drivers autoinstall`| 自动安装推荐的驱动程序 |
| `do-release-upgrade` | 升级操作系统版本 (如 20.04 -> 22.04) |
| `pro attach <token>` | 绑定 Ubuntu Pro 订阅 (用于 ESM 扩展安全更新) |
| `lsb_release -a` | 查看详细的发行版版本信息 |
| `update-manager -d` | 打开图形化更新管理器 (桌面版) |

### 2.6 服务管理 (Systemd)
与 Debian 一致，但 Ubuntu 用户有时仍习惯用 `service` 命令（它是 systemctl 的封装）。

| 指令 | 描述 |
| :--- | :--- |
| `systemctl start <svc>` | 启动服务 |
| `systemctl stop <svc>` | 停止服务 |
| `systemctl restart <svc>`| 重启服务 |
| `systemctl enable <svc>` | 开机自启 |
| `systemctl is-active <svc>`| 检查服务是否正在运行 |
| `service <svc> start` | 旧式命令 (兼容，映射到 systemctl) |