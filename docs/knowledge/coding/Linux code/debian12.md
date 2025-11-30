---
title: Debian 12 指令大全
date: 2025-11-23 23:15
order: 2
---
# Debian 12 指令大全

## 1. Debian 常用核心指令 (高频精简版)

| 指令 | 描述 | 常用示例 |
| :--- | :--- | :--- |
| **apt update** | 更新软件包索引 | `sudo apt update` (安装软件前必做) |
| **apt upgrade** | 升级所有已安装软件包 | `sudo apt upgrade` (保持系统最新) |
| **apt install** | 安装软件包 | `sudo apt install nginx` |
| **apt remove** | 卸载软件 (保留配置) | `sudo apt remove vim` |
| **apt purge** | 彻底卸载 (删除配置) | `sudo apt purge vim` |
| **apt autoremove**| 清理不再需要的依赖包 | `sudo apt autoremove` (清理垃圾) |
| **systemctl** | 管理系统服务 | `sudo systemctl restart nginx` |
| **journalctl** | 查看系统日志 | `journalctl -u nginx` (查看特定服务日志) |
| **dpkg -i** | 安装本地 .deb 包 | `sudo dpkg -i package.deb` |
| **dpkg -l** | 列出已安装的包 | `dpkg -l | grep ssh` |
| **update-alternatives**| 管理软件版本优先级 | `sudo update-alternatives --config editor` |

---

## 2. Debian 12 全面管理指令 (分类速查)

### 2.1 高级包管理 (APT - Advanced Package Tool)
Debian 系发行版的核心，替代了旧的 `apt-get`，命令更人性化。

| 指令 | 描述 |
| :--- | :--- |
| `apt update` | 从源 (sources.list) 获取最新的软件列表 |
| `apt upgrade` | 升级系统中的软件包 (保守策略，不删除包) |
| `apt full-upgrade`| 全面升级 (可能为了解决依赖而删除某些包) |
| `apt install <pkg>`| 安装指定软件 |
| `apt reinstall <pkg>`| 重新安装指定软件 (修复损坏) |
| `apt remove <pkg>` | 卸载软件，但保留配置文件 |
| `apt purge <pkg>` | 卸载软件，并删除配置文件 (彻底清理) |
| `apt autoremove` | 自动删除不再被依赖的库文件 |
| `apt search <kw>` | 搜索软件库中的包 |
| `apt show <pkg>` | 显示软件包的详细信息 (版本、依赖、大小) |
| `apt list --installed`| 列出所有已安装的包 |
| `apt edit-sources` | 编辑 `/etc/apt/sources.list` 源文件 |

### 2.2 底层包管理 (DPKG - Debian Package)
用于处理本地 `.deb` 文件，是 APT 的底层工具。

| 指令 | 描述 |
| :--- | :--- |
| `dpkg -i <file.deb>`| 安装本地 .deb 软件包 |
| `dpkg -r <pkg>` | 卸载软件包 |
| `dpkg -P <pkg>` | 彻底清除软件包及配置 |
| `dpkg -l` | 列出当前系统所有已安装软件简报 |
| `dpkg -s <pkg>` | 查看已安装软件的状态信息 |
| `dpkg -L <pkg>` | 查看软件安装到了哪些目录 (列出文件清单) |
| `dpkg -S <file>` | 反查某个文件属于哪个软件包 |
| `dpkg --configure -a`| 修复解压但未配置的包 (安装失败时常用) |

### 2.3 系统服务与日志 (Systemd)
Debian 12 默认使用 Systemd 进行初始化和服务管理。

| 指令 | 描述 |
| :--- | :--- |
| `systemctl start <svc>` | 启动服务 |
| `systemctl stop <svc>` | 停止服务 |
| `systemctl restart <svc>`| 重启服务 |
| `systemctl reload <svc>` | 重载配置 (不中断服务) |
| `systemctl status <svc>` | 查看服务运行状态 |
| `systemctl enable <svc>` | 设置开机自启 |
| `systemctl disable <svc>`| 取消开机自启 |
| `systemctl list-units` | 列出正在运行的单元 |
| `journalctl` | 查看所有系统日志 |
| `journalctl -u <svc>` | 查看指定服务的日志 |
| `journalctl -f` | 实时滚动查看最新日志 (类似 tail -f) |
| `journalctl --vacuum-time=1w`| 清理一周前的日志 |

### 2.4 Debian 专属配置与辅助工具
Debian 特有的管理生态工具。

| 指令 | 描述 |
| :--- | :--- |
| `dpkg-reconfigure <pkg>`| 重新配置已安装的包 (如重设 locales, tzdata) |
| `update-alternatives` | 管理多版本软件的默认指向 (如 Python, Java, Editor) |
| `tasksel` | 菜单化安装任务集 (如一键装桌面环境、Web服务器集) |
| `hostnamectl` | 修改主机名 (Systemd 工具) |
| `timedatectl` | 设置时区和时间同步 |
| `localectl` | 设置系统语言环境 (Locale) |

### 2.5 防火墙 (Debian 12)
Debian 12 默认后端为 `nftables`，但用户常安装 `ufw` 作为前端。

| 指令 | 描述 |
| :--- | :--- |
| `apt install ufw` | 安装 UFW 防火墙 (建议初学者使用) |
| `ufw enable` | 开启防火墙 |
| `ufw allow 22` | 允许 SSH 端口 |
| `ufw allow 80/tcp` | 允许 HTTP 端口 |
| `ufw status` | 查看防火墙状态 |
| `nft list ruleset` | (原生) 查看 nftables 规则集 |

### 2.6 网络配置 (Network)
Debian 12 推荐使用 `ip` 命令，配置文件通常位于 `/etc/network/interfaces`。

| 指令 | 描述 |
| :--- | :--- |
| `ip addr` | 查看网卡 IP 地址 (替代 ifconfig) |
| `ip route` | 查看路由表 |
| `ip link set eth0 up` | 启用网卡 |
| `ss -tuln` | 查看监听端口 (替代 netstat) |
| `cat /etc/network/interfaces`| 查看静态网络配置文件 |