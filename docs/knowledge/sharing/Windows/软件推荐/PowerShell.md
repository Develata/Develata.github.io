---
title: PowerShell
date: 2026-3-1
order: 2
---

# PowerShell 使用指南

[PowerShell github repo](https://github.com/PowerShell/PowerShell)

## 1. 什么是 PowerShell

PowerShell 是微软官方跨平台任务自动化 Shell，Windows 11 内置 Windows PowerShell 5.1，推荐额外安装更新的 PowerShell 7（pwsh）。

PowerShell 分两条线：
- **Windows PowerShell 5.1**：内置于 Windows，路径 `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`，不再更新。
- **PowerShell 7（pwsh）**：开源跨平台，持续更新，推荐日常使用。两者可共存。

## 2. 安装 PowerShell 7

### 方法一：使用 MSI 安装包（推荐）

打开 PowerShell 官方 GitHub 发布页[PowerShell github repo release](https://github.com/PowerShell/PowerShell/releases)，找到最新版本，下载适用于 Windows 的 .msi 安装包，默认路径安装即可
安装完成后，搜索 "PowerShell 7" 打开即可（不会覆盖 Windows PowerShell）

### 方法二：通过 Winget 安装（推荐）：

```powershell
winget install --id Microsoft.PowerShell --source winget
```

安装后可直接执行 `pwsh` 启动。

### 验证版本

```powershell
pwsh --version
$PSVersionTable
```

## 3. 以管理员身份运行

- **快捷键**：Win+R 输入 `powershell` 或 `pwsh`，按 **Ctrl+Shift+Enter** 以管理员身份运行。
- **右键菜单**：在开始菜单找到 PowerShell，右键 → "以管理员身份运行"。
- **从已有窗口提权**：

```powershell
Start-Process pwsh -Verb RunAs
```

## 4. 执行策略（ExecutionPolicy）

默认策略可能阻止运行脚本。查看当前策略：

```powershell
Get-ExecutionPolicy -List
```

允许本地脚本运行（推荐开发环境）：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

| 策略 | 含义 |
| :--- | :--- |
| `Restricted` | 不允许运行任何脚本（默认） |
| `RemoteSigned` | 本地脚本可运行；网络下载的脚本需签名 |
| `Unrestricted` | 允许所有脚本（不推荐） |
| `Bypass` | 完全绕过，常用于 CI/自动化 |

## 5. Profile 配置文件

Profile 是 PowerShell 启动时自动执行的脚本，类似 `.bashrc`。

查看 Profile 路径：

```powershell
$PROFILE
$PROFILE | Select-Object *
```

创建并编辑 Profile（若不存在会新建）：

```powershell
if (!(Test-Path $PROFILE)) { New-Item -Path $PROFILE -ItemType File -Force }
notepad $PROFILE
```

常见用途：设置别名、加载模块、自定义提示符（如 oh-my-posh）。

## 6. 常用命令速查

| 目的 | 命令 |
| :--- | :--- |
| 列出文件 | `Get-ChildItem`（别名 `ls`/`dir`/`gci`） |
| 查看内容 | `Get-Content <file>`（别名 `cat`） |
| 复制 | `Copy-Item <src> <dst>` |
| 移动/重命名 | `Move-Item <src> <dst>` |
| 删除 | `Remove-Item <path>` |
| 查看进程 | `Get-Process` |
| 停止进程 | `Stop-Process -Name <name>` |
| 查看服务 | `Get-Service` |
| 查看环境变量 | `$env:PATH`；`Get-ChildItem Env:` |
| 查找命令 | `Get-Command <keyword>` |
| 查看帮助 | `Get-Help <command> -Full` |
| 历史记录 | `Get-History`；`Ctrl+R` 搜索 |
| 测试网络连通性 | `Test-Connection <host>`（类似 ping） |
| DNS 解析 | `Resolve-DnsName <host>` |
| 查看网络接口 | `Get-NetIPAddress` |

## 7. 管道与对象

PowerShell 传递的是**对象**而非纯文本，这与 Bash 不同：

```powershell
# 获取占用内存最多的前5个进程
Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 5 Name, WorkingSet

# 过滤正在运行的服务
Get-Service | Where-Object Status -eq 'Running'

# 导出为 CSV
Get-Process | Export-Csv processes.csv -NoTypeInformation
```

## 8. 模块管理

```powershell
# 搜索模块
Find-Module <keyword>

# 安装模块
Install-Module -Name <ModuleName> -Scope CurrentUser

# 查看已安装模块
Get-InstalledModule

# 更新模块
Update-Module -Name <ModuleName>

# 导入模块
Import-Module <ModuleName>
```

常用模块推荐：

| 模块 | 用途 |
| :--- | :--- |
| `PSReadLine` | 命令行编辑增强（Windows PowerShell 5.1 已内置） |
| `posh-git` | Git 状态提示 |
| `Terminal-Icons` | 终端文件图标 |
| `Microsoft.WinGet.Client` | PowerShell 内操作 WinGet |

> **注**：`oh-my-posh` 已从 PowerShell 模块迁移为独立可执行程序，推荐通过 `winget install JanDeDobbeleer.OhMyPosh` 安装，不再使用 `Install-Module oh-my-posh`。

## 9. 实用技巧

```powershell
# 测量命令耗时
Measure-Command { Get-ChildItem -Recurse }

# 将输出同时显示并写入文件
Get-Process | Tee-Object -FilePath processes.txt

# 后台运行任务
$job = Start-Job { ping 8.8.8.8 -n 4 }
Receive-Job $job -Wait

# 字符串格式化
"Hello, {0}! Today is {1}" -f "World", (Get-Date -Format "yyyy-MM-dd")

# 快速打开当前目录资源管理器
explorer .

# 重新加载 Profile（不重启终端）
. $PROFILE
```

## 10. 与 Windows Terminal 配合

推荐搭配 **Windows Terminal** 使用 PowerShell 7，可在设置中将 `pwsh` 设为默认配置文件。

参考：[Windows Terminal 文档](https://learn.microsoft.com/windows/terminal/)

---

## 参考链接

- [PowerShell 官方文档](https://learn.microsoft.com/powershell/)
- [PowerShell GitHub 仓库](https://github.com/PowerShell/PowerShell)