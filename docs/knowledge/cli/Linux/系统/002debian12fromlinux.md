---
title: Debian 12 原生指令补全
date: 2025-11-23 23:15
order: 2
---
# Debian 12 原生指令补全

> **注**：此处仅包含Debian12与Linux原生相比的差异指令，不含第三方应用。

## Debian 12 专属指令 (Base System)

这些是 Debian 基础系统中特有的核心管理指令。

| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| **apt** | `apt install <包名>` | 现代化包管理 (安装) |
| **apt** | `apt update` | 刷新软件源列表 |
| **apt** | `apt purge <包名>` | 彻底卸载 (含配置) |
| **dpkg** | `dpkg -i <文件.deb>` | 安装本地包文件 |
| **systemctl**| `systemctl start <服务>` | 启动系统服务 |
| **systemctl**| `systemctl enable <服务>` | 设置开机自启 |
| **journalctl**| `journalctl -u <服务>` | 查看特定服务日志 |
| **adduser** | `adduser <用户名>` | 交互式添加用户 (Debian 脚本) |
| **tasksel** | `tasksel` | 菜单化选择任务集 |
| **dpkg-reconfigure**| `dpkg-reconfigure <包名>` | 重新配置已安装软件 |

---

## ⚠️ Debian 12 中“失效/变更”的 Linux 指令

在 Debian 12 (Bookworm) 最小化安装中，以下传统指令可能无法使用。

| 传统 Linux 指令 | Debian 12 现状 | 替代/新指令语法 |
| :--- | :--- | :--- |
| **ifconfig** | 被弃用 (未安装) | `ip addr` |
| **netstat** | 被弃用 (未安装) | `ss -tuln` (查看端口) |
| **route** | 被弃用 (未安装) | `ip route` |
| **pip** | 被限制 (PEP 668) | `apt install python3-<库>` 或 `python3 -m venv <目录>` |
| **syslog (文件)**| 不存在 (`rsyslog` 缺省) | `journalctl` (直接查看日志库) |
| **scp** | 协议变更 (SFTP) | `scp -O <源> <目标>` (若需强制旧协议) |
| **rc.local** | 不自动运行 | 需编写 `systemd` 服务单元 |