---
title: PowerShell
date: 2026-10-14
order: 2
---

# PowerShell 使用指南

PowerShell 不只是「Windows 版 Bash」：它的管道主要传递对象，处理进程、服务、JSON 和系统配置很方便。日常使用建议装 PowerShell 7，再搭配 Windows Terminal。

## 1. 先分清 shell 和终端

| 工具 | 启动命令 | 说明 |
| :--- | :--- | :--- |
| Windows PowerShell 5.1 | `powershell.exe` | 系统自带，部分旧 Windows 模块仍需要它 |
| PowerShell 7 | `pwsh.exe` | 开源、跨平台，与 5.1 并存 |
| Windows Terminal | `wt.exe` | 管标签页、字体和配色，可以运行上述两种 shell，也可以运行 WSL |

查看当前环境：

```powershell
$PSVersionTable
$PSHOME
```

## 2. 安装与更新

Windows 桌面端可以直接用 [WinGet](./Winget.md)：

```powershell
winget search --id Microsoft.PowerShell --exact
winget install --id Microsoft.PowerShell --exact --source winget
```

重新打开终端后运行：

```powershell
pwsh --version
```

更新：

```powershell
winget upgrade --id Microsoft.PowerShell --exact
```

**安装格式需要留意**：从 PowerShell 7.6.0 起，WinGet 默认安装 MSIX。它适合日常交互，但有全局配置和入站远程会话方面的限制。要给 OpenSSH Server 配默认 shell，优先使用全机可访问的 MSI / ZIP 安装，不要直接拿当前用户的 WindowsApps 别名来配置服务。

需要 MSI 且目标版本仍提供它时：

```powershell
winget install --id Microsoft.PowerShell --exact --source winget --installer-type wix
```

微软文档说明从 7.7.0 起不再提供 MSI；离线安装、多版本共存可到 [官方 Releases](https://github.com/PowerShell/PowerShell/releases) 选择对应架构的 ZIP。具体版本以安装时的查询结果为准。

## 3. 执行策略与管理员权限

遇到「禁止运行脚本」时先看实际策略，不必直接改成 `Bypass`：

```powershell
Get-ExecutionPolicy
Get-ExecutionPolicy -List
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

`RemoteSigned` 允许本地脚本，带 Internet 来源标记的脚本通常需要签名。对已经检查过的下载脚本，可以单独解除标记：

```powershell
Unblock-File -Path .\script.ps1
```

执行策略不是沙箱，组策略也可以覆盖当前用户设置。不同 PowerShell 版本的默认行为有差异，以 `Get-ExecutionPolicy` 为准。

确实需要管理服务、安装系统组件时，再打开管理员窗口：

```powershell
Start-Process pwsh -Verb RunAs
```

## 4. Profile：保存日常配置

在实际使用的 shell 中查看路径：

```powershell
$PROFILE | Select-Object *
```

PowerShell 7 与 5.1 的 Profile 分开；VS Code、ISE 等宿主也可能使用不同文件。Windows Terminal 本身不会为同一个 PowerShell ConsoleHost 另建一套 `$PROFILE`。

创建文件时先判断是否存在，避免覆盖原有配置：

```powershell
if (!(Test-Path -LiteralPath $PROFILE)) {
    New-Item -ItemType Directory -Path (Split-Path -Parent $PROFILE) -Force | Out-Null
    New-Item -ItemType File -Path $PROFILE | Out-Null
}
notepad $PROFILE
```

把别名、函数、提示符等放进去。修改后重新加载：

```powershell
. $PROFILE
```

如果 Profile 写坏了，用不加载配置的方式启动：

```powershell
pwsh -NoProfile
```

## 5. 对象管道与常用命令

```powershell
# 内存占用最高的五个进程
Get-Process |
    Sort-Object WorkingSet -Descending |
    Select-Object -First 5 Name, Id, WorkingSet

# 正在运行的 Windows 服务
Get-Service | Where-Object Status -eq 'Running'

# 导出结构化数据
Get-Process |
    Select-Object Name, Id, CPU, WorkingSet |
    Export-Csv .\processes.csv -NoTypeInformation -Encoding utf8

# 生成 JSON
@{ name = 'example'; enabled = $true } | ConvertTo-Json
```

| 操作 | 命令 |
| :--- | :--- |
| 列目录、读文件 | `Get-ChildItem`、`Get-Content` |
| 复制、移动 | `Copy-Item`、`Move-Item` |
| 删除前预演 | `Remove-Item .\example.txt -WhatIf` |
| 找命令与参数 | `Get-Command Get-Process -Syntax` |
| 查看帮助 | `Get-Help Get-Process -Full` |
| 环境变量 | `Get-ChildItem Env:`、`$env:Path` |
| 测量耗时 | `Measure-Command { Get-ChildItem -Recurse }` |
| 同时显示和保存 | `Get-Process \| Tee-Object -FilePath .\processes.txt` |

对象管道主要指 PowerShell 命令之间的传递；调用 `git`、`ssh` 等外部程序时，仍要处理文本输出和 `$LASTEXITCODE`。

## 6. 模块与交互增强

新版 PowerShell 使用 `Microsoft.PowerShell.PSResourceGet` 管理模块。先检查命令是否可用：

```powershell
Get-Command Install-PSResource
Get-PSResourceRepository
```

以 `posh-git` 为例：

```powershell
Find-PSResource -Name posh-git -Repository PSGallery
Install-PSResource -Name posh-git -Scope CurrentUser -Repository PSGallery
Import-Module posh-git
Get-InstalledPSResource
Update-PSResource -Name posh-git
```

如果没有 `Install-PSResource`，按[官方安装说明](https://learn.microsoft.com/powershell/gallery/powershellget/install-powershellget)安装 PSResourceGet。模块装好后不会自动加载到每次会话，可以把需要的 `Import-Module` 放进 Profile。

| 工具 | 用途 |
| :--- | :--- |
| PSReadLine | 命令行编辑、历史与补全，PowerShell 通常已附带 |
| posh-git | Git 状态与补全 |
| Terminal-Icons | 文件和目录图标，需要合适的字体 |
| Oh My Posh | 提示符主题；现在按独立程序安装，不沿用旧的模块安装教程 |

Profile 里只放经常用的模块，启动太慢时先用 `pwsh -NoProfile` 对照。Windows 旧模块不兼容时，可单独回到 `powershell.exe` 执行，不必降级整套环境。

## 参考链接

* [Windows 安装方式与 MSIX 限制](https://learn.microsoft.com/powershell/scripting/install/installing-powershell-on-windows)
* [执行策略](https://learn.microsoft.com/powershell/module/microsoft.powershell.core/about/about_execution_policies)
* [Profile](https://learn.microsoft.com/powershell/module/microsoft.powershell.core/about/about_profiles)
* [PSResourceGet](https://learn.microsoft.com/powershell/gallery/powershellget/overview)
