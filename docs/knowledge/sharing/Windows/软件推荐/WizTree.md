---
title: WizTree
date: 2026-08-09
order: 13
---

# WizTree 使用指南

## 1. 什么是 WizTree

[WizTree 官网](https://diskanalyzer.com/)

WizTree 是 Antibody Software 开发的 Windows 磁盘空间分析器。它扫描磁盘后用目录树、文件列表和 Treemap 显示空间分布，帮助你快速回答：

* 哪个目录占用了最多空间？
* 最大的文件在哪里？
* 是单个大文件，还是大量小文件挤满了磁盘？
* 某类文件或最近生成的文件占用了多少空间？

在 NTFS 卷上，WizTree 以管理员权限直接读取 Master File Table（MFT），因此通常比逐目录遍历快很多。它也能扫描 FAT、USB、网络盘和单独目录，只是这些位置无法获得同样的 MFT 加速。

WizTree 是 proprietary freeware：**个人使用免费，商业使用需要符合官方许可并购买相应 Supporter / Enterprise license**。它不是开源软件，也不是自动清理器；它提供空间证据，删除什么仍由用户负责。

---

## 2. 安装

### 2.1 使用 Scoop 安装（推荐）

先安装 [Scoop](./Scoop.md)，然后执行：

```powershell
scoop bucket add extras
scoop update
scoop install extras/wiztree
```

验证：

```powershell
scoop list wiztree
scoop prefix wiztree
```

从开始菜单启动 **WizTree**，或在 PowerShell 中运行：

```powershell
WizTree
```

Scoop 安装的是官方 portable package，并持久化 `WizTree3.ini`。更新和卸载：

```powershell
scoop update wiztree
scoop uninstall wiztree
```

### 2.2 管理员权限怎么选

Scoop 版默认不强制以管理员身份运行。两种模式的区别：

* **管理员运行**：扫描整个 NTFS 卷时可直接读取 MFT，速度最快，也能看到更多受保护路径。
* **普通用户运行**：权限更小，适合扫描自己的目录、网络盘或不需要 MFT 加速的目标。

日常建议普通权限启动；分析整个系统盘时再右键“以管理员身份运行”。不要仅为了省一次 UAC 就让所有启动永久提升。

---

## 3. 第一次扫描

1. 启动 WizTree。
2. 在左上角选择驱动器，例如 `C:`。
3. 点击 **Scan**。
4. 等待扫描完成，先看顶层目录占比，再逐层展开。

三个视图各有分工：

| 视图 | 回答的问题 |
| :--- | :--- |
| **Tree View** | 哪个目录及其子目录最占空间？ |
| **File View** | 哪些单个文件最大？哪些类型最多？ |
| **Treemap** | 空间在视觉上集中在哪里？是否存在异常大块？ |

推荐顺序是 **Tree View 定位目录 → File View 找具体文件 → Treemap 观察整体结构**，不要只盯着最显眼的彩色方块直接删除。

---

## 4. 正确理解 Size 与 Allocated

* **Size**：文件逻辑内容长度。
* **Allocated**：文件系统实际分配的磁盘空间，通常是 cluster size 的整数倍。

两者可能明显不同：

* 小文件很多时，Allocated 之和可能大于 Size；
* NTFS 压缩文件的 Allocated 可能小于 Size；
* 稀疏文件逻辑 Size 很大，但实际分配较少；
* 硬链接不应被重复计算为多份真实占用。

清理目标是释放真实磁盘空间，因此通常更关注 **Allocated**；分析文件逻辑规模或备份传输量时，Size 也很重要。

WizTree 统计出的文件 Allocated 总和可能略小于 Windows 报告的“已用空间”，因为 NTFS 的目录索引、安全信息等元数据不一定作为普通文件出现在列表中。

---

## 5. 用 Tree View 与 Treemap 定位空间

### 5.1 Tree View

点击 Size 或 Allocated 列按降序排序，沿最大的目录逐层展开。常见空间来源：

* `C:\Users\<User>\Downloads`：安装包、压缩包、重复下载；
* `AppData\Local`：浏览器、编辑器、AI 工具、包管理器缓存；
* 游戏库与虚拟机磁盘；
* Docker / WSL 虚拟磁盘；
* 构建产物、依赖目录、日志与崩溃转储；
* 回收站和临时目录。

看到大目录后，先确认它由哪个程序管理。缓存、包仓库、虚拟磁盘和数据库应优先通过对应程序的清理、压缩或卸载入口处理。

### 5.2 Treemap

Treemap 中矩形面积代表文件占用，颜色通常区分文件类型。它适合发现：

* 单个异常大的镜像、视频、转储或虚拟磁盘；
* 某目录中大量同类文件形成的连续区域；
* 扩展名与路径不符合预期的“隐藏空间来源”。

点击矩形会联动选中文件。删除前回到列表查看完整路径、修改日期和属性。

---

## 6. File View 与高级过滤

切换到 **File View**，可按名称、大小、日期筛选。

### 6.1 通配符与逻辑

```text
*.iso
*.mp4|*.mkv
*.zip backup
!windows *.log
```

规则：

* 空格表示 AND；
* `|` 表示 OR；
* `!` 表示 NOT；
* `*` 匹配任意长度字符；
* `?` 匹配单个字符；
* 含空格的短语使用双引号。

### 6.2 按大小和日期

```text
>=1gb
>=500mb <=1gb
>=1gb >=today-30
<2026/01/01
```

Allocated size 使用 `a` 前缀：

```text
a>=1gb
a=0 >0
```

更多实用条件：

```text
=file                 # 只显示文件
=folder               # 只显示目录
pathlen>200            # 完整路径过长
namelen>100            # 文件名过长
>NOW-1h                # 最近一小时修改
```

### 6.3 正则表达式

WizTree 4.13+ 支持以 `/` 开头的正则：

```text
/[0-9]{4}-[0-9]{2}-[0-9]{2}\.csv$
```

大多数空间排查不需要正则。优先使用路径、扩展名、大小与日期组合，表达更直观。

---

## 7. 安全清理流程

WizTree 可以删除文件，但更稳妥的工作流是：

1. 扫描并定位候选目录。
2. 查看完整路径、修改日期、文件类型和所属程序。
3. 判断它属于“用户数据、缓存、程序组件、系统组件”中的哪一类。
4. 用户数据先备份或移到隔离目录。
5. 软件缓存优先用软件自身的清理入口。
6. 已安装程序优先用 Scoop、Winget、BCUninstaller 或系统设置卸载。
7. 删除后重新扫描，确认空间确实释放且程序仍正常。

### 7.1 不要直接删除的典型项目

* `pagefile.sys`、`hiberfil.sys`；
* `System Volume Information`；
* `Windows\WinSxS`；
* 不认识的驱动、DLL、Installer cache；
* WSL / Docker / VM 正在使用的虚拟磁盘；
* 数据库、同步盘或备份软件正在管理的文件。

这些项目即使很大，也应通过 Windows 设置、DISM、应用程序或虚拟化工具的受支持流程处理。

---

## 8. 重复文件：只能当候选

在 File View 的 duplicate files 下拉菜单中，可按文件名、大小和可选修改日期查找重复项。出现 `+` 时可展开同组文件。

重要限制：**WizTree 不比较文件内容**。同名、同大小、同日期仍不能证明是同一文件，因此：

1. 先限定到自己的媒体、下载或归档目录；
2. 不要跨系统目录、程序目录批量去重；
3. 对重要文件再计算 SHA-256 或逐个打开确认；
4. 明确主副本与备份关系后再删除。

去重工具最危险的误区是把“相似元数据”误当成“内容等价”。

---

## 9. 导出与自动化

### 9.1 GUI 导出

按 `Ctrl+Alt+E`，或右键选择 **Export to CSV file...**。未选择项目时会导出当前扫描的全部结果；选中目录时只导出选择范围。

CSV 可用于：

* 保存清理前后的空间快照；
* 在 Excel / PowerShell 中二次分析；
* 给远程支持人员提供文件清单，而不是只发截图；
* 比较不同时间的目录规模变化。

### 9.2 命令行导出

Scoop 版在 64 位 Windows 上提供 `WizTree64.exe`，并有 `WizTree` shim。完整扫描系统盘并导出：

```powershell
WizTree64.exe "C:" /export="C:\Temp\c-drive.csv" /admin=1
```

只导出用户目录中的大型音视频文件：

```powershell
WizTree64.exe "C:\Users" `
  /export="C:\Temp\media.csv" `
  /filter="*.mp4|*.mkv|*.wav" `
  /admin=0 `
  /exportfolders=0 `
  /sortby=1
```

常用参数：

| 参数 | 作用 |
| :--- | :--- |
| `/admin=0|1` | 是否请求管理员模式 |
| `/filter="..."` | 只包含匹配项 |
| `/filterexclude="..."` | 排除匹配项 |
| `/exportfiles=0|1` | 是否导出文件 |
| `/exportfolders=0|1` | 是否导出目录 |
| `/sortby=0|1|2|3` | 名称 / Size / Allocated / 修改日期排序 |
| `/exportUTCTime=1` | 使用 UTC 时间 |

自动审计应把 CSV 写到专用目录，并设置保留策略；否则“空间审计报告”本身也会成为长期垃圾。

---

## 10. 更新与故障排查

更新：

```powershell
scoop update
scoop update wiztree
```

常见问题：

| 现象 | 检查与处理 |
| :--- | :--- |
| 扫描 NTFS 仍很慢 | 确认是否以管理员权限运行；普通权限无法使用高速 MFT 扫描 |
| 网络盘或 FAT 盘比系统盘慢 | 正常现象：这些目标需要普通目录扫描 |
| 统计与 Windows 略有差异 | 检查 Size / Allocated；文件系统元数据不会全部显示为普通文件 |
| 某目录显示 Access Denied | 只在确有必要时提升权限；不要为了“看全”而修改系统 ACL |
| Treemap 看不到空闲空间 | 开启 **Options → Show Free space on Treemap** |
| Scoop 更新后设置丢失 | 确认 `WizTree3.ini` 位于 persist 目录；检查 `scoop prefix wiztree` |
| 删除后空间没有立即变化 | 刷新 / 重新扫描；检查文件是否进入回收站、被进程占用或由同步工具重新生成 |

---

## 参考链接

* [WizTree 官网](https://diskanalyzer.com/)
* [WizTree About / 功能说明](https://diskanalyzer.com/about)
* [WizTree Guides](https://diskanalyzer.com/guide)
* [WizTree FAQ](https://diskanalyzer.com/faq)
* [WizTree 下载与许可说明](https://diskanalyzer.com/download)
* [Scoop Extras: wiztree manifest](https://github.com/ScoopInstaller/Extras/blob/master/bucket/wiztree.json)
