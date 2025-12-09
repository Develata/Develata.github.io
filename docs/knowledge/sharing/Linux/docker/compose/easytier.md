---
title: easytier
date: 2025-12-9
order: 1
---
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

**防火墙记得放开端口11010**