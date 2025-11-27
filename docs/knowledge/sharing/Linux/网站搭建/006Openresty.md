---
title: Openresty
date: 2025-11-27 20:44
order: 6
---
## 前置准备
#### 安装（已安装则跳过）
### 1. 安装基础工具
```bash
sudo apt-get -y install --no-install-recommends wget gnupg ca-certificates
```

### 2. 导入官方签名 (这步是为了安全，必须做)
```bash
wget -O - https://openresty.org/package/pubkey.gpg | sudo gpg --dearmor -o /usr/share/keyrings/openresty.gpg
```

### 3. 添加仓库
```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/openresty.gpg] http://openresty.org/package/ubuntu $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/openresty.list
```

### 4. 正式安装
```bash
sudo apt-get update
sudo apt-get install openresty -y
```

#### 确认安装路径:`/usr/local/openresty/nginx/`
#### 配置目录:`/usr/local/openresty/nginx/conf/conf.d/`
打开文件：

```bash
sudo nano /usr/local/openresty/nginx/conf/nginx.conf
```

+ 按键盘 `Ctrl` + `V` (Page Down) 翻到文件最底部。
+ 找到http的最后一个大括号 `}`。

在它上面一行插入：

```nginx
include /usr/local/openresty/nginx/conf/conf.d/*.conf;
```

这样以后添加配置就只需要进入

`/usr/local/openresty/nginx/conf/conf.d/*.conf`

+ 保存并退出 (`Ctrl+O`, `Enter`, `Ctrl+X`)。

```bash
# 1. 创建存放配置的文件夹
sudo mkdir -p /usr/local/openresty/nginx/conf/conf.d/

# 2. 再次检查配置是否正确
sudo openresty -t
```

#### 常用命令:
`sudo openresty -t` (检查), 

`sudo systemctl reload openresty` (重载)

## 场景一：搭建一个静态网站 (HTML/图片)
这是最基础的用法，用于部署博客、企业官网或前端项目。

**1. 准备网页文件** 我们先创建一个存放网页的目录（建议放在 `/var/www/` 下）：

Bash

```plain
sudo mkdir -p /var/www/mywebsite
# 创建一个测试用的 index.html
echo "<h1>这是我的静态网站</h1>" | sudo tee /var/www/mywebsite/index.html
```

**2. 创建配置文件** 新建文件：`sudo nano /usr/local/openresty/nginx/conf/conf.d/mywebsite.conf`

**3. 写入配置**

Nginx

```plain
server {
    listen 80;
    server_name example.com;  # 将此处改为您的域名或服务器IP

    # 网站根目录
    root /var/www/mywebsite;
    index index.html index.htm;

    # 访问日志（可选，建议开启）
    access_log logs/mywebsite_access.log;
    error_log  logs/mywebsite_error.log;

    location / {
        # 如果找不到文件，尝试返回 index.html (适用于 Vue/React 单页应用)
        try_files $uri $uri/ /index.html;
    }
}
```

**4. 生效**

```bash
sudo openresty -t   # 检查语法
sudo systemctl reload openresty
```

现在访问您的域名/IP，就能看到“这是我的静态网站”。

## 场景二：反向代理 (配合 Python/Go/Node.js)
如果您在服务器上跑了一个 Python (Flask/Django) 或 Go 程序，监听在 `127.0.0.1:8000`，想通过 OpenResty 暴露给外网。

**1. 创建配置文件** 新建文件：`sudo nano /usr/local/openresty/nginx/conf/conf.d/api_proxy.conf`

**2. 写入配置**

Nginx

```plain
server {
    listen 80;
    server_name api.example.com; # 您的 API 域名

    location / {
        # 转发请求到后端的 8000 端口
        proxy_pass http://127.0.0.1:8000;

        # 必须携带的 Header，否则后端拿不到真实 IP
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # 支持 WebSocket (如果需要)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

若有证书，走443端口，通常已经配置过80到443的强制HTTPS，因此此处省略

```bash
server {
    # 1. 必须加上 ssl 关键字
    listen 443 ssl;
    # 2.这里填计划的域名
    server_name openlist.develata.me;

    # 3. 必须复用申请的域名证书
    ssl_certificate      /usr/local/openresty/nginx/conf/ssl/develata.me.crt;
    ssl_certificate_key  /usr/local/openresty/nginx/conf/ssl/develata.me.key;

    # 4. SSL 协议优化 (保持一致性)
    ssl_session_cache    shared:SSL:1m;
    ssl_session_timeout  5m;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        # 转发到其它端口
        proxy_pass http://127.0.0.1:8888;

        # Header 传递
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # WebSocket 支持 (如果需要)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 场景三：利用 Lua 脚本 (OpenResty 独家功能)
这是 OpenResty 最强大的地方，可以在网关层做逻辑处理。例如：**简单的 API 鉴权**。

**1. 创建配置文件** 新建文件：`sudo nano /usr/local/openresty/nginx/conf/conf.d/lua_auth.conf`

**2. 写入配置**

Nginx

```plain
server {
    listen 8090; # 监听 8090 端口测试
    
    location /secret {
        access_by_lua_block {
            -- 获取 URL 参数中的 token
            local token = ngx.var.arg_token
            
            -- 如果 token 不是 '123456'，直接拒绝访问
            if token ~= "123456" then
                ngx.status = 403
                ngx.say("禁止访问：Token 错误或缺失")
                ngx.exit(403)
            end
        }
        
        # 只有通过了上面的 Lua 检查，才会执行下面的内容
        default_type text/html;
        content_by_lua_block {
            ngx.say("<h1>欢迎进入机密区域！验证通过。</h1>")
        }
    }
}
```

+ **测试方法：**
    - 访问 `http://ip:8090/secret` -> **被拒绝**
    - 访问 `http://ip:8090/secret?token=123456` -> **成功**

## 场景四：配置 HTTPS (SSL 证书)
现在网站都需要 HTTPS。我们可以手动配置证书，或者使用 `certbot`。这里展示**标准配置模板**。

假设您已经有了证书文件（`.crt` 和 `.key`）。

**1. 配置文件模板**

Nginx

```plain
server {
    # 监听443端口的ssl
    listen 443 ssl;
    # 自己域名
    server_name example.com;

    # 证书路径/path/to/your/certificate.crt
    ssl_certificate     /path/to/your/certificate.crt; 
    ssl_certificate_key /path/to/your/private.key;

    # 推荐的安全参数
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    # 如果有一个443端口静态页网站，相当于把原本的404换成别的
    # 没有就不需要下面两行
    # root /var/www/mywebsite;
    # index index.html;
}

# HTTP 强制跳转 HTTPS
server {
    listen 80;
    # 自己域名
    server_name example.com;
    # 301永久重定向强制HTTPS
    return 301 https://$host$request_uri;
}
```

##  核心排错清单
如果在配置过程中遇到问题，请按此顺序检查：

1. **检查语法：** 永远第一步执行 `sudo openresty -t`。
2. **看日志：** 报错原因都在这里：
    - `tail -f /usr/local/openresty/nginx/logs/error.log`
3. **检查端口：** 确认端口没被占用：
    - `sudo ss -tulpn | grep 80`
4. **检查防火墙：** 确认服务器防火墙（UFW/iptables）和云服务商的安全组放行了端口。

