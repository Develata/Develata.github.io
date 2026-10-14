---
title: OpenSSH
date: 2026-10-14
order: 10
---

# Windows OpenSSH Server：EasyTier 内网与密钥登录

这篇记录 Windows 11 的 SSH 服务配置：只监听 EasyTier 的固定 IPv4，用密钥登录。EasyTier 需要先连通；以下服务、防火墙操作在 **Windows 本机的管理员 PowerShell** 中完成，客户端命令会另行标明。

## 1. 确认 EasyTier 地址

把下面地址换成这台 Windows 机器实际的 EasyTier IPv4，不是网段，也不是其他节点的地址：

```powershell
$EasyTierIp = '<EASYTIER_IPV4>'
Get-NetIPAddress -IPAddress $EasyTierIp -AddressFamily IPv4 |
    Select-Object IPAddress, InterfaceAlias, AddressState
```

应能看到对应网卡，状态为 `Preferred`。固定监听要求地址稳定：EasyTier 的 DHCP 地址可能因冲突改变，长期使用先配置唯一的静态 IPv4。

## 2. 安装与首次启动

```powershell
Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH.Server*'
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
```

安装通常会创建放行 TCP/22 的规则。这里先禁用宽泛规则，再添加仅匹配 EasyTier 本机地址的规则；**已有 SSH 远程连接时，不要通过该连接执行这一步**。

```powershell
Get-NetFirewallRule -Name OpenSSH-Server-In-TCP -ErrorAction SilentlyContinue |
    Disable-NetFirewallRule

New-NetFirewallRule `
    -Name 'OpenSSH-EasyTier-In-TCP' `
    -DisplayName 'OpenSSH Server (EasyTier)' `
    -Direction Inbound -Action Allow -Protocol TCP `
    -LocalAddress $EasyTierIp -LocalPort 22 -Service sshd -Profile Any

Start-Service sshd
Set-Service -Name sshd -StartupType Automatic
```

这是首次配置的示例；已经有同名自定义规则时，查看并修改原规则，不要重复创建。其他允许 TCP/22 的规则也要检查，否则窄规则不会覆盖它们。下一节再用 `ListenAddress` 限制服务本身。

## 3. 限制监听地址

首次启动会生成 `%ProgramData%\ssh\sshd_config` 和主机密钥。先备份配置，再编辑：

```powershell
$SshdConfig = "$env:ProgramData\ssh\sshd_config"
Copy-Item $SshdConfig "$SshdConfig.bak-$(Get-Date -Format yyyyMMdd-HHmmss)"
notepad $SshdConfig
```

修改现有全局设置，放在第一个 `Match` 之前；`<EASYTIER_IPV4>` 换成真实地址：

```text
Port 22
AddressFamily inet
ListenAddress <EASYTIER_IPV4>
PubkeyAuthentication yes
```

删掉或注释其他有效的 `ListenAddress`，它允许多次出现，**不是后写的自动覆盖前面的**。其余设置也尽量原位修改，不要反复往文件底部追加。

保留默认的管理员匹配块：

```text
Match Group administrators
    AuthorizedKeysFile __PROGRAMDATA__/ssh/administrators_authorized_keys
```

检查语法，通过后才重启：

```powershell
& "$env:WINDIR\System32\OpenSSH\sshd.exe" -t -f $SshdConfig
if ($LASTEXITCODE -eq 0) { Restart-Service sshd }

Get-NetTCPConnection -State Listen -LocalPort 22 |
    Select-Object LocalAddress, LocalPort, OwningProcess
```

应只监听目标 EasyTier IPv4，不是 `0.0.0.0` 或 `::`。需要限制账户时，可在全局段添加 `AllowUsers 用户名`，Windows 的用户 / 组规则要求小写；域账号格式见官方配置文档。

## 4. 生成密钥与核对主机

在**客户端**运行，已有合适密钥可复用，不要覆盖：

```powershell
ssh-keygen -t ed25519 -a 64 -C 'my-laptop'
Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub"
```

Linux / macOS 客户端同样用 `ssh-keygen`，用 `cat ~/.ssh/id_ed25519.pub` 查看公钥。复制 `.pub` 的一整行；私钥留在客户端，可以设置口令并用 ssh-agent 管理。

首次连接时，用 Windows 本机输出核对主机指纹：

```powershell
Get-ChildItem "$env:ProgramData\ssh\ssh_host_*_key.pub" |
    ForEach-Object { ssh-keygen -lf $_.FullName }
```

## 5. 公钥放在哪个文件

### 普通用户

