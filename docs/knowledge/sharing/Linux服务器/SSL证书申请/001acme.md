---
title: acme
date: 2025-11-29
order: 1
---
### 前置：
nginx或者openresty

假设你的域名或子域名是 us.example.com

在root账户下创建

### 1. 安装 acme.sh (轻量级 SSL 签发脚本)
```bash
# 这里需要把email换成自己的
curl https://get.acme.sh | sh -s email=my@example.com
source ~/.bashrc
```

### 2. 设置 Cloudflare API 变量 (替换为你自己的 Token)
```bash
# 不要删除引号，在cloudflare域名-概述页最右下处
export CF_Token="你申请到的CF_Token_字符串"
export CF_Account_ID="你的Cloudflare_Account_ID"
```

export CF_Token可以自己创建api令牌

### 3. 申请证书 (替换为你的实际域名)
 切换默认 CA 为 Let's Encrypt 

```bash
~/.acme.sh/acme.sh --set-default-ca --server letsencrypt
```

```bash
# 填自己域名
~/.acme.sh/acme.sh --issue --dns dns_cf -d us.example.com
```

### 4. 创建存放证书的目录
openresty:

```bash
sudo mkdir -p /usr/local/openresty/nginx/conf/ssl/
# 修改目录权限，把admin改成你当前用户名
sudo chown -R admin:admin /usr/local/openresty/nginx/conf/ssl/
```

**验证**：执行 `ls -ld /usr/local/openresty/nginx/conf/ssl/`，确保显示的是 `admin admin`。  

nginx:

```bash
sudo mkdir -p /etc/nginx/ssl/
# 修改目录权限，把admin改成你当前用户名
sudo chown -R admin:admin /etc/nginx/ssl
```

### 5. 安装证书到指定位置 (不要直接用生成的路径，要用 install-cert 命令)
openresty：

```bash
# 填自己域名
~/.acme.sh/acme.sh --install-cert -d us.example.com \
--key-file       /usr/local/openresty/nginx/conf/ssl/us.example.com.key  \
--fullchain-file /usr/local/openresty/nginx/conf/ssl/us.example.com.crt \
--reloadcmd     "openresty -s reload"
```

nginx:

```bash
~/.acme.sh/acme.sh --install-cert -d us.example.com \
--key-file       /etc/nginx/ssl/us.example.com.key  \
--fullchain-file /etc/nginx/ssl/us.example.com.crt \
--reloadcmd     "systemctl force-reload nginx"
```

### 6.查看证书文件
/etc/nginx/ssl/   或者你的 OpenResty 路径

```bash
ls -lh /etc/nginx/ssl/
```

### 7.查看定时任务
```bash
crontab -l
```

```bash
# 填自己域名
~/.acme.sh/acme.sh --install-cert -d *.develata.me \
--key-file       /usr/local/openresty/nginx/conf/ssl/*.develata.me.key  \
--fullchain-file /usr/local/openresty/nginx/conf/ssl/*.develata.me.crt \
--reloadcmd     "openresty -s reload"
```

### 8.卸载
openresty：

```bash
sudo ~/.acme.sh/acme.sh --uninstall
sudo rm -rf ~/.acme.sh
sudo rm -rf /usr/local/openresty/nginx/conf/ssl/
```

nginx：

```bash
sudo ~/.acme.sh/acme.sh --uninstall
sudo rm -rf ~/.acme.sh
sudo rm -rf /etc/nginx/ssl/
```

删除定时任务：

检查 root 的定时任务里有没有残留

```bash
sudo crontab -u root -l | grep acme 
```

找到包含 `/root/.acme.sh/acme.sh` 的那一行，删除。

```bash
sudo crontab -u root -e
```

如果系统跳出来让你选择编辑器（Select an editor），通常会有 `nano` (推荐新手) 和 `vim` 等选项。

+ 请输入对应的数字（通常 `nano` 是 **1**），然后按回车。

