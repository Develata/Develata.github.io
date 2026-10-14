---
title: Winget
date: 2026-10-14
order: 1
---

# WinGet 使用指南

WinGet 是微软的 Windows 包管理命令行工具，适合搜索、安装和更新常见桌面软件，也能导出软件清单，重装系统时少点几次安装器。

## 1. 安装与检查

WinGet 随 **App Installer（应用安装程序）** 分发，支持 Windows 10 1809 及以上、Windows 11 和 Windows Server 2025。桌面 Windows 可以从 Microsoft Store 安装或更新 App Installer。

```powershell
winget --version
winget --info
```

刚登录新系统时，App Installer 的注册可能还没完成。如果已安装但命令没出现，可以请求重新注册，再打开终端：

```powershell
Add-AppxPackage -RegisterByFamilyName -MainPackage Microsoft.DesktopAppInstaller_8wekyb3d8bbwe
```

这条命令不是下载器；缺少 App Installer 时仍需先安装它。Server 2025 仅 Desktop Experience 提供 WinGet，不把它当作旧版 Server 的通用安装方式。

## 2. 搜索与安装

先查软件 ID，再安装，避免同名软件选错：

```powershell
winget search vscode
winget show --id Microsoft.VisualStudioCode --exact --source winget
winget install --id Microsoft.VisualStudioCode --exact --source winget
winget install --id Git.Git --exact --source winget
```

`--exact`（缩写 `-e`）要求精确匹配，`--source` 指定软件源。普通终端即可运行，需要提升权限的安装器会请求 UAC。

常用命令里的 `<id>` 和 `<keyword>` 都要替换成实际值：

| 操作 | 命令 |
| :--- | :--- |
| 搜索 | `winget search <keyword>` |
| 查看详情 | `winget show --id <id> --exact` |
| 安装 | `winget install --id <id> --exact` |
| 已安装清单 | `winget list` |
| 可升级清单 | `winget upgrade` |
| 升级单个 | `winget upgrade --id <id> --exact` |
| 升级全部 | `winget upgrade --all` |
| 卸载 | `winget uninstall --id <id> --exact` |

编写批量脚本时，可用 `--accept-package-agreements --accept-source-agreements` 接受协议；`--silent` 请求静默安装，但不代表不需要权限，也不保证每个安装器都能完全无交互。

## 3. 更新与固定版本

```powershell
winget upgrade
winget upgrade --id Microsoft.PowerToys --exact
```

想一起更新时用 `winget upgrade --all`。WinGet 也能识别部分手动安装的软件，但能否升级取决于已装版本、manifest 匹配和安装器支持。

有兼容性问题时，可以临时 pin：

```powershell
# 跳过批量升级，仍允许显式升级该软件
winget pin add --id Microsoft.PowerToys --exact
winget pin list

# 解除
winget pin remove --id Microsoft.PowerToys --exact
```

另外两种方式，按需选用，不必依次执行：

* `winget pin add --id <id> --exact --blocking`：连显式升级也阻止；可以解除 pin，或用升级命令的 `--force` 覆盖。
* `winget pin add --id <id> --exact --version '1.2.*'`：只允许指定版本范围，`1.2.*` 是示例，不是推荐版本。

Pin 只控制 WinGet，不会阻止软件自己的自动更新器。

## 4. 软件源

```powershell
winget source list
winget source update
```

当前官方文档列出三个默认源：

| Source | 内容 |
| :--- | :--- |
| `winget` | 社区维护的应用 manifest |
| `msstore` | Microsoft Store 软件 |
| `winget-font` | 字体；默认需要显式指定 `--source winget-font` |

旧客户端可能没有字体源，具体看本机列表。第三方源按需添加；下载或校验出错时先查来源和日志，不用 `--ignore-security-hash` 绕过校验。

## 5. 导出与恢复

```powershell
winget export --output winget-packages.json
```

想一并记录版本，加 `--include-versions`：

```powershell
winget export --output winget-packages.json --include-versions
```

新机器检查清单后导入：

```powershell
winget import --import-file winget-packages.json
```

| 可选参数 | 用途 |
| :--- | :--- |
| `--ignore-unavailable` | 跳过不可用的软件，继续安装其他项 |
| `--ignore-versions` | 忽略清单版本，安装当前可用版本 |
| `--no-upgrade` | 不升级目标机器上已有的软件 |

导出时提示无法匹配的软件不会完整进入清单，需另行记录。清单也不包含账号、项目、软件配置和许可证，不是整机备份。

## 6. 进阶：配置文件

只需要装软件时，`export` / `import` 就够了。想把安装和系统配置一起描述，可以使用 WinGet Configuration（至少需要 WinGet 1.6.2631）：

```powershell
winget configure show --file .\machine.dsc.winget
winget configure test --file .\machine.dsc.winget
winget configure --file .\machine.dsc.winget
```

上面依次是查看、检查当前状态、应用配置。配置会调用 DSC 资源，`test` 也不是沙箱；只运行了解来源和内容的配置文件。

## 7. 排错与 Scoop 分工

```powershell
winget --info
winget list --open-logs
```

需要更详细的日志时，在失败的命令后加 `--verbose-logs`。先区分软件源、下载、安装器、权限还是需要重启；`winget source reset --force` 会重置软件源，不是每次失败都要执行。

简单分工：**桌面软件优先 WinGet，CLI / 便携工具可以选 Scoop**。已经由其中一个管理的软件，就继续用原来的工具更新，避免重复安装。

## 参考链接

* [WinGet 概览与安装](https://learn.microsoft.com/windows/package-manager/winget/)
* [安装参数](https://learn.microsoft.com/windows/package-manager/winget/install)
* [软件源](https://learn.microsoft.com/windows/package-manager/winget/source)
* [Pin](https://learn.microsoft.com/windows/package-manager/winget/pinning)
* [导出](https://learn.microsoft.com/windows/package-manager/winget/export) / [导入](https://learn.microsoft.com/windows/package-manager/winget/import)
* [Configuration](https://learn.microsoft.com/windows/package-manager/winget/configure)
