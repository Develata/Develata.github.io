---
title: CLIProxyAPI
date: 2026-05-13
order: 9
---

# CLIProxyAPI 使用指南

## 1. CLIProxyAPI 是什么

[Github Repo](https://github.com/router-for-me/CLIProxyAPI)

CLIProxyAPI 是把 Gemini CLI、Antigravity、ChatGPT Codex、Claude Code 等 CLI / OAuth 账号封装成 OpenAI / Gemini / Claude / Codex 兼容 API 的代理服务。

```text
CLI / OAuth 账号
    ↓
CLIProxyAPI
    ↓
OpenAI-compatible / Gemini / Claude / Codex API
```

官方文档：

* https://help.router-for.me/
* https://help.router-for.me/introduction/quick-start
* https://help.router-for.me/configuration/basic
* https://help.router-for.me/configuration/options
* https://help.router-for.me/docker/docker-compose.html
* https://github.com/router-for-me/CLIProxyAPI/blob/main/config.example.yaml

> 截至 **2026-05-13**，官方 README 明确写出 CLIProxyAPI 支持 Codex、Claude Code、Gemini CLI、Antigravity 等 OAuth / CLI 来源，并提供 OpenAI / Gemini / Claude / Codex compatible API。官方支持 Docker / Docker Compose，但低配 VPS 更适合预编译二进制 + systemd。

---

## 2. 推荐架构

Docker Compose 模板：

* [CLIProxyAPI Docker Compose](/knowledge/sharing/docker/compose/cliproxyapi)

本文主推二进制部署：

```text
客户端
    ↓
https://cliproxyapi.example.com/v1
    ↓
Nginx 443
    ↓
127.0.0.1:8317
    ↓
CLIProxyAPI
    ↓
Codex / ChatGPT OAuth
```

原则：

* CLIProxyAPI 只监听 `127.0.0.1:8317`
* 公网只暴露 Nginx `80/443`
* `/v1/*` 不加 Nginx Basic Auth，只用 CLIProxyAPI 的 Bearer API key
* 默认关闭管理面板
* 如果打开管理面板，只给 `/management.html` 单独加 Basic Auth

---

## 3. 安装

基础工具：

```bash
sudo apt update
sudo apt install -y curl wget ca-certificates tar openssl nginx certbot python3-certbot-nginx
```

1C1G VPS 建议加 2G swap；已有 swap 跳过：

```bash
free -h
swapon --show

sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

确认架构：

```bash
uname -m
```

`x86_64` 用 amd64 包：

```bash
cd /tmp

rm -f cli-proxy-api
rm -f CLIProxyAPI_*_linux_amd64.tar.gz

VERSION=$(curl -s https://api.github.com/repos/router-for-me/CLIProxyAPI/releases/latest \
  | grep tag_name \
  | cut -d '"' -f 4)
VERSION_NO_V="${VERSION#v}"

echo "VERSION=$VERSION"
echo "VERSION_NO_V=$VERSION_NO_V"

wget -O "CLIProxyAPI_${VERSION_NO_V}_linux_amd64.tar.gz" \
  "https://github.com/router-for-me/CLIProxyAPI/releases/download/${VERSION}/CLIProxyAPI_${VERSION_NO_V}_linux_amd64.tar.gz"

tar -xzf "CLIProxyAPI_${VERSION_NO_V}_linux_amd64.tar.gz"
chmod +x cli-proxy-api
sudo install -m 755 cli-proxy-api /usr/local/bin/cli-proxy-api
```

验证：

```bash
which cli-proxy-api
cli-proxy-api -h
```

如果 `which` 没输出：

```bash
/usr/local/bin/cli-proxy-api -h
```

如果不是 `x86_64`，按 GitHub Release assets 替换对应架构包。

---

## 4. 配置

创建目录并生成 API key：

```bash
mkdir -p "$HOME/.cli-proxy-api/logs"
API_KEY=$(openssl rand -hex 32)
echo "$API_KEY"
```

写入 `~/.cli-proxy-api/config.yaml`：

```bash
cat > "$HOME/.cli-proxy-api/config.yaml" <<EOF
host: "127.0.0.1"
port: 8317

auth-dir: "$HOME/.cli-proxy-api"

api-keys:
  - "$API_KEY"

debug: false
logging-to-file: false

request-retry: 2
max-retry-credentials: 0

routing:
  strategy: "round-robin"

remote-management:
  allow-remote: false
  secret-key: ""
  disable-control-panel: true

commercial-mode: true
EOF
```

查看配置：

```bash
cat "$HOME/.cli-proxy-api/config.yaml"
```

说明：

* `host: "127.0.0.1"`：只允许本机访问
* `auth-dir`：保存 OAuth 凭据
* `api-keys`：客户端 Bearer API key
* `disable-control-panel: true`：关闭内置管理页
* `commercial-mode: true`：降低高并发下的中间件开销

---

## 5. Codex 登录

```bash
cli-proxy-api -config "$HOME/.cli-proxy-api/config.yaml" -codex-device-login
```

按提示在浏览器登录 OpenAI / ChatGPT 账号并输入 code。成功后应出现类似文件：

```text
~/.cli-proxy-api/codex-xxxx.json
```

---

## 6. 前台测试

启动：

```bash
cli-proxy-api -config "$HOME/.cli-proxy-api/config.yaml"
```

另开 SSH 窗口检查监听：

```bash
ss -lntp | grep 8317
```

应为：

```text
127.0.0.1:8317
```

取 API key：

```bash
API_KEY=$(grep -A1 "api-keys:" ~/.cli-proxy-api/config.yaml | tail -n1 | sed 's/^[[:space:]]*- //; s/"//g')
```

测试：

```bash
curl -i http://127.0.0.1:8317/v1/models \
  -H "Authorization: Bearer $API_KEY"
```

```bash
curl http://127.0.0.1:8317/v1/chat/completions \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.4",
    "messages": [
      {"role": "user", "content": "Hello"}
    ],
    "stream": false
  }'
