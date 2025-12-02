---
title: Debian 12 指令大全
date: 2025-11-23 23:15
order: 2
---
# Debian 12 (Bookworm) 指令大全

## 1. 常用核心指令 (高频精简版)

| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| **apt update** | `apt update` | 更新软件包索引 (安装前必做) |
| **apt upgrade** | `apt upgrade` | 升级所有已安装的软件包 |
| **apt install** | `apt install <包名>` | 安装新的软件包 |
| **apt remove** | `apt remove <包名>` | 卸载软件 (保留配置文件) |
| **systemctl** | `systemctl status <服务>` | 查看服务运行状态 |
| **journalctl**| `journalctl -xe` | 查看最近的系统错误日志 |
| **ip addr** | `ip addr` | 查看网卡与IP地址 |
| **ss** | `ss -tuln` | 查看正在监听的端口 |
| **su** | `su -` | 切换到 Root 用户环境 |
| **nano** | `nano <文件>` | 编辑文本文件 (Debian 默认安装) |

---

## 2. Debian 12 全面指令 (分类速查)

### 2.1 高级包管理 (APT - Advanced Package Tool)
*Debian 软件包管理的核心前端。*

| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| `apt update` | `apt update` | 同步 /etc/apt/sources.list 中的源 |
| `apt upgrade` | `apt upgrade` | 安全升级软件包 (不删除现有包) |
| `apt full-upgrade`| `apt full-upgrade` | 全面升级 (可能移除冲突包以解决依赖) |
| `apt install` | `apt install <包名>` | 安装软件包 |
| `apt reinstall` | `apt reinstall <包名>` | 重新安装 (修复文件损坏) |
| `apt remove` | `apt remove <包名>` | 卸载软件 |
| `apt purge` | `apt purge <包名>` | 彻底卸载 (同时删除配置文件) |
| `apt autoremove`| `apt autoremove` | 自动清理不再被依赖的库文件 |
| `apt search` | `apt search <关键词>` | 搜索软件源中的包 |
| `apt show` | `apt show <包名>` | 显示软件包详细信息 |
| `apt list` | `apt list --installed` | 列出已安装的包 |
| `apt edit-sources`| `apt edit-sources` | 编辑软件源配置文件 |

### 2.2 底层包管理 (DPKG)
*用于管理本地 .deb 文件及配置。*

| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| `dpkg -i` | `dpkg -i <文件.deb>` | 安装本地软件包 |
| `dpkg -r` | `dpkg -r <包名>` | 移除软件包 |
| `dpkg -l` | `dpkg -l [关键词]` | 列出系统内已安装的包 |
| `dpkg -L` | `dpkg -L <包名>` | 查看软件包安装了哪些文件 |
| `dpkg -S` | `dpkg -S <文件路径>` | 反查文件属于哪个软件包 |
| `dpkg-reconfigure`| `dpkg-reconfigure <包名>` | 重新配置已安装的包 (Debian 特色) |

### 2.3 系统服务管理 (Systemd)
*Debian 12 的初始化系统。*

| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| `systemctl start` | `systemctl start <服务>` | 启动服务 |
| `systemctl stop` | `systemctl stop <服务>` | 停止服务 |
| `systemctl restart`| `systemctl restart <服务>`| 重启服务 |
| `systemctl reload` | `systemctl reload <服务>` | 重载配置 (不中断连接) |
| `systemctl status` | `systemctl status <服务>` | 查看状态 |
| `systemctl enable` | `systemctl enable <服务>` | 设置开机自启 |
| `systemctl disable`| `systemctl disable <服务>`| 禁止开机自启 |
| `systemctl mask` | `systemctl mask <服务>` | 彻底注销服务 (防止被唤醒) |

### 2.4 日志与时间管理 (System Specifics)
| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| `journalctl` | `journalctl -u <服务>` | 查看指定服务的日志 |
| `journalctl` | `journalctl -f` | 实时滚动查看最新日志 |
| `journalctl` | `journalctl --vacuum-time=7d`| 清理7天前的日志 |
| `timedatectl` | `timedatectl set-timezone <时区>`| 设置系统时区 (如 Asia/Shanghai) |
| `localectl` | `localectl set-locale LANG=<语言>`| 设置系统语言环境 |
| `hostnamectl` | `hostnamectl set-hostname <名字>`| 修改主机名 |

### 2.5 网络管理 (IPRoute2)
*Debian 12 默认不包含 ifconfig/netstat，推荐使用以下指令。*

| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| `ip addr` | `ip addr show` | 显示 IP 地址 |
| `ip link` | `ip link set <网卡> up/down`| 启用/禁用网卡 |
| `ip route` | `ip route show` | 显示路由表 |
| `ip neigh` | `ip neigh` | 显示 ARP 缓存表 |
| `ss` | `ss -tuln` | 查看 TCP/UDP 监听端口 |
| `ss` | `ss -ta` | 查看所有建立的 TCP 连接 |

### 2.6 用户与权限 (User & Group)
*包含 Debian 专有的友好脚本封装。*

| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| `adduser` | `adduser <用户名>` | 交互式创建用户 (推荐) |
| `deluser` | `deluser --remove-home <用户>` | 删除用户及主目录 |
| `addgroup` | `addgroup <组名>` | 创建用户组 |
| `usermod` | `usermod -aG <组> <用户>` | 将用户加入组 (如 sudo 组) |
| `passwd` | `passwd <用户>` | 修改密码 |
| `visudo` | `visudo` | 安全编辑 /etc/sudoers |

### 2.7 辅助工具与系统配置 (Helpers)
| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| `tasksel` | `tasksel` | 菜单化安装常见环境 (桌面/Web服务) |
| `update-alternatives`| `update-alternatives --config <命令>`| 切换软件默认版本 (如 Python/Java) |
| `man` | `man <命令>` | 查看详细手册 |
| `nft` | `nft list ruleset` | 查看 nftables 防火墙规则 (原生) |
| `shutdown` | `shutdown -h now` | 立即关机 |
| `reboot` | `reboot` | 重启系统 |