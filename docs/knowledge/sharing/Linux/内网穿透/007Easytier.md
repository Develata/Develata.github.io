---
title: Easytier
date: 2025-11-27 20:41
order: 7
---
官网：[https://easytier.cn/](https://easytier.cn/)

github仓库：[https://github.com/EasyTier/EasyTier](https://github.com/EasyTier/EasyTier)

**Linux一键安装脚本安装**

一键脚本依赖 ``unzip``，请提前下载并安装

```bash
sudo apt install unzip
```

安装easytier一键脚本

```bash
wget -O /tmp/easytier.sh "https://raw.githubusercontent.com/EasyTier/EasyTier/main/script/install.sh" && sudo bash /tmp/easytier.sh install --gh-proxy https://ghfast.top/
```

脚本执行成功后，EasyTier 的二进程程序会安装到 ``/opt/easytier`` 目录下，配置文件位于 ``/opt/easytier/config/default.conf``。

配置文件可通过 [配置文件生成器](https://easytier.cn/web/index.html#/config_generator) 生成。

```bash
sudo nano /opt/easytier/config/default.conf
```

如果是standalone模式（一般是这个），一般配置如下

```bash
# 当前服务器名
instance_name = "server"
# 当前设备名
hostname = "server"
# 是否开启DHCP，开启则删除ipv4行，false改为true
ipv4 = "10.144.51.1/24"
dhcp = false
# 当前监听端口
listeners = [
    "tcp://0.0.0.0:11010",
    "udp://0.0.0.0:11010",
    # 个人优化，不需要监听wg和wss
    # "wg://0.0.0.0:11011",
    "ws://127.0.0.1:11011/",
    # "wss://0.0.0.0:11012/",
]
# 出口节点列表
exit_nodes = []
# RPC 管理端口
rpc_portal = "0.0.0.0:0"

# 账密
[network_identity]
network_name = "admin"
network_secret = "password"

# 以下为默认配置
[flags]
default_protocol = "udp"
dev_name = "server"
enable_encryption = true
enable_ipv6 = true
mtu = 1380
latency_first = false
enable_exit_node = false
no_tun = false
use_smoltcp = false
foreign_network_whitelist = "*"
disable_p2p = false
p2p_only = false
relay_all_peer_rpc = false
disable_udp_hole_punching = false
```

若需要连接到别的服务器，一般如下

```bash
# 当前设备名
hostname = "hostname"
# 是否开启DHCP，开启则删除ipv4行，false改为true
ipv4 = "10.144.51.4/24"
dhcp = false
# 当前监听端口
listeners = [
    "tcp://0.0.0.0:11010",
    "udp://0.0.0.0:11010",
    "wg://0.0.0.0:11011",
]
# RPC 管理端口
rpc_portal = "0.0.0.0:0"

# 连接目标的账密
[network_identity]
network_name = "admin"
network_secret = "password"

# 连接目标的域名or网址or ipv4 +端口
[[peer]]
uri = "tcp://easytier.develata.me"
# 以下为默认配置
[flags]

```

**防火墙记得放开端口11010**

EasyTier 会被注册为系统服务，可以通过以下命令管理：

 将 EasyTier 作为后台服务（守护进程）管理

```bash
# 启动
sudo systemctl start easytier@default
# 开机自启
sudo systemctl enable easytier@default
# 查看运行状态
sudo systemctl status easytier@default
# 查看详细日志
sudo journalctl -u easytier@default -f
# 停止服务
sudo systemctl stop easytier@default
# 重启
sudo systemctl restart easytier@default
```

 使用 `systemctl` 可以让 EasyTier 在后台静默运行，并支持开机自启 ，**每次修改完配置文件都记得要重启才能生效。**

