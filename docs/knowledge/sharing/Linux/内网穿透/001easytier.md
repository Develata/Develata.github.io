---
title: easytier
date: 2025-11-29
order: 1
---
官网：[https://easytier.cn/](https://easytier.cn/)

github仓库：[https://github.com/EasyTier/EasyTier](https://github.com/EasyTier/EasyTier)

## **Linux一键安装脚本安装**

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

一般配置如下

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

# 连接目标的域名or网址or ipv4 +端口
# 若为主服务器则不需要填写[[peer]]
# 若需要依次访问多个服务端，那么就填多个[[peer]],url块,不是只添加url
# 注意：IPv6 地址必须用方括号 [] 包起来

# [[peer]]
# uri = "tcp://public.easytier.top:11010"

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

## docker-compose
```bash
services:
  watchtower: # 用于自动更新easytier镜像，若不需要请删除这部分
    image: m.daocloud.io/docker.io/containrrr/watchtower:latest
    container_name: watchtower
    restart: unless-stopped
    environment:
      - TZ=Asia/Shanghai
      - WATCHTOWER_NO_STARTUP_MESSAGE
      - DOCKER_API_VERSION=1.44
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 3600 --cleanup --label-enable
  easytier:
    image: m.daocloud.io/docker.io/easytier/easytier:latest
    hostname: ali_ecs
    container_name: easytier
    labels:
      com.centurylinklabs.watchtower.enable: 'true'
    restart: unless-stopped
    network_mode: host
    cap_add:
      - NET_ADMIN
      - NET_RAW
    environment:
      - TZ=Asia/Shanghai
    devices:
      - /dev/net/tun:/dev/net/tun
    volumes:
      - /etc/easytier:/root
      - /etc/machine-id:/etc/machine-id:ali_ecs # 映射宿主机机器码
    command: -d --network-name 你的用户名 --network-secret 你的密码 -p tcp://public.easytier.top:11010（官方服务器，-p可填多个，可以换成你自己的） -p 指定你的easytier服务器 -i 指定你的内网ipv4
```