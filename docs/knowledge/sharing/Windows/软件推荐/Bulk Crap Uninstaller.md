---
title: Bulk Crap Uninstaller
date: 2026-08-09
order: 5
---

# Bulk Crap Uninstaller 使用指南

## 1. 什么是 Bulk Crap Uninstaller

[Bulk Crap Uninstaller 官网](https://www.bcuninstaller.com/)

Bulk Crap Uninstaller，简称 **BCU** 或 **BCUninstaller**，是 Apache-2.0 许可的开源 Windows 批量卸载工具。它的核心能力不是“把程序目录直接删掉”，而是识别系统中的各种应用，优先调用软件原有卸载器，并在卸载后查找残留文件与注册表项。

BCU 适合这些场景：

* 新电脑预装软件很多，需要批量清理；
* 一次卸载多个普通程序、Store App、Steam 游戏或 Windows Features；
* 控制面板中缺少卸载项，或卸载器已经损坏；
* 卸载完成后检查残留目录与注册表项；
* 管理开机启动项；
* 用过滤规则和 uninstall list 复刻批量清理流程。

BCU 能识别普通注册程序、隐藏或受保护项、缺失卸载器的程序、部分 portable app、Scoop / Chocolatey package、Store App、Steam / Oculus 应用、Windows Features 与 Updates 等。识别到不等于适合删除；系统组件、驱动、运行库和共享依赖必须谨慎判断。

---

## 2. 安装

### 2.1 使用 Scoop 安装（推荐）

先安装 [Scoop](./Scoop.md)，再执行：

```powershell
scoop bucket add extras
scoop update
scoop install extras/bulk-crap-uninstaller
```

验证：

```powershell
scoop list bulk-crap-uninstaller
scoop prefix bulk-crap-uninstaller
```

从开始菜单启动 **Bulk Crap Uninstaller**。Scoop 安装的是官方 portable package，并持久化 `BCUninstaller.settings`。

更新与卸载：

```powershell
scoop update bulk-crap-uninstaller
scoop uninstall bulk-crap-uninstaller
```

BCU 需要管理员权限扫描部分系统信息、调用卸载器和清理残留，启动时出现 UAC 属正常现象。它本身是高权限工具，不要从未知镜像下载修改版。

### 2.2 官方安装包 / Portable

也可从[GitHub Releases](https://github.com/BCUninstaller/Bulk-Crap-Uninstaller/releases/latest)下载 installer 或 portable package。长期固定使用可选安装版；维护 U 盘或临时检修环境可选 portable。

不要同时运行多个 BCU 实例，也不要在批量卸载期间更新 BCU 本身。

---

## 3. 第一次启动：先建立软件清单

BCU 启动后会扫描已安装应用。第一次使用先不要急着勾选删除，而是理解主界面：

* **Application List**：软件名称、发布者、版本、安装位置、估算大小、卸载器等信息。
* **Left Sidebar**：搜索、基础过滤和显示范围。
* **Color Legend**：用颜色标记 Store App、未注册项、缺失卸载器、受保护项、更新或系统组件。
* **Treemap**：按估算大小显示当前可见应用；它只用于定位，不代表真实磁盘占用的完整审计。

第一轮建议：

1. 取消所有选择。
2. 按 Publisher、Install Location、Size 排序观察。
3. 打开陌生项目的 Properties，检查卸载命令、证书和安装路径。
4. 隐藏 system components / updates，只看普通应用。
5. 先卸载一个确定无用的小程序，熟悉完整流程。

证书验证只能说明签名文件是否保持完整，不能证明软件安全或应当保留；社区 rating 也只能作为线索，不能替你判断用途。

---

## 4. 一次安全的批量卸载

### 4.1 准备

批量卸载前：

* 保存工作并关闭相关程序；
* 笔记本接通电源；
* 对重要数据做好备份；
* 驱动、杀毒软件、VPN、输入法、虚拟化和系统扩展尽量单独卸载；
* 第一次使用时允许 BCU 创建 System Restore Point。

System Restore 不是完整备份，但可以为注册表与系统组件错误提供额外回退点。

### 4.2 选择软件

用 `Ctrl` 多选零散项目，用 `Shift` 选择连续区域。每次批次保持同类：

* 浏览器插件一批；
* 厂商预装工具一批；
* 游戏或启动器一批；
* 开发工具一批。

不要把普通应用、驱动和系统组件混成一个大批次。小批次更容易定位失败，也减少卸载器互相冲突。

### 4.3 Uninstall 与 Uninstall quietly

* **Uninstall**：运行原始卸载器，需要人工点击 Next / Finish。
* **Uninstall quietly**：尽量使用静默参数或自动化，无需逐个交互。

第一次清理或对象复杂时优先普通 Uninstall；确认一批标准软件可安全静默卸载后，再使用 Uninstall quietly。BCU 会尽量调用原始卸载器，因为单纯删除目录可能遗留服务、Shell extension、计划任务和注册信息。

### 4.4 并发卸载

BCU 支持并发调度并尝试避免冲突，但不宜激进：

* SSD 上也建议同时最多运行 2 个卸载器；
* MSI、驱动、系统组件常会争用 Windows Installer 或要求重启，适合串行；
* 出现挂起时先查看当前卸载器窗口，不要连续强制结束全部进程。

---

## 5. 残留扫描：置信度优先

原始卸载器结束后，BCU 会扫描 leftover / junk。候选项通常按 confidence 分类。安全原则：

1. 先只选择 **Very Good** 或明确属于目标软件的项目。
2. 检查每个路径和注册表键是否包含准确的软件名、publisher 或独立目录。
3. 共享目录、通用名称和系统路径宁可保留。
4. 启用备份，尤其是注册表清理。
5. `Questionable`、`Bad`、`Unknown` 默认不删。

残留几十 MB 往往不值得冒破坏共享组件的风险。残留扫描的目标是清理高置信度孤儿数据，不是追求“候选列表必须清零”。

---

## 6. 卸载器缺失或程序未注册

### 6.1 Missing uninstaller

系统还保留卸载记录，但目标卸载器丢失。处理顺序：

1. 尝试重新安装同版本到原位置，再正常卸载。
2. 检查安装目录中是否仍有 `uninstall.exe`。
3. 若有 MSI Product Code，尝试 BCU 的 **Uninstall using MsiExec**。
4. 最后才使用 manual / force uninstall。

### 6.2 Unregistered application

程序存在于磁盘但没有标准卸载注册。BCU 可能找到其卸载器，或生成简单删除方案。先确认它不是：

* portable app；
* 另一个软件的子组件；
* 游戏 mod、插件或 SDK；
* 手工部署的服务。

Portable app 通常应先用自身设置导出数据，再删除其独立目录和快捷方式。

### 6.3 Find by window / shortcut / directory

不知道列表中哪个条目对应当前程序时，可使用：

* **Find by window**：把准星拖到目标窗口；
* 按 shortcut 查找；
* 按安装目录定位。

这是定位手段，不是删除证据。定位后仍要检查 Properties。

### 6.4 Force / Manual uninstall

Manual uninstall 会跳过原始卸载器，直接给出文件与注册表候选。只在正常卸载、重装后卸载、MsiExec 等路径均失败时使用，并确保：

* 目标不是驱动或安全软件；
* 已创建备份 / restore point；
* 所选路径只属于目标应用；
* 已记录服务、计划任务和 Shell extension 的清理方式。

---

## 7. 过滤、预设与卸载清单

### 7.1 基础过滤

左侧栏可按名称、publisher、路径、类型和状态筛选。实用思路：

* Publisher 为空：寻找来源不明或孤立项目；
* Missing uninstaller：集中处理损坏条目；
* Orphaned / Unregistered：检查残留程序；
* Store Apps：单独查看 UWP 应用；
* Protected / System components：默认隐藏，避免误选。

### 7.2 Advanced Filtering

高级过滤器由 conditions 组成，同一 filter 内条件全部满足才匹配。比较方式包括 Contains、Equals、Starts with、Ends with、Regex 等。

示例思路：

```text
Include: Publisher contains "Example Corp"
Exclude: DisplayName contains "Driver"
```

先用过滤器预览结果，不要边写规则边直接无人值守卸载。

### 7.3 `.bcul` Uninstall List

高级过滤规则可保存为 `.bcul`，用于以后重新加载或交给 `BCU-console.exe`。它适合：

* 重复清理同一批实验室 / 测试机；
* 保存厂商预装软件清单；
* 让批量流程可审查、可版本化。

清单应尽可能精确，优先组合 DisplayName、Publisher、版本或 Product Code；过宽的 `contains` 和正则可能在软件改名后误选。

---

## 8. 命令行自动化

Scoop package 包含 `BCU-console.exe`。先查看帮助：

```powershell
BCU-console.exe help
```

导出当前应用清单：

```powershell
BCU-console.exe export "C:\Temp\installed-apps.xml"
```

根据经过审查的 `.bcul` 清单卸载：

```powershell
BCU-console.exe uninstall "C:\Temp\cleanup.bcul" /Q
```

参数边界：

* `/Q`：尽量使用 quiet uninstaller；
* `/U`：无人值守、不再询问，**只可在经过充分测试的清单上使用**；
* `/J=VeryGood`：只清理 Very Good 置信度的残留；
* `/V`：输出更详细日志。

不要一开始就组合 `/Q /U /J=Questionable`。正确上线顺序是：

1. GUI 中预览过滤结果；
2. 在测试机人工卸载；
3. 固定 `.bcul`；
4. CLI 交互运行；
5. 最后才考虑 `/U`。

---

## 9. Startup Manager 与其他工具

在 **Tools → Startup Manager** 查看开机启动项。也可以只启动该模块：

```powershell
BCUninstaller.exe /startupmanager
```

禁用启动项比直接删除更可逆。建议：

1. 先禁用并重启验证；
2. 确认软件功能不受影响；
3. 再决定保留禁用、恢复或卸载软件。

**Clean up Program Files folders** 会扫描默认安装目录中的空目录和疑似残留，同样需要逐项确认。Program Files 中的共享目录、runtime 与厂商公共组件不应仅因“当前没有明显主程序”就删除。

---

## 10. 安全基线与排错

### 10.1 安全基线

* 默认隐藏 protected items、system components 和 updates。
* 每批保持小而同质，重要软件单独卸载。
* 创建 restore point，但仍对用户数据做独立备份。
* 残留只清理高置信度项目；宁可多留，不可错删。
* 第三方卸载脚本、`.bcul` 和自定义规则要像代码一样 review。
* 卸载驱动、杀毒、VPN、虚拟网卡后按厂商要求重启。

### 10.2 常见问题

| 现象 | 检查与处理 |
| :--- | :--- |
| 列表中找不到软件 | 清除过滤条件；显示未注册 / portable / system component；用 Find by window 或目录定位 |
| 卸载器卡住 | 检查是否有隐藏确认窗口；查看进度窗口；必要时只终止该卸载器，不要直接结束整个 BCU |
| quiet uninstall 仍弹窗 | 该卸载器不支持可靠静默模式，改用普通 Uninstall |
| 扫出大量可疑残留 | 只选 Very Good；检查是否为共享目录或通用注册表键 |
| 卸载后程序仍在 | 重启；检查服务、计划任务、浏览器扩展或 Store App 是否属于独立组件 |
| 误删后异常 | 使用 BCU 备份或 System Restore 回退；恢复用户数据备份；不要继续大批量清理 |
| Scoop 软件显示异常 | 更新 BCU；确认 Scoop 自定义 root path 可识别；Scoop 管理的软件优先用 `scoop uninstall <app>` |

> BCU 能识别 Scoop package，但由 Scoop 安装的软件原则上仍优先用 Scoop 卸载，使 persist、shim、shortcut 与 manifest hooks 一并正确处理。BCU 更适合系统安装器、损坏卸载项和跨来源盘点。

---

## 参考链接

* [Bulk Crap Uninstaller 官网](https://www.bcuninstaller.com/)
* [Bulk Crap Uninstaller GitHub 仓库](https://github.com/BCUninstaller/Bulk-Crap-Uninstaller)
* [BCU 官方手册](https://htmlpreview.github.io/?https://github.com/BCUninstaller/Bulk-Crap-Uninstaller/blob/master/doc/BCU_manual.html)
* [GitHub Releases](https://github.com/BCUninstaller/Bulk-Crap-Uninstaller/releases/latest)
* [Scoop Extras: bulk-crap-uninstaller manifest](https://github.com/ScoopInstaller/Extras/blob/master/bucket/bulk-crap-uninstaller.json)