用**准备登录的 Windows 用户**身份创建文件：

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.ssh"
notepad "$env:USERPROFILE\.ssh\authorized_keys"
```

粘贴公钥，保存为纯文本且不要多出 `.txt` 后缀。不要从另一个管理员账号运行这段后，误把密钥写进管理员自己的用户目录。

### Administrators 组用户

默认配置下，管理员账号使用共享的 `%ProgramData%\ssh\administrators_authorized_keys`，不是各自用户目录中的文件。在管理员 PowerShell 中：

```powershell
$AdminKeys = "$env:ProgramData\ssh\administrators_authorized_keys"
notepad $AdminKeys
icacls.exe $AdminKeys /inheritance:r /grant:r '*S-1-5-32-544:F' '*S-1-5-18:F'
icacls.exe $AdminKeys
```

两个 SID 分别是 Administrators 和 SYSTEM，避免系统语言不同导致组名失效。最终 ACL 应只包含这两者；上述命令会去掉继承权限，但**不会移除其他账号已经存在的显式权限**，有额外项需在文件的「安全 → 高级」中移除。

共享文件里的密钥可用于匹配到该配置的管理员账号，并非每个管理员隔离。只需要普通远程操作时，用标准用户更直接。Windows OpenSSH 密钥认证支持本地与 AD 域账号，不支持 Entra ID 账号。

## 6. 确认密钥有效，再关闭密码登录

从另一台 EasyTier 节点发起**新连接**。以下命令在客户端 PowerShell 执行，修改用户名和地址；强制只尝试公钥，避免实际靠密码登录却误以为密钥成功：

```powershell
ssh -o PreferredAuthentications=publickey -o PasswordAuthentication=no -o IdentitiesOnly=yes -i "$HOME/.ssh/id_ed25519" '<username>@<EASYTIER_IPV4>'
```

失败时加 `-vvv` 看客户端日志。成功后在服务端配置的全局段设置：

```text
PasswordAuthentication no
```

检查并重启：

```powershell
& "$env:WINDIR\System32\OpenSSH\sshd.exe" -t -f $SshdConfig
if ($LASTEXITCODE -eq 0) { Restart-Service sshd }
```

再新开一次连接确认。Windows Hello PIN 不是账号密码；不要把 PIN 当作 SSH 密码输入。

## 7. 可选：默认进入 PowerShell

OpenSSH 默认进入 `cmd.exe`。想改成 PowerShell 7，使用全机可访问的 MSI / ZIP 安装路径，**不要直接使用当前用户 WindowsApps 下的 `pwsh` 别名**。MSIX 安装限制见 [PowerShell](./PowerShell.md)。

管理员 PowerShell 中，以下以常见的全机安装位置为例，ZIP 安装时改成实际路径：

```powershell
$PwshPath = 'C:\Program Files\PowerShell\7\pwsh.exe'
if (!(Test-Path -LiteralPath $PwshPath)) { throw '请先确认 PowerShell 安装路径' }
if (!(Test-Path -LiteralPath 'HKLM:\SOFTWARE\OpenSSH')) {
    New-Item -Path 'HKLM:\SOFTWARE\OpenSSH' -ErrorAction Stop | Out-Null
}
New-ItemProperty -Path 'HKLM:\SOFTWARE\OpenSSH' -Name DefaultShell `
    -Value $PwshPath -PropertyType String -Force
```

重新 SSH 登录确认。没有全机 PowerShell 7 时，保留 `cmd.exe` 也完全可用。

## 8. 排错与重启检查

| 现象 | 检查点 |
| :--- | :--- |
| 无法绑定地址、错误 10049 | EasyTier IP 是否存在、是否已变更 |
| 服务启动失败 | 先 `sshd.exe -t -f ...`，再看服务和事件日志 |
| 超时或拒绝连接 | EasyTier 连通性、TCP/22 监听地址、防火墙规则 |
| `Permission denied (publickey)` | 登录账号、普通 / 管理员密钥路径、公钥内容和 ACL |
| 主机指纹改变 | 在本机核对，不直接删除 known_hosts 忽略它 |

需要详细日志时，在全局段临时设 `LogLevel VERBOSE`，重启后查看事件查看器的 OpenSSH 日志。使用 `SyslogFacility LOCAL0` 可写文件日志到 `%ProgramData%\ssh\logs`。

最后做一次冷启动检查：EasyTier 地址恢复、`Get-Service sshd` 显示 Running、监听地址正确、另一节点能用密钥登录。**自动启动不保证 EasyTier 地址先就绪**；若启动时绑定失败，待地址出现后在本机 `Start-Service sshd`，再按实际部署安排启动顺序或重试。

## 参考链接

* [OpenSSH 安装与服务](https://learn.microsoft.com/windows-server/administration/openssh/openssh_install_firstuse)
* [Windows OpenSSH 配置](https://learn.microsoft.com/windows-server/administration/openssh/openssh-server-configuration)
* [密钥与 ACL](https://learn.microsoft.com/windows-server/administration/openssh/openssh_keymanagement)
* [sshd_config 手册](https://man.openbsd.org/sshd_config)
* [EasyTier 配置项](https://easytier.cn/en/guide/network/configurations.html)
