---
title: iptables
date: 2026-1-2
order: 1
---

这份教程针对 **Debian/Ubuntu** 系 VPS（最常见的服务器系统）

### 一、 新机开荒：30秒一键初始化
在一台全新的 VPS 上，按顺序执行以下命令，即可完成“安装 + 基础配置 + 持久化”。

#### 1. 安装持久化工具
```plain
sudo apt update
# 安装过程中遇到问询弹窗，一路选 <Yes>
sudo apt install iptables-persistent -y
```

#### 2. 一键注入“安全模板”
**<u>警告：如果你修改了 SSH 端口（不是 22），请修改下方第 5 行的 22。</u>**

直接复制整段粘贴进终端：

```plain
# 1. 清空现有规则（防止冲突）
iptables -F
iptables -X

# 2. 【核心】允许已建立的连接（防止断连）
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# 3. 【核心】允许 SSH (如果是 1228 端口请自行修改)
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# 4. 允许基础服务 (HTTP/HTTPS/Ping/Loopback)
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -p icmp -j ACCEPT
iptables -A INPUT -i lo -j ACCEPT

# 5. 【核心】封锁大门 (默认拒绝)
iptables -P INPUT DROP
iptables -P FORWARD ACCEPT
iptables -P OUTPUT ACCEPT

# 6. 保存规则
netfilter-persistent save
```

---

### 二、 指令速查字典 (Cheat Sheet)
#### 1. 查看规则 (Query)
最常用的两条，死记硬背：

Bash

```plain
# 简洁版：看有什么端口开了
iptables -nvL

# 运维版：显示行号 (删除、插入规则时必须用)
iptables -nvL --line-numbers
```

#### 2. 放行端口 (Allow)
**注意**：`-A` 表示追加到最后。如果你的默认策略是 DROP，追加是没问题的。

Bash

```plain
# 放行 TCP 端口 (如 8080)
iptables -A INPUT -p tcp --dport 8080 -j ACCEPT

# 放行 UDP 端口 (如 EasyTier/WireGuard)
iptables -A INPUT -p udp --dport 10110 -j ACCEPT

# 放行特定 IP 访问特定端口 (只允许 IP 1.2.3.4 连 SSH)
iptables -A INPUT -p tcp -s 1.2.3.4 --dport 22 -j ACCEPT
```

#### 3. 删除规则 (Delete)
必须先用 `iptables -nvL --line-numbers` 查出行号。

Bash

```plain
# 删除 INPUT 链的第 5 行
iptables -D INPUT 5
```

#### 4. 插入规则 (Insert)
**场景**：当你需要把规则放到最前面（优先级最高），或者 Fail2ban 没有自动把链插到最前面时。

Bash

```plain
# 插队到第 1 行
iptables -I INPUT 1 -p tcp --dport 9000 -j ACCEPT
```

#### 5. 保存与重载 (Persistence)
`iptables` 重启即失效，修改后**必须**保存。

Bash

```plain
# 保存当前规则到硬盘
netfilter-persistent save

# 从硬盘重新加载规则 (撤销刚才未保存的修改)
netfilter-persistent reload
```

---

### 三、 救命锦囊：被自己锁外面了怎么办？
如果你不小心执行了 `iptables -P INPUT DROP` 但没放行 SSH，连接断开。

**解决方法：**

1. 去云服务商（阿里云/腾讯云/AWS）的网页控制台，找到 **VNC 控制台** (Web 终端)。
2. 登录进去（VNC 不走网络协议，不受 iptables 影响）。
3. 执行急救命令，清空防火墙：

Bash

```plain
# 把默认策略改回 ACCEPT
iptables -P INPUT ACCEPT
# 清空所有规则
iptables -F
# 保存
netfilter-persistent save
```

### 四、 常用场景模板
+ **Docker 场景**：Docker 会自己接管 `iptables`，不要轻易执行 `iptables -F`（会把 Docker 的网断掉）。如果非要重置，建议重启 Docker 服务。
+ **多端口放行**：

Bash

```plain
iptables -A INPUT -p tcp -m multiport --dports 21,22,80,443 -j ACCEPT
```

+ **屏蔽恶意 IP**：

Bash

```plain
iptables -I INPUT 1 -s 123.123.123.123 -j DROP
```

