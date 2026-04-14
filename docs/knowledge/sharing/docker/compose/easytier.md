---
title: easytier
date: 2026-4-14
order: 1
---

## Github Repo

[EasyTier Github Repo](https://github.com/EasyTier/EasyTier)

## docker-compose

```yaml
services:
    easytier:
        container_name: easytier
        image: easytier/easytier:latest
        hostname: ${EASYTIER_HOSTNAME}
        labels:
            createdBy: Apps
            com.centurylinklabs.watchtower.enable: 'true'
        restart: unless-stopped
        network_mode: host
        cap_add:
            - NET_ADMIN
            - NET_RAW
        environment:
            - TZ=${TIME_ZONE}
        devices:
            - /dev/net/tun:/dev/net/tun
        volumes:
            - ${EASYTIER_DATA_PATH}:/root
            - /etc/machine-id:/etc/machine-id:ro
        command: >
            -d
            --network-name ${EASYTIER_NETWORK_NAME}
            --network-secret ${EASYTIER_NETWORK_SECRET}
            ${EASYTIER_PEERS}
            ${EASYTIER_IPV4}
```

## env
```
TIME_ZONE=Asia/Shanghai

EASYTIER_HOSTNAME=ali_ecs
EASYTIER_DATA_PATH=/etc/easytier

EASYTIER_NETWORK_NAME=
EASYTIER_NETWORK_SECRET=

# 可填多个 -p，留空也可以
EASYTIER_PEERS=-p tcp://public.easytier.top:11010

# 例如: EASYTIER_IPV4=-i 10.144.144.2
# 不需要就留空
EASYTIER_IPV4=
```

**防火墙记得放开端口11010**