---
title: RustDesk
date: 2026-08-09
order: 12
---

# RustDesk 使用指南

## 1. 什么是 RustDesk

[RustDesk GitHub Repo](https://github.com/rustdesk/rustdesk)

RustDesk 是用 Rust 开发的开源跨平台远程桌面软件，客户端采用 AGPL-3.0-only 许可证。它可在 Windows、Linux、macOS、Android 和 iOS 等平台之间进行远程控制，并支持剪贴板、文件传输、多显示器等常见远控能力。

RustDesk 的特点是服务端也可以自建：

* **临时协助**：对方发来设备 ID 和一次性密码，你连接过去排查问题。
* **无人值守**：在自己的电脑上安装服务并设置永久密码，外出时远程访问。
* **跨平台控制**：从笔记本或手机连接 Windows / Linux 主机。
* **自建基础设施**：自行部署 ID server 与 relay server，控制连接入口和中继流量。

RustDesk 客户端既可以使用项目提供的公共服务器，也可以连接自建的 RustDesk Server OSS / Pro。开源并不等于默认部署天然安全；远控软件拥有屏幕、键鼠、剪贴板与文件权限，必须按高权限入口管理。

---

## 2. Windows 安装

### 2.1 使用 Scoop 安装（推荐）

先确认已经安装 [Scoop](./Scoop.md)，然后执行：

```powershell
scoop bucket add extras
scoop update
scoop install extras/rustdesk
```

当前 Scoop `extras/rustdesk` 安装的是官方 release 的便携版可执行文件，并创建开始菜单快捷方式。验证：

```powershell
scoop list rustdesk
scoop prefix rustdesk
```

从开始菜单启动 **RustDesk**。更新与卸载：

```powershell
scoop update rustdesk
scoop uninstall rustdesk
```

> Scoop 便携版适合临时控制或作为控制端。若要把电脑配置为稳定的无人值守被控端，应继续在 RustDesk 界面中完成系统安装，或使用官方 release 的 MSI；只运行便携 EXE 不能替代后台服务。

### 2.2 官方 EXE / MSI

[GitHub Releases](https://github.com/rustdesk/rustdesk/releases/latest)提供 Windows x86-64、ARM64 等构建。选择与系统架构匹配的 EXE 或 MSI：

* **EXE**：可直接运行，适合临时协助；也可从界面继续安装。
* **MSI**：适合系统级安装、长期运行和组织部署。
* **x86-32**：属于 legacy 兼容构建，新设备通常不选。

不要同时维护 Scoop 便携版和另一个长期运行的安装版，除非你清楚哪个实例负责服务、配置与更新。

---

## 3. 第一次连接

RustDesk 主界面会显示：

* 本机 **ID**；
* 当前 **One-Time Password**；
* 用于输入远端 ID 的连接框。

临时协助流程：

1. 被控端启动 RustDesk，把设备 ID 和本次一次性密码通过可信渠道发给控制端。
2. 控制端输入设备 ID，发起连接。
3. 被控端确认连接请求，或由控制端输入一次性密码。
4. 会话结束后主动断开；不再需要时退出便携版。

一次性密码只应用于当前协助，不要把永久密码当作临时密码反复发送。ID 与密码也不要发到群聊、issue、公开截图或日志中。

---

## 4. 配置无人值守访问

无人值守意味着远端没有人点击“接受”也可以登录，因此风险显著高于临时协助。

### 4.1 安装系统服务

在被控 Windows 电脑上使用安装版，或从 RustDesk 便携版界面选择安装。完成后确认：

* RustDesk 可以随系统启动；
* 重启后仍能显示设备 ID；
* 锁屏状态下仍可连接；
* 需要操作 UAC / 管理员窗口时具备足够权限。

### 4.2 设置永久密码

进入 **Settings → Security → Password**，设置独立的高强度永久密码。建议：

* 长度至少 16 位，使用密码管理器生成；
* 不与 Windows 登录、邮箱或其他远控工具复用；
* 只在自己的受信设备中保存；
* 设备遗失、人员变动或怀疑泄露时立即轮换。

### 4.3 收紧会话权限

在 Security / Permissions 中只启用实际需要的能力：

* 只需要看屏幕时，关闭键盘和鼠标控制；
* 不需要传文件时，关闭 File Transfer；
* 不需要跨设备复制时，关闭 Clipboard；
* 不需要音频、远程重启、terminal、TCP tunnel 时保持关闭；
* 临时维护结束后恢复为更小权限集。

最小权限比“连接后提醒自己别误操作”可靠得多。

---

## 5. 会话内常用功能

### 5.1 显示与多显示器

连接后可根据网络情况切换显示质量、缩放方式和帧率。常用策略：

* 文档、终端、运维操作：优先清晰度，帧率不必高。
* 弱网：降低画质与帧率，必要时关闭壁纸和动画。
* 多显示器：只显示当前需要的屏幕，减少传输量。
* 高 DPI：在“原始尺寸 / 自适应窗口”之间切换，避免文字过小或模糊。

### 5.2 剪贴板

剪贴板同步适合复制命令、网址和短文本，但也可能把密码管理器内容或敏感数据带到另一台机器。连接公共或不完全可信的电脑时应关闭剪贴板同步。

### 5.3 文件传输

优先使用 RustDesk 的 File Transfer，而不是在远程桌面中反复拖拽大文件。传输前确认：

1. 源路径与目标路径正确；
2. 目标磁盘空间足够；
3. 覆盖冲突策略明确；
4. 敏感文件传输后已清理临时副本。

大文件或批量目录仍建议使用具备校验与断点续传的专门工具；远控文件传输更适合临时、小规模操作。

### 5.4 键盘与特殊按键

远控中 `Ctrl+Alt+Delete`、Windows 键、输入法切换等可能由本机先截获，应使用 RustDesk 会话工具栏提供的特殊按键功能。遇到键位错乱时，先确认控制端与被控端键盘布局和输入法一致。

---

## 6. Windows UAC 与权限提升

便携版默认没有管理员权限，常见现象是：

* UAC 对话框处黑屏或无法操作；
* 不能控制任务管理器、注册表编辑器等已提升窗口；
* 远端鼠标在管理员窗口中失效。

解决方式按稳定性排序：

1. **长期被控主机**：安装 RustDesk，让服务负责权限和会话。
2. **临时现场协助**：让被控端点击 `Accept and Elevate` 或在连接后点击 `Elevate`。
3. **临时无人值守但确需提升**：在启动前右键“以管理员身份运行”。

从控制端请求提升时，官方文档说明仍需要被控端有人接受 UAC。因此真正的无人值守维护应提前安装并验证，而不是连接后才临时请求权限。

---

## 7. 使用自建服务器

### 7.1 工作原理

RustDesk Server OSS 主要包含两个程序：

* `hbbs`：ID / rendezvous / signaling server，负责设备注册和建立连接。
* `hbbr`：relay server，直连打洞失败时中继流量。

客户端通常先尝试点对点连接；失败后才走 relay。自建服务器的价值是控制 ID 与中继基础设施，不是自动替你完成访问控制、系统加固和备份。

### 7.2 客户端配置

在 RustDesk 中打开 **Settings → Network**，填写自建服务器提供的信息：

* **ID Server**：`hbbs` 地址；
* **Relay Server**：通常可留空，让客户端从 ID server 获取；特殊拓扑再显式填写；
* **Key**：服务器 `id_ed25519.pub` 对应的公钥内容。

所有参与连接的客户端都应指向同一套可信配置。填写后先做三项验证：

1. 客户端状态显示 Ready；
2. 两台设备可通过 ID 建立连接；
3. 分别确认一次直连和 relay 场景，避免只在同一局域网内“看起来可用”。

自建服务端的安装、端口、TLS 与升级属于独立运维主题，参见[官方 Self-host 文档](https://rustdesk.com/docs/en/self-host/)。不要为了“自建”而把管理端口直接暴露到公网。

---

## 8. 性能与连接质量

远控体验取决于编码、画面变化、网络延迟、上行带宽和是否走 relay。排查顺序：

1. 在会话信息中确认是 Direct 还是 Relay。
2. 检查两端 CPU 是否因编码 / 解码满载。
3. 降低分辨率、画质和帧率。
4. 关闭动画、视频和动态壁纸。
5. 若自建 relay，检查服务器带宽与跨网延迟。
6. 同一局域网内仍卡顿时，检查安全软件、虚拟网卡和路由策略。

“能连接”与“连接质量足够工作”是两个验收条件，应分别测试。

---

## 9. 安全基线

* 只安装官方 release 或可信 package manifest，更新前核对来源。
* 永久密码独立生成并定期轮换；临时协助优先一次性密码和人工确认。
* 无人值守设备关闭不需要的文件传输、剪贴板、terminal、tunnel 等权限。
* 自建客户端必须配置正确的 server key；不要开启“不安全 TLS fallback”来绕过证书错误。
* 远控结束后检查是否仍有会话、后台传输或临时账号。
* 不在远控聊天框、剪贴板历史、脚本和公开日志中留下秘密。
* 重要主机保留另一条恢复路径，例如物理访问、SSH、KVM 或云控制台。

---

## 10. 更新、卸载与故障排查

### 10.1 更新

Scoop 安装：

```powershell
scoop update
scoop update rustdesk
```

长期无人值守主机更新后必须做一次真实回归：重启被控端，确认服务启动、ID 保持、永久密码可用、UAC 窗口可操作。

### 10.2 卸载

先从 RustDesk 界面卸载系统服务或卸载安装版，再移除 Scoop 便携版：

```powershell
scoop uninstall rustdesk
```

只删除便携 EXE 不一定会移除已经安装到系统中的服务。

### 10.3 常见问题

| 现象 | 检查与处理 |
| :--- | :--- |
| 状态不是 Ready | 检查网络、代理、防火墙；自建时核对 ID Server 与 Key |
| 有 ID 但无法连接 | 确认两端使用同一公共 / 自建基础设施；检查自建端口和 NAT |
| 只能看不能控制 | 检查被控端权限开关、系统辅助权限和 UAC 状态 |
| UAC 界面无法操作 | 安装系统服务，或让被控端接受 Elevate；便携普通权限不足 |
| 重启后失联 | RustDesk 尚未安装为服务，或服务未自启；在本机重新验证无人值守流程 |
| 画面卡顿 | 确认 Direct / Relay，降低画质和帧率，检查 relay 带宽 |
| Scoop 更新后出现两个实例 | 退出全部 RustDesk，确认系统安装版与 Scoop 便携版的边界，保留一套更新入口 |

---

## 参考链接

* [RustDesk GitHub 仓库](https://github.com/rustdesk/rustdesk)
* [RustDesk Client 文档](https://rustdesk.com/docs/en/client/)
* [Windows Portable Elevation](https://rustdesk.com/docs/en/client/windows/windows-portable-elevation/)
* [RustDesk Self-host 文档](https://rustdesk.com/docs/en/self-host/)
* [Client Advanced Settings](https://rustdesk.com/docs/en/self-host/client-configuration/advanced-settings/)
* [Scoop Extras: rustdesk manifest](https://github.com/ScoopInstaller/Extras/blob/master/bucket/rustdesk.json)