```

模型名以 `/v1/models` 返回为准。`/health` 返回 `404` 不代表服务失败。

---

## 7. systemd 常驻

把 `deve` 改成实际用户名：

```bash
sudo tee /etc/systemd/system/cli-proxy-api.service > /dev/null <<'EOF'
[Unit]
Description=CLI Proxy API
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=deve
WorkingDirectory=/home/deve
ExecStart=/usr/local/bin/cli-proxy-api -config /home/deve/.cli-proxy-api/config.yaml
Restart=always
RestartSec=5
Environment=HOME=/home/deve

StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
```

如果用户名是 `ubuntu`，同步修改：

```ini
User=ubuntu
WorkingDirectory=/home/ubuntu
ExecStart=/usr/local/bin/cli-proxy-api -config /home/ubuntu/.cli-proxy-api/config.yaml
Environment=HOME=/home/ubuntu
```

启动：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now cli-proxy-api
sudo systemctl status cli-proxy-api
```

日志：

```bash
journalctl -u cli-proxy-api -f
```

确认监听：

```bash
ss -lntp | grep 8317
```

仍应是：

```text
127.0.0.1:8317
```

---

## 8. Nginx + HTTPS

把 `cliproxyapi.example.com` 改成实际域名：

```bash
sudo tee /etc/nginx/sites-available/cliproxyapi > /dev/null <<'EOF'
server {
    listen 80;
    server_name cliproxyapi.example.com;

    client_max_body_size 100m;

    location / {
        proxy_pass http://127.0.0.1:8317;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_buffering off;
        proxy_request_buffering off;

        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/cliproxyapi /etc/nginx/sites-enabled/cliproxyapi
sudo nginx -t
sudo systemctl reload nginx
```

如果默认站点干扰：

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

申请证书：

```bash
sudo certbot --nginx -d cliproxyapi.example.com
sudo nginx -t
sudo systemctl reload nginx
```

续签检查：

```bash
systemctl list-timers | grep certbot
sudo certbot renew --dry-run
sudo certbot certificates
```

公网测试：

```bash
curl -i https://cliproxyapi.example.com/v1/models \
  -H "Authorization: Bearer $API_KEY"
```

成功标准：

```text
HTTP/2 200
content-type: application/json
```

---

## 9. 客户端填写

OpenAI-compatible 客户端：

```text
Base URL: https://cliproxyapi.example.com/v1
API Key: config.yaml 里的 api-keys
```

不要把 `/chat/completions` 写进 Base URL。

---

## 10. 管理页与 Basic Auth

默认关闭管理页：

```yaml
remote-management:
  allow-remote: false
  secret-key: ""
  disable-control-panel: true
```

这种情况下 Nginx 不需要 `auth_basic`，API 只靠：

```text
Authorization: Bearer <CLIProxyAPI_API_KEY>
```

如果要打开管理页，只给 `/management.html` 加 Basic Auth：

```bash
sudo systemctl restart cli-proxy-api
sudo apt install -y apache2-utils
sudo htpasswd -c /etc/nginx/.cliproxyapi_htpasswd pwh
```

```nginx
location = /management.html {
    auth_basic "Restricted";
    auth_basic_user_file /etc/nginx/.cliproxyapi_htpasswd;

    proxy_pass http://127.0.0.1:8317;
    proxy_http_version 1.1;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

不要把 `auth_basic` 写在 `server {}` 顶层，否则 `/v1/models` 和 `/v1/chat/completions` 也会被拦截。

---

## 11. 排错

### 11.1 命令不存在

```bash
cd /tmp
chmod +x cli-proxy-api
sudo install -m 755 cli-proxy-api /usr/local/bin/cli-proxy-api
which cli-proxy-api
```

### 11.2 Release 下载 404

当前脚本假设资产名为：

```text
CLIProxyAPI_版本号_linux_amd64.tar.gz
```

如果下载失败，到 GitHub Release 页面确认实际文件名。

### 11.3 公网 API 返回 `HTTP/2 401`

如果响应头有：

```text
www-authenticate: Basic
```

说明 Nginx Basic Auth 拦截了 API。检查：

```bash
sudo grep -R "auth_basic" -n /etc/nginx
sudo nginx -T | grep -n -C 5 "auth_basic"
```

临时删除 Basic Auth：

```bash
sudo sed -i '/auth_basic/d' /etc/nginx/sites-available/cliproxyapi
sudo nginx -t
sudo systemctl reload nginx
```

### 11.4 Nginx 修改后不生效

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 12. 备份与复刻

重点备份：

```text
~/.cli-proxy-api/config.yaml
~/.cli-proxy-api/codex-*.json
/etc/systemd/system/cli-proxy-api.service
/etc/nginx/sites-available/cliproxyapi
```

复刻顺序：

```text
安装基础工具
下载 cli-proxy-api
写 config.yaml
执行 Codex device login
配置 systemd
配置 Nginx
申请 HTTPS
用 /v1/models 测试
```

---

## 13. 参考链接

```text
https://github.com/router-for-me/CLIProxyAPI
https://github.com/router-for-me/CLIProxyAPI/releases
https://github.com/router-for-me/CLIProxyAPI/blob/main/config.example.yaml
https://help.router-for.me/
https://help.router-for.me/introduction/quick-start
https://help.router-for.me/configuration/basic
https://help.router-for.me/configuration/options
https://help.router-for.me/docker/docker-compose.html
```
