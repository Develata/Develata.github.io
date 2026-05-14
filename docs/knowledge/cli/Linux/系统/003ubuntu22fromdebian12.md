---
title: Ubuntu 22.04 LTS 独有指令集
date: 2025-11-23 23:15
order: 3
---
# Ubuntu 22.04 LTS 独有指令集

> **注**：此处重点列出 Ubuntu 22.04 引入的、区别于 Debian 12 和原生 Linux 内核的特色管理指令。

## 1. Ubuntu 核心专属指令 (Unique Ecosystem)

这些指令构成了 Ubuntu 区别于其他 Linux 发行版（尤其是 Debian）的核心体验。

### 1.1 Snap 包管理 (Containerized Packages)
*Ubuntu 强推的通用包格式，与系统隔离，包含依赖。Debian 默认不预装 Snap。*

| 指令 | 语法结构 | 描述 | 与 Debian/Linux 差异 |
| :--- | :--- | :--- | :--- |
| **snap install** | `snap install <包名> [--classic]` | 安装应用 (支持沙盒/经典模式) | **独有**。Debian 使用 apt 或 flatpak。 |
| **snap refresh** | `snap refresh` | 更新所有 Snap 应用 | **独有**。独立于 APT 更新机制。 |
| **snap list** | `snap list` | 列出已安装的 Snap 应用 | **独有**。 |
| **snap revert** | `snap revert <包名>` | 回滚应用到上个版本 | **独有**。原生 Linux 无此一键回滚功能。 |
| **snap switch** | `snap switch --channel=<分支> <包>` | 切换软件通道 (stable/beta/edge) | **独有**。方便尝鲜开发版。 |

### 1.2 网络配置 (Netplan)
*Ubuntu 17.10+ 开始引入的声明式网络配置工具，取代了传统的 `ifupdown`。*

| 指令 | 语法结构 | 描述 | 与 Debian/Linux 差异 |
| :--- | :--- | :--- | :--- |
| **netplan apply**| `netplan apply` | 应用 YAML 配置文件 | **差异**。Debian 默认读取 `/etc/network/interfaces`。 |
| **netplan try** | `netplan try` | 尝试配置，失败自动回滚 | **独有**。防止配置错误导致失联的安全机制。 |
| **netplan ip** | `netplan ip leases <接口>` | 查看 DHCP 租约信息 | **差异**。替代了 `dhclient` 的查看方式。 |

### 1.3 驱动与硬件 (Hardware Enablement)
*Ubuntu 特有的硬件驱动自动化管理工具。*

| 指令 | 语法结构 | 描述 | 与 Debian/Linux 差异 |
| :--- | :--- | :--- | :--- |
| **ubuntu-drivers**| `ubuntu-drivers devices` | 识别硬件并推荐驱动 | **独有**。Debian 需手动修改源并查找驱动包。 |
| **ubuntu-drivers**| `ubuntu-drivers autoinstall` | 自动安装推荐的闭源驱动 | **独有**。极大简化了显卡/网卡驱动安装。 |
| **hwe-support** | `hwe-support-status` | 检查硬件启用(HWE)内核状态 | **独有**。针对 LTS 版特供的新内核支持检测。 |

### 1.4 系统维护与服务 (Maintenance)
*Ubuntu 商业化及易用性工具。*

| 指令 | 语法结构 | 描述 | 与 Debian/Linux 差异 |
| :--- | :--- | :--- | :--- |
| **do-release-upgrade**| `do-release-upgrade` | 升级到下一个发行版 | **差异**。Debian 用户通常手动修改 `sources.list`。 |
| **add-apt-repository**| `add-apt-repository ppa:<用户>/<库>`| 添加 PPA 软件源 | **差异**。Debian 虽可安装此工具，但官方不通过 PPA 分发软件。 |
| **pro** (旧称 ua) | `pro attach <token>` | 启用 Ubuntu Pro 服务 | **独有**。用于获取 ESM (扩展安全维护) 和实时内核补丁。 |
| **pro** | `pro status` | 查看订阅服务状态 | **独有**。 |

---

## 2. ⚡️ 差异对照表：Ubuntu 22.04 vs Debian 12 vs 原生 Linux

这是你需要重点关注的部分，展示了在 Ubuntu 中必须改变的操作习惯。

| 功能场景 | **Ubuntu 22.04 LTS 指令** | **Debian 12 指令** | **原生 Linux / 旧习惯** | 差异说明 |
| :--- | :--- | :--- | :--- | :--- |
| **网络配置生效** | `netplan apply` | `systemctl restart networking` <br> 或 `ifup <接口>` | `service network restart` | Ubuntu 配置文件是 YAML 格式，Debian 是文本格式。 |
| **安装显卡驱动** | `ubuntu-drivers autoinstall` | `apt install nvidia-driver` <br> (需先改源开启 non-free) | 手动编译或下载 `.run` 文件 | Ubuntu 全自动；Debian 半手动且严格区分自由软件。 |
| **跨版本升级** | `do-release-upgrade` | 修改 `/etc/apt/sources.list` <br> 然后 `apt full-upgrade` | 无统一标准 | Ubuntu 封装了升级脚本，更安全。 |
| **防火墙** | `ufw enable` (默认预装) | `nft` (原生) 或需手装 `ufw` | `iptables` (旧) / `nftables` | Ubuntu 默认使用 UFW 简化防火墙，Debian 偏向底层 nftables。 |
| **Root 权限** | `sudo <命令>` (默认) | `su -` (默认) | `su` | Ubuntu 默认禁用 root 账户登录，强制 sudo；Debian 安装时可选。 |
| **软件源管理** | `add-apt-repository` | 手动编辑 `/etc/apt/sources.list` | 无 | Ubuntu 依赖 Launchpad PPA 生态。 |
| **系统日志** | `journalctl` (主要) <br> 保留了 `/var/log/syslog` | `journalctl` (唯一) <br> **删除了** `/var/log/syslog` | `syslogd` | Ubuntu 22.04 仍保留了文本日志文件兼容旧习，Debian 12 默认已删除。 |
| **Python 环境** | `python3` (受 PEP 668 限制) | `python3` (受 PEP 668 限制) | `pip install` | 两者都限制了直接用 pip 安装全局包，必须用 `apt` 或 `venv`。 |