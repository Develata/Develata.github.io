---
title: 网络一键脚本搭建（YG）
date: 2025-11-24 22:44
order: 2
---
YG一键脚本github网址：[https://github.com/yonggekkk/sing-box-yg](https://github.com/yonggekkk/sing-box-yg)

需要 `sudo` 权限，建议直接输入 `sudo -i` 获取根权限

### VPS专用一键脚本如下：快捷方式：``sb``
```plain
bash <(wget -qO- https://raw.githubusercontent.com/yonggekkk/sing-box-yg/main/sb.sh)
```

或者

```plain
bash <(curl -Ls https://raw.githubusercontent.com/yonggekkk/sing-box-yg/main/sb.sh)
```

### Sing-box-yg脚本界面预览图（注：相关参数随意填写，仅供围观）
### ![](https://cdn.nlark.com/yuque/0/2025/png/56734241/1763139515504-05eeb1ef-2e9d-424e-9b3b-16c3dca952f6.png)
### 二、Serv00/Hostuno一键三协议共存脚本（Serv00/Hostuno专用）：
+ 目前免费Serv00使用代理脚本有被封账号的风险，收费版Hostuno不受影响，可正常使用
+ 切勿与其他Serv00脚本混用！！！
+ 引用[老王eooce](https://github.com/eooce/Sing-box/blob/test/sb_00.sh)、[frankiejun](https://github.com/frankiejun/serv00-play/blob/main/start.sh)相关功能，支持一键三协议：vless-reality、vmess-ws(argo)、hysteria2
+ 主要增加reality协议默认支持 CF vless/trojan 节点的proxyip以及非标端口的优选反代IP功能
+ 聚合通用节点分享，支持到22个节点：三协议各自三个IP，argo全覆盖13个端口节点，已添加不死优选IP

### Serv00/Hostuno-sb-yg一键脚本
+ Argo高度自定义：可以重置临时隧道; 可以继续使用上回的固定隧道; 也可以更换固定隧道的域名或token

```plain
bash <(curl -Ls https://raw.githubusercontent.com/yonggekkk/sing-box-yg/main/serv00.sh)
```

#### Serv00/Hostuno-sb-yg脚本界面预览图，仅限方案一的SSH端安装脚本（注：仅供围观）
![](https://cdn.nlark.com/yuque/0/2025/png/56734241/1763139557885-be52b40d-a1c3-4835-b00a-11f97d0e159c.png)

