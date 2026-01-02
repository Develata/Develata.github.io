---
title: v2rayA
date: 2025-12-9
order: 1
---
```bash
version: '3.8'

services:
  v2raya:
    image: mzz2017/v2raya:latest
    container_name: v2raya
    restart: always
    # 端口映射模式
    ports:
      - "2017:2017"             # 管理面板
      - "20170-20172:20170-20172" # 代理端口 (20171是HTTP, 20170是SOCKS5)
    environment:
      - V2RAYA_LOG_FILE=/tmp/v2raya.log
      # --- 关键修改 ---
      # 删除了 V2RAYA_V2RAY_BIN 变量
      # 让 v2rayA 自动检测并使用默认的 Xray 内核，解决报错
      # ----------------
    volumes:
      # 持久化配置
      - /etc/v2raya:/etc/v2raya
```

**防火墙记得放开端口20171并且v2rayA控制面板设置里面打开端口转发，目的是为了让其它容器或内网其它设备可以正常访问**

如果镜像版本太老可能无法识别最新协议，需要手动本地拉取最新镜像后上传至服务器