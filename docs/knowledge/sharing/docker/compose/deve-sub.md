---
title: easytier
---

## Github Repo

[Deve Sub Github Repo](https://github.com/Develata/deve-sub)

compose更新日期: 2026-09-13

## Docker Compose

```yaml
services:
  deve-sub:
    image: ghcr.io/develata/deve-sub:latest
    container_name: deve-sub
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:8080"
    volumes:
      - deve-sub-data:/app/data
    networks:
      - 1panel-network

volumes:
  deve-sub-data:

networks:
  1panel-network:
    external: true
```

启动：

```bash
docker compose up -d
```

查看日志：

```bash
docker compose logs -f
```

## 更新

修改 `image` 中的版本号后：

```bash
docker compose pull
docker compose up -d
```

数据保存在 Docker Volume `deve-sub-data` 中。

> 使用 1Panel 反向代理时，可通过 `1panel-network` 直接访问容器的 `8080` 端口。