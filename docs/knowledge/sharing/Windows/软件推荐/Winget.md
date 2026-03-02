---
title: Winget
date: 2026-2-11
order: 1
---

# Winget 使用指南

[Winget github repo](https://github.com/microsoft/winget-cli)

## 1. 什么是 Winget
`winget`（Windows Package Manager CLI）是微软官方包管理器，用于发现、安装、升级、卸载软件。
- **系统集成**：随 **App Installer** 分发更新（Windows 10 1809+ / Windows 11 / Windows Server 2025）。
- **覆盖面广**：对 MSI/EXE/MSIX 等安装器生态友好，GUI 软件尤其方便。
- **可复刻环境**：`export/import` 一键恢复常用软件。

## 2. 安装与验证
Windows 10/11 通常已自带（来自 Microsoft Store 的 **App Installer**）。若缺失/过旧：在 Microsoft Store 安装或更新 **App Installer**。
首次登录新系统时 `winget` 可能延迟出现，可在 PowerShell 触发注册：
```powershell
Add-AppxPackage -RegisterByFamilyName -MainPackage Microsoft.DesktopAppInstaller_8wekyb3d8bbwe
```
```powershell
winget --version
winget --info
winget source list
```

## 3. 常用命令
| 目的 | 命令 |
| :--- | :--- |
| 搜索 | `winget search <keyword>`（可用 `--id/--name/--tag/--command` 过滤） |
| 详情 | `winget show --id <id>` |
| 安装 | `winget install --id <id> -e`（推荐：`--id + -e`） |
| 已装 | `winget list` |
| 可升级 | `winget upgrade` |
| 全量升级 | `winget upgrade --all`（可加 `--include-unknown/--include-pinned`） |
| 卸载 | `winget uninstall --id <id> -e` |
| 迁移 | `winget export` / `winget import` |
| Source | `winget source list/update` |
| 锁版本 | `winget pin add/list/remove` |

常用写法（减少交互提示、避免歧义）：
```powershell
winget install --id Git.Git -e --accept-package-agreements --accept-source-agreements
winget install --id Microsoft.VisualStudioCode -e --accept-package-agreements --accept-source-agreements
winget upgrade --all --accept-package-agreements --accept-source-agreements
```
常用参数（是否生效取决于安装器/清单）：`-s, --source winget|msstore`、`-h, --silent`、`-i, --interactive`、`-v, --version`、`--scope user|machine`、`--override/--custom`、`-l, --location`。

## 4. 迁移与复刻环境：export / import
```powershell
winget export -o winget-packages.json
winget export -o winget-packages.json --include-versions
winget import -i winget-packages.json --accept-package-agreements --accept-source-agreements
```
导入常用选项：`--ignore-unavailable`（有的包找不到也继续）、`--ignore-versions`（忽略版本装最新版）、`--no-upgrade`（已装则不升级）。

## 5. Source 与字体仓库
默认 Source 通常包含 `winget`（社区）、`msstore`（商店）、`winget-font`（字体）。其中 `winget-font` 常为 `Explicit=true`，需要显式指定 `-s winget-font` 才参与搜索/安装。
```powershell
winget source list
winget source update
```

## 6. Pin（锁版本/阻止升级）
`pin` 用于限制 WinGet 升级行为：pinning（不参与 `upgrade --all`）、blocking（禁止升级）、gating（允许的版本范围，如 `1.2.*`）。
```powershell
winget pin add --id Microsoft.PowerToys -e
winget pin add --id Microsoft.PowerToys -e --blocking
winget pin add --id Microsoft.PowerToys -e --version 0.70.*
winget pin list
```

## 7. 故障排查（日志/修复/常见限制）
```powershell
winget --info
winget list --open-logs
winget install <pkg> --verbose-logs
```
若 `winget` 本身异常，可用 PowerShell 模块修复：
```powershell
Install-Module -Name Microsoft.WinGet.Client -Force -Repository PSGallery
Repair-WinGetPackageManager -Force -Latest
```
常见现象：厂商可能限制 `winget` 下载 UA 导致 403；`winget` CLI 不支持 system context。

## 8. Winget vs Scoop：怎么选
结合 `docs/knowledge/sharing/Windows/软件推荐/Scoop.md`：GUI/桌面软件优先 `winget`；CLI/开发工具链与“用户目录不污染”优先 `scoop`；常见最佳组合是两者并用。


## 参考链接

- [Winget GitHub 仓库](https://github.com/microsoft/winget-cli)
- [Winget 官方文档](https://learn.microsoft.com/windows/package-manager/winget/)