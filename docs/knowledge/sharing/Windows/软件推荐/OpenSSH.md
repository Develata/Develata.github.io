---
title: OpenSSH
date: 2026-2-05
order: 2
---

# OpenSSH Server (Windows 11 + EasyTier)

作用：在 Windows 11 上启用 OpenSSH Server，可以从其它客户端通过SSH连接到 windows 11 cli，且**只监听内网 IP+密钥登录**，内网穿透IP可以用Easytier解决。。

## 1. 前置：确认 EasyTier 主机 IP

`ListenAddress` 必须提前知道**主机 IP**（例如 `10.144.51.4`），不能填网段（例如 `10.144.51.0`）。

**管理员 PowerShell**：Win+R 输入 `powershell`，按 Ctrl+Shift+Enter。

```powershell
Get-NetIPConfiguration | Format-Table InterfaceAlias,IPv4Address
```

或：

```powershell
ipconfig
```

---

## 2. 安装并启用 OpenSSH Server

管理员 PowerShell：

```powershell
Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH.Server*'
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
```

启动并设为开机自启：

```powershell
Start-Service sshd
Set-Service -Name sshd -StartupType Automatic
Get-Service sshd
```

若不想开机自启：

```powershell
Set-Service -Name sshd -StartupType Manual
```

以后每次用`Start-Service sshd`这个命令手动启动。

（可选）SSH默认 Shell 改为 PowerShell：

```powershell
New-ItemProperty -Path "HKLM:\SOFTWARE\OpenSSH" -Name DefaultShell `
  -Value "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" `
  -PropertyType String -Force
```

---

## 3. 配置 sshd：只允许通过 EasyTier 内网访问

配置文件：`C:\ProgramData\ssh\sshd_config`

管理员 PowerShell 打开：

```powershell
notepad C:\ProgramData\ssh\sshd_config
```

最小可用配置（按需替换端口与 IP）：

```text
Port 22
AddressFamily inet

# 只监听 EasyTier 主机 IP
ListenAddress 10.144.51.4

PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# 仅用于过渡排错：若你只有 PIN，没有 Windows 密码，这里最终应设为 no
PasswordAuthentication yes

Subsystem sftp sftp-server.exe
```

应用配置：

```powershell
Restart-Service sshd
```

---

## 4. 验证监听是否正确

```powershell
netstat -ano | findstr ":22"
```

期望看到：`10.144.51.4:22 LISTENING`

不应看到：`0.0.0.0:22` 或 `[::]:22`

---

## 5. 密钥登录

### 5.1 客户端生成密钥

Termux / Linux / macOS / WSL：

```bash
ssh-keygen -t ed25519
cat ~/.ssh/id_ed25519.pub
```

Windows PowerShell：

```powershell
ssh-keygen -t ed25519
type $env:USERPROFILE\.ssh\id_ed25519.pub
```

复制整行公钥（以 `ssh-ed25519` 开头）。

---

## 6. 将公钥放到 Windows

### 6.1 普通用户

路径：`C:\Users\<用户名>\.ssh\authorized_keys`

示例（用户 `USER`）：

```powershell
mkdir C:\Users\USER\.ssh -Force
notepad C:\Users\USER\.ssh\authorized_keys
```

### 6.2 用户属于 Administrators 组（关键）

Windows OpenSSH 对管理员组默认使用：`C:\ProgramData\ssh\administrators_authorized_keys`

检查：

```powershell
whoami
net localgroup administrators
```

写入：

```powershell
notepad C:\ProgramData\ssh\administrators_authorized_keys
```

---

## 7. 修复 Windows 权限（必做）

普通用户（替换用户名与路径）：

```powershell
icacls C:\Users\USER\.ssh /inheritance:r
icacls C:\Users\USER\.ssh /grant "USER:(F)"
icacls C:\Users\USER\.ssh /grant "SYSTEM:(F)"

icacls C:\Users\USER\.ssh\authorized_keys /inheritance:r
icacls C:\Users\USER\.ssh\authorized_keys /grant "USER:(R)"
icacls C:\Users\USER\.ssh\authorized_keys /grant "SYSTEM:(F)"
```

管理员组：

```powershell
icacls C:\ProgramData\ssh\administrators_authorized_keys /inheritance:r
icacls C:\ProgramData\ssh\administrators_authorized_keys /grant "Administrators:(R)"
icacls C:\ProgramData\ssh\administrators_authorized_keys /grant "SYSTEM:(F)"
```

应用权限：

```powershell
Restart-Service sshd
```

---

## 8. 客户端连接

```bash
ssh -p 22 USER@10.144.51.4
```

调试：

```bash
ssh -vvv -p 22 USER@10.144.51.4
```

---

## 9. 排错（速查）

配置语法自检：

```powershell
& "$env:WINDIR\System32\OpenSSH\sshd.exe" -t -f C:\ProgramData\ssh\sshd_config
echo $LASTEXITCODE
```

前台 Debug（定位绑定/读 key/权限）：

```powershell
Stop-Service sshd
cd $env:WINDIR\System32\OpenSSH
.\sshd.exe -ddd -f C:\ProgramData\ssh\sshd_config
```

退出 debug 后恢复服务：

```powershell
Start-Service sshd
```

常见错误：

| 现象 | 常见原因 | 修复 |
| :--- | :--- | :--- |
| `Cannot bind any address` / `ERROR:10049` | `ListenAddress` 填了网段或不存在 IP | 填 EasyTier 主机 IP |
| `Authentication failed with public key` | 公钥位置不对 / 权限不对 / key 粘贴断行 | 检查管理员组路径 + `icacls` |
| 密码总失败（只有 PIN） | PIN 不是 Windows 密码 | 用密钥登录；或设置 Windows Password |

---

## 10. 收尾加固

确认密钥登录稳定后，关闭密码登录：

```text
PasswordAuthentication no
```

```powershell
Restart-Service sshd
```

---

## 11. 检查清单

* `netstat` 仅监听：`10.144.51.4:22 LISTENING`
* `ssh -p 22 USER@10.144.51.4` 可用密钥登录
* 若用户在 Administrators 组：公钥在 `C:\ProgramData\ssh\administrators_authorized_keys`
* 已设置 `PasswordAuthentication no`（可选但推荐）
