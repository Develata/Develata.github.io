---
title: Everything
date: 2026-08-09
order: 6
---

# Everything 使用指南

## 1. 什么是 Everything

[Everything 官网](https://www.voidtools.com/)

Everything 是 voidtools 开发的 Windows 文件名搜索工具。它先建立文件与目录名称索引，再根据关键词即时过滤结果；在 NTFS 卷上通过 MFT 与 USN Journal 高效建立和维护索引，因此特别适合“我知道文件大概叫什么，但忘了放在哪里”的场景。

Everything 的主要用途：

* 在多个磁盘中按文件名、扩展名或路径瞬间定位文件；
* 按大小、修改日期、类型等属性筛选结果；
* 保存高频搜索为 Filter 或 Bookmark；
* 从命令行、PowerToys Run 或其他程序调用搜索；
* 导出文件列表，辅助整理、审计和迁移。

> Everything 的核心优势是**文件名与元数据索引**，不是类似 Windows Search 的全文内容索引。`content:` 可以临时搜索文件内容，但通常要逐个读取候选文件，速度和资源消耗完全不同。

---

## 2. 安装与基础配置

### 2.1 使用 Scoop 安装（推荐）

先安装 [Scoop](./Scoop.md)，然后执行：

```powershell
scoop bucket add extras
scoop update
scoop install extras/everything
```

验证：

```powershell
scoop list everything
scoop prefix everything
```

从开始菜单启动 **Everything**。Scoop 安装的是官方便携包，并持久化 `Everything.ini`、`Everything.db`、Filters、Bookmarks 和搜索历史等数据。

更新与卸载：

```powershell
scoop update everything
scoop uninstall everything
```

### 2.2 安装 Everything Service

Everything 要读取 NTFS 索引，需要管理员权限。推荐安装轻量的 Everything Service，让后台服务承担低层卷读取，搜索界面仍以普通用户运行：

1. 打开 **Tools → Options → General**。
2. 勾选 **Everything Service**。
3. 取消 **Run as administrator**。
4. 确认并接受一次 UAC。

这样比每次以管理员身份运行整个搜索界面更符合最小权限原则。服务只能向本机用户提供 NTFS 文件名列表，不能绕过文件 ACL 打开内容；但“文件名本身”也可能泄露项目名、客户名等信息，共用电脑应考虑这一点。

### 2.3 添加右键菜单（可选）

Scoop manifest 会生成注册表文件，但默认不主动写入右键菜单。需要时执行：

```powershell
$everythingDir = scoop prefix everything
reg.exe import "$everythingDir\install-context.reg"
```

之后右键文件夹可选择 **Search Everything...**，搜索范围会自动限定到该目录。

---

## 3. 第一次使用

启动后等待状态栏完成初始索引，然后直接输入关键词。Everything 默认按名称匹配，多个关键词之间是 AND：

```text
paper final
```

表示名称同时包含 `paper` 与 `final`。双击结果打开文件；常用快捷键：

| 操作 | 快捷键 |
| :--- | :--- |
| 打开选中项 | `Enter` |
| 打开所在目录 | `Ctrl+Enter` |
| 复制完整路径 | `Ctrl+Shift+C` |
| 查看属性 | `Alt+Enter` |
| 重命名 | `F2` |
| 预览窗格 | `Alt+P` |
| 导出结果 | `Ctrl+S` |
| 新搜索窗口 | `Ctrl+N` |
| 聚焦搜索框 | `Ctrl+F` / `F3` |

建议在 **Tools → Options → General → Keyboard** 设置一个全局热键，例如 `Ctrl+Alt+Space`，让 Everything 成为随时可呼出的文件入口。选择不常被 IDE、输入法和截图工具占用的组合。

---

## 4. 搜索语法

### 4.1 逻辑与通配符

| 语法 | 含义 | 示例 |
| :--- | :--- | :--- |
| 空格 | AND | `report 2026` |
| `|` | OR | `jpg|png` |
| `!` | NOT | `report !draft` |
| `< >` | 分组 | `<jpg|png> 2026` |
| `"..."` | 精确短语 | `"final report"` |
| `*` | 任意长度字符 | `*.pdf` |
| `?` | 单个字符 | `img_????.jpg` |

常用例子：

```text
# D 盘中的 PDF
d: *.pdf

# Downloads 下的压缩包
d:\Downloads\ zip:

# JPG 或 PNG，但排除缩略图
<*.jpg|*.png> !thumbnail

# 只匹配完整文件名
exact:README.md
```

### 4.2 限定文件、目录与路径

```text
file:              # 只显示文件
folder:            # 只显示目录
path:keyword       # 在完整路径中匹配
parent:"D:\Data"  # 只匹配该目录的直接子项
infolder:"D:\Data"# 同 parent，不递归子目录
```

直接输入路径也能限定范围：

```text
"D:\Projects\" Cargo.toml
```

### 4.3 扩展名与类型

```text
ext:pdf;docx
pic:
video:
audio:
doc:
exe:
zip:
```

`ext:` 用分号分隔扩展名，不需要写点号。类型 macro 适合快速筛选一组常见扩展名。

---

## 5. 按大小、日期和属性搜索

### 5.1 文件大小

```text
size:>1gb
size:100mb..2gb
*.iso size:>4gb
```

内置区间名包括 `tiny`、`small`、`medium`、`large`、`huge`、`gigantic`，但精确整理时建议直接写单位。

### 5.2 日期

```text
dm:today                 # 今天修改
dm:thisweek              # 本周修改
dm:2026-08-01..2026-08-09
dc:>=2026-01-01          # 创建日期
da:yesterday             # 昨天访问
```

常用缩写：

* `dm:`：date modified；
* `dc:`：date created；
* `da:`：date accessed；
* `rc:`：recently changed。

### 5.3 组合查询

```text
# 最近一周修改的大型视频
video: size:>1gb dm:thisweek

# 项目目录中今年修改的 Markdown
"D:\Projects\" ext:md dm:>=2026-01-01

# 超过 128 MB 的重复文件候选
file: size:>128mb sizedupe:
```

先用路径、扩展名缩小候选，再加大小和日期，通常比一开始写复杂正则更易读。

---

## 6. Filters、Bookmarks 与 Home Search

### 6.1 Filters

Filter 是可复用的搜索条件。Everything 自带 Audio、Compressed、Document、Executable、Folder、Picture、Video 等过滤器。

在 **Search** 菜单切换 Filter；在 **Search → Organize Filters** 创建自己的过滤器，例如：

```text
名称：Large Archives
Search：file: zip: size:>1gb
```

Filter 适合表达“类型规则”，例如图片、最近文件、超大安装包。

### 6.2 Bookmarks

Bookmark 保存完整搜索、排序与视图状态。按 `Ctrl+D` 保存当前查询。例如：

```text
"D:\Projects\" ext:md dm:thisweek
```

Bookmark 适合表达“固定任务”，例如“本周改过的项目文档”“下载目录的大文件”。

### 6.3 Home Search

可在 **Tools → Options → Home** 指定每次打开 Everything 的默认查询、Filter、排序方式和视图。推荐保持 Home Search 简单，不要默认计算所有文件夹大小或复杂属性，否则会削弱启动体验。

---

## 7. 内容搜索、正则与重复文件

### 7.1 内容搜索

```text
ext:md content:"TODO"
"D:\Notes\" ext:md utf8content:"大偏差"
```

内容搜索可能逐个读取文件，先限定目录、扩展名和日期；不要直接对整个磁盘执行无约束 `content:`。对于代码仓库内的全文搜索，`ripgrep` 往往更合适。

### 7.2 正则表达式

```text
regex:^IMG_[0-9]{8}_[0-9]{6}\.jpg$
```

也可按 `Ctrl+R` 切换 Regex。正则模式与普通搜索语法不同；结果异常时先确认是否误开了 Regex。

### 7.3 查找重复项

Everything 1.4 stable 版可按名称、大小、日期等元数据寻找重复候选，例如：

```text
dupe: *.pdf
file: size:>1gb sizedupe:
```

这些条件不会逐字节比较文件内容。仅“同名”或“同大小”不能证明内容相同；删除前应再用 SHA-256 等方式核对内容，并确认副本用途、备份关系和硬链接情况。不要直接对搜索结果批量 `Shift+Delete`。Everything 1.5 alpha 提供了更丰富的 property duplicate 语法，但不应把 alpha 语法写进以 Scoop stable package 为准的日常流程。

---

## 8. 索引范围与网络目录

### 8.1 NTFS / ReFS

在 **Tools → Options → Indexes** 管理本地卷。NTFS 是 Everything 最擅长的路径：初始读取 MFT，后续通过 USN Journal 跟踪变化。

数据库通常位于：

```text
%LOCALAPPDATA%\Everything\Everything.db
```

Scoop 版会在应用持久化目录保存配置与数据库，实际位置可通过 `scoop prefix everything` 和 Everything 的 Options 查看。

### 8.2 FAT、U 盘、网络盘与普通目录

不能使用 NTFS Journal 的位置可以通过 **Indexes → Folders / Network Drives** 添加。它们通常需要定期重扫，更新速度和实时性不如本地 NTFS。

配置原则：

* 只索引确实需要搜索的共享目录；
* 为网络目录设置合理刷新周期；
* 离线设备不需要长期保留时，从索引中移除；
* 在 Exclude 中排除缓存、构建产物或无价值的大目录。

---

## 9. 命令行与工具集成

### 9.1 从 PowerShell 打开搜索

Scoop 为 `Everything.exe` 创建命令 shim，可直接带搜索条件启动：

```powershell
Everything.exe -s "ext:pdf dm:thisweek"
Everything.exe -s '"D:\Projects\"'
```

适合放进 PowerShell Profile、Quicker 动作或自定义脚本。

### 9.2 `es.exe` CLI

voidtools 另行提供 Everything Command-line Interface（`es.exe`）。它通过 IPC 查询正在运行的 Everything 实例，适合把结果输送给脚本：

```powershell
es.exe -sort size -n 20 "file: size:>1gb"
es.exe "*.mp3" -export-efu music.efu
```

`es.exe` 不是 Scoop `everything` manifest 的默认组件，需要从[官方 CLI 页面](https://www.voidtools.com/support/everything/command_line_interface/)单独下载。若报 IPC window not found，先启动 Everything 搜索客户端。

### 9.3 PowerToys Run

已使用 PowerToys 时，可安装社区插件：

```powershell
scoop install extras/everything-powertoys
```

安装或更新插件前先退出 PowerToys，完成后重新启动。Everything 仍是索引 authority，插件只是另一个查询入口。

---

## 10. 安全、维护与排错

### 10.1 安全习惯

* Everything 的结果列表可能暴露敏感文件名；共用电脑不要无条件索引所有用户目录。
* 保持 HTTP / ETP / FTP server 关闭，除非你明确需要并完成认证与网络限制。
* 删除键会操作真实文件；批量删除前先导出列表或移入回收站。
* `content:` 会读取文件内容；在受管控数据上使用前确认合规边界。

### 10.2 常见问题

| 现象 | 检查与处理 |
| :--- | :--- |
| 搜不到新文件 | 检查目标卷是否已索引、监控是否暂停；输入 `/reindex` 强制重建 |
| 每次启动都弹 UAC | 安装 Everything Service，并取消“Run as administrator” |
| 网络盘结果过期 | 检查 Folder / Network Drive 的刷新周期与在线状态 |
| 查询突然完全不同 | 检查是否误开 Regex、Match Path、Match Case 或某个 Filter |
| 内容搜索很慢 | 先限定路径、扩展名和日期；代码内容改用 `rg` |
| `es.exe` 无法连接 | 先启动 Everything；确认使用完整版而非禁用 IPC 的 Lite 版 |
| 设置未保存 | 正常退出 Everything；检查配置目录写权限与多实例冲突 |

更新：

```powershell
scoop update
scoop update everything
```

备份配置可使用 **Tools → Options → Import and Export Settings**；Scoop 用户也可额外备份应用的 `persist` 目录。

---

## 参考链接

* [Everything 官网](https://www.voidtools.com/)
* [Everything 官方手册](https://www.voidtools.com/support/everything/)
* [安装说明](https://www.voidtools.com/support/everything/installing_everything/)
* [搜索语法](https://www.voidtools.com/support/everything/searching/)
* [Everything Service](https://www.voidtools.com/support/everything/everything_service/)
* [命令行接口](https://www.voidtools.com/support/everything/command_line_interface/)
* [Scoop Extras: everything manifest](https://github.com/ScoopInstaller/Extras/blob/master/bucket/everything.json)
