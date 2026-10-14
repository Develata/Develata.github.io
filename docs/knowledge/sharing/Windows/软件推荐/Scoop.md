---
title: Scoop
date: 2026-10-14
order: 3
---

# Scoop 使用指南

[Scoop](https://github.com/ScoopInstaller/Scoop) 是 Windows 下的开源命令行包管理器。默认把软件装在用户目录，用 shim 统一命令入口，很适合 CLI、便携软件和开发工具。

普通桌面软件也可以用 [WinGet](./Winget.md)。两者可以并存，同一个软件尽量只交给其中一个管理。

## 1. 安装

使用 Windows PowerShell 5.1 或新版 PowerShell，打开**非管理员**窗口：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
irm https://get.scoop.sh | iex
```

默认安装到 `C:\Users\<用户名>\scoop`。安装器要求 `FullLanguage` 模式；如果是受组策略限制的机器，先检查：

```powershell
$ExecutionContext.SessionState.LanguageMode
Get-ExecutionPolicy -List
```

验证：

```powershell
scoop --version
scoop checkup
```

想先查看脚本或自定义安装位置，可以改用：

```powershell
irm https://get.scoop.sh -OutFile .\install.ps1
notepad .\install.ps1
.\install.ps1 -?
.\install.ps1 -ScoopDir 'D:\Applications\Scoop'
```

通常不需要管理员安装；确有需要时，官方安装器提供 `-RunAsAdmin` 参数。

## 2. Git 与软件库

先装 Git，再添加需要的 bucket：

```powershell
scoop install git
scoop bucket add extras
scoop bucket list
scoop search vscode
scoop install extras/vscode
```

| Bucket | 内容 |
| :--- | :--- |
| `main` | 默认库，以常用 CLI 为主 |
| `extras` | 常见桌面软件及其他不符合 main 收录条件的应用 |
| `versions` | 替代版本 |
| `java`、`php` | 对应语言工具 |
| `nerd-fonts` | 带图标的字体 |
| `games` | 游戏与相关工具 |
| `nonportable` | 需要传统安装方式的软件，可能触发 UAC |

不必一次添加所有 bucket。第三方库的 manifest 可以包含安装脚本，遇到陌生来源先看：

```powershell
scoop info extras/vscode
scoop cat extras/vscode
```

Scoop 以用户目录安装为主，但不是沙箱，也不保证所有软件都不写注册表。

## 3. 常用命令

`<app>` 要替换为实际软件名。

| 操作 | 命令 |
| :--- | :--- |
| 搜索、详情 | `scoop search <keyword>`、`scoop info <app>` |
| 安装、卸载 | `scoop install <app>`、`scoop uninstall <app>` |
| 查看已装软件 | `scoop list` |
| 更新 Scoop 与 bucket | `scoop update` |
| 查看可升级项 | `scoop status` |
| 更新单个、全部 | `scoop update <app>`、`scoop update *` |
| 删除旧安装版本 | `scoop cleanup <app>`、`scoop cleanup *` |
| 查看下载缓存 | `scoop cache show` |
| 删除某软件的下载缓存 | `scoop cache rm <app>` |
| 查看帮助、诊断 | `scoop help <command>`、`scoop checkup` |

日常更新顺序：

```powershell
scoop update
scoop status
scoop update *
```

确认新版正常后再 `scoop cleanup *`。**旧安装版本和下载缓存是两回事**，`cleanup` 不等于清空下载缓存。

应用的 `persist` 数据通常会在升级、普通卸载时保留；具体保留哪些文件由 manifest 决定。不要把整个 Scoop 目录当作项目和应用数据的唯一备份。

## 4. 开发工具

按需要选择：

```powershell
scoop install python
scoop install nodejs-lts
scoop install go

# Java 需要对应 bucket
scoop bucket add java
scoop install java/openjdk

# 常用 CLI
scoop install ripgrep fd fzf bat neovim 7zip ffmpeg
```

Python 项目的依赖仍放在 venv / uv 环境中。语言版本有项目要求时，先 `scoop search` 确认对应包，不把最新版本当作唯一选择。

### Rust 与 C/C++

Windows 上使用 Rust MSVC 工具链，需要 Microsoft C++ Build Tools 和 Windows SDK。先按 [Rust 官方安装说明](https://www.rust-lang.org/tools/install)准备链接器，再使用 rustup：

```powershell
scoop install rustup
rustup show
rustc --version
cargo --version
```

只需要 GCC 做小项目或刷题，可以选择：

```powershell
scoop install gcc
```

MSVC 和 GNU 是不同工具链，按项目依赖选择，不必为了省一次安装强行切换。

## 5. 下载与代理

可选的多连接下载器：

```powershell
scoop install aria2
```

Scoop 默认允许使用已安装的 aria2。遇到下载站点限流或连接异常，可以暂时关闭：

```powershell
scoop config aria2-enabled false
```

给已安装的 Scoop 设置代理，端口换成自己的：

```powershell
scoop config proxy 127.0.0.1:7890
```

移除自定义代理，恢复使用系统代理设置：

```powershell
scoop config rm proxy
```

如果是安装器本身下载失败，可以显式传代理：

```powershell
iex "& {$(irm https://get.scoop.sh -Proxy 'http://127.0.0.1:7890')} -Proxy 'http://127.0.0.1:7890'"
```

## 6. 导出与恢复清单

```powershell
scoop export | Out-File -FilePath .\Scoopfile.json -Encoding utf8
```

新机器先安装 Scoop，检查并删掉清单里不需要的软件，再导入：

```powershell
scoop import .\Scoopfile.json
```

Scoopfile 用来恢复软件和 bucket，不包含项目、密钥、许可证或完整应用数据。

## 参考链接

* [Scoop 主仓库](https://github.com/ScoopInstaller/Scoop)
* [官方安装器与参数](https://github.com/ScoopInstaller/Install)
* [命令列表](https://github.com/ScoopInstaller/Scoop/wiki/Commands)
* [配置项与代理说明](https://github.com/ScoopInstaller/Scoop/blob/master/libexec/scoop-config.ps1)
