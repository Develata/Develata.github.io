---
title: iptables 指令大全
date: 2025-12-2 17:30
order: 2
---
# iptables 指令大全

## 1. 常用核心指令 (高频精简版)

| 指令/参数 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| **-L (List)** | `iptables -L -n -v` | 查看所有规则 (数字格式/详细) |
| **-F (Flush)** | `iptables -F` | 清空当前表的所有规则 |
| **-A (Append)** | `iptables -A INPUT -s <IP> -j DROP` | 在链末尾追加规则 (如封禁IP) |
| **-I (Insert)** | `iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT`| 在链首(或指定位置)插入规则 |
| **-D (Delete)** | `iptables -D INPUT <编号>` | 删除指定编号的规则 |
| **-P (Policy)** | `iptables -P INPUT DROP` | 设置默认策略 (如默认拒绝所有入站) |
| **-s (Source)** | `iptables -A INPUT -s 192.168.1.100 -j ACCEPT` | 匹配源 IP 地址 |
| **--dport** | `iptables -A INPUT -p tcp --dport 22 -j ACCEPT` | 匹配目标端口 (需配合 -p) |
| **save** | `iptables-save > /etc/iptables.rules` | 导出/保存当前规则 |
| **restore** | `iptables-restore < /etc/iptables.rules` | 导入/恢复规则 |

---

## 2. iptables 全面指令 (分类速查)

### 2.1 链与表管理 (Chains & Tables)
*管理 Filter(默认), NAT, Mangle 等表及链的操作。*

| 指令/参数 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| **-t** | `iptables -t nat -L` | 指定操作的表 (filter/nat/mangle/raw) |
| **-L** | `iptables -L [链名] [选项]` | 列出规则 (常用参数 -n -v --line-numbers) |
| **-F** | `iptables -F [链名]` | 清空规则 (Flush) |
| **-Z** | `iptables -Z [链名]` | 计数器归零 (Zero) |
| **-N** | `iptables -N <新链名>` | 新建自定义链 |
| **-X** | `iptables -X [链名]` | 删除自定义链 (链必须为空) |
| **-E** | `iptables -E <旧名> <新名>` | 重命名自定义链 |
| **-P** | `iptables -P <链名> <动作>` | 设置链的默认策略 (ACCEPT/DROP) |

### 2.2 规则操作 (Rule Management)
*针对具体规则的增删改。*

| 指令/参数 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| **-A** | `iptables -A <链名> <规则>` | 追加规则到链尾 (Append) |
| **-I** | `iptables -I <链名> [编号] <规则>` | 插入规则 (默认插到第一行) |
| **-D** | `iptables -D <链名> <编号/规则>` | 删除规则 (按编号或匹配内容) |
| **-R** | `iptables -R <链名> <编号> <新规则>` | 替换/修改指定行号的规则 |
| **-C** | `iptables -C <链名> <规则>` | 检查规则是否存在 (Check) |

### 2.3 匹配条件 (Matching Specs)
*定义什么样的流量会被捕获。*

| 指令/参数 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| **-p** | `iptables -A INPUT -p tcp` | 匹配协议 (tcp/udp/icmp/all) |
| **-s** | `iptables -A INPUT -s 192.168.1.0/24` | 匹配源 IP 或网段 (Source) |
| **-d** | `iptables -A OUTPUT -d 8.8.8.8` | 匹配目标 IP 或网段 (Destination) |
| **-i** | `iptables -A INPUT -i eth0` | 匹配入站网卡接口 (Input Interface) |
| **-o** | `iptables -A OUTPUT -o eth0` | 匹配出站网卡接口 (Output Interface) |
| **--sport** | `... -p tcp --sport 22` | 匹配源端口 (Source Port) |
| **--dport** | `... -p tcp --dport 80` | 匹配目标端口 (Destination Port) |
| **--icmp-type**| `... -p icmp --icmp-type 8` | 匹配 ICMP 类型 (如 8 为 ping 请求) |

### 2.4 高级模块匹配 (Modules)
*使用 `-m` 调用扩展模块进行复杂匹配。*

| 指令/参数 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| **-m state** | `... -m state --state ESTABLISHED,RELATED` | 匹配连接状态 (常用：允许已建立的连接) |
| **-m multiport**| `... -m multiport --dports 80,443,22` | 匹配多个不连续端口 |
| **-m mac** | `... -m mac --mac-source <MAC地址>` | 匹配源 MAC 地址 |
| **-m limit** | `... -m limit --limit 5/min` | 速率限制 (防 DDoS 常用) |
| **-m string** | `... -m string --algo bm --string "test"` | 匹配数据包中的字符串 |
| **-m time** | `... -m time --timestart 08:00 --timestop 18:00` | 按时间段匹配 |
| **-m iprange**| `... -m iprange --src-range 192.168.1.5-192.168.1.10`| 匹配 IP 地址范围 |

### 2.5 动作与目标 (Targets -j)
*匹配到流量后执行的动作。*

| 指令/参数 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| **ACCEPT** | `-j ACCEPT` | 允许数据包通过 |
| **DROP** | `-j DROP` | 直接丢弃数据包 (不回传任何信息) |
| **REJECT** | `-j REJECT` | 拒绝并回传 ICMP 错误信息 |
| **LOG** | `-j LOG --log-prefix "IPTABLES: "` | 记录日志到 syslog (不中断处理) |
| **SNAT** | `-t nat ... -j SNAT --to-source <IP>` | 源地址转换 (用于静态 IP 网关) |
| **DNAT** | `-t nat ... -j DNAT --to-destination <IP:Port>` | 目标地址转换 (端口转发) |
| **MASQUERADE**| `-t nat ... -j MASQUERADE` | 动态源地址伪装 (用于动态 IP 网关) |
| **REDIRECT** | `-t nat ... -j REDIRECT --to-port <端口>` | 本机端口重定向 (透明代理常用) |

### 2.6 持久化与保存 (Persistence)
*iptables 规则重启后默认清空，需手动保存。*

| 指令 | 语法结构 | 描述 |
| :--- | :--- | :--- |
| **iptables-save** | `iptables-save > /etc/iptables.v4` | 将当前运行规则输出到文件 |
| **iptables-restore**| `iptables-restore < /etc/iptables.v4` | 从文件恢复规则 |
| **netfilter-persistent**| `netfilter-persistent save` | (Debian/Ubuntu) 保存当前规则 (需安装包) |
| **service iptables**| `service iptables save` | (CentOS 6/Old RHEL) 保存规则 |