---
title: v2rayA
date: 2026-4-14
order: 1
---

## Github Repo

[v2rayA Github Repo](https://github.com/v2rayA/v2rayA)


## docker-compose
```yaml
networks:
    1panel-network:
        external: true

services:
    v2raya:
        container_name: v2raya
        image: mzz2017/v2raya:latest
        restart: always
        environment:
            - TZ=${TIME_ZONE}
            - V2RAYA_LOG_FILE=${V2RAYA_LOG_FILE}
        labels:
            createdBy: Apps
        networks:
            - 1panel-network
        ports:
            - ${HOST_IP}:${V2RAYA_PANEL_PORT}:2017
            - ${HOST_IP}:${V2RAYA_SOCKS_PORT}:20170
            - ${HOST_IP}:${V2RAYA_HTTP_PORT}:20171
            - ${HOST_IP}:${V2RAYA_TRANSPARENT_PORT}:20172
        volumes:
            - ${V2RAYA_DATA_PATH}:/etc/v2raya
```

## env

```
HOST_IP=127.0.0.1
TIME_ZONE=UTC
V2RAYA_PANEL_PORT=2017
V2RAYA_SOCKS_PORT=20170
V2RAYA_HTTP_PORT=20171
V2RAYA_TRANSPARENT_PORT=20172

V2RAYA_LOG_FILE=/tmp/v2raya.log
V2RAYA_DATA_PATH=/etc/v2raya
```

**防火墙记得放开端口20171并且v2rayA控制面板设置里面打开端口转发，目的是为了让其它容器或内网其它设备可以正常访问**

如果镜像版本太老可能无法识别最新协议，需要手动本地拉取最新镜像后上传至服务器