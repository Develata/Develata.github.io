---
title: Linux 指令大全
date: 2025-11-23 23:15
order: 1
---
# Linux 指令大全

## 1. 常用指令 (高频精简版)

| 指令 | 描述 | 常用示例 |
| :--- | :--- | :--- |
| **ls** | 列出目录内容 | `ls -lah` (查看所有文件及详细信息) |
| **cd** | 切换工作目录 | `cd /home` (进入home目录), `cd ..` (返回上一级) |
| **pwd** | 显示当前路径 | `pwd` |
| **mkdir** | 创建新目录 | `mkdir -p dir1/dir2` (递归创建目录) |
| **rm** | 删除文件或目录 | `rm -rf file` (强制递归删除，慎用) |
| **cp** | 复制文件或目录 | `cp -r src dest` (递归复制目录) |
| **mv** | 移动或重命名 | `mv old.txt new.txt` |
| **cat** | 查看文件内容 | `cat file.log` |
| **tail** | 查看文件尾部 | `tail -f log.txt` (实时监控日志) |
| **grep** | 文本搜索 | `grep "error" log.txt` (在文件中搜关键词) |
| **ps** | 查看进程状态 | `ps aux` (查看所有进程) |
| **kill** | 终止进程 | `kill -9 PID` (强制杀掉进程) |
| **chmod** | 修改权限 | `chmod +x script.sh` (赋予执行权限) |
| **chown** | 修改所有者 | `chown user:group file` |
| **tar** | 压缩/解压 | `tar -xvf file.tar` (解压), `tar -cvf file.tar dir` (打包) |
| **sudo** | 以管理员身份执行 | `sudo apt update` |
| **top** | 实时系统监控 | `top` (查看CPU/内存占用) |
| **ping** | 测试网络连通性 | `ping google.com` |
| **ssh** | 远程登录 | `ssh user@ip` |
| **vim/nano**| 文本编辑器 | `vim file.txt` |

---

## 2. Linux 全面指令 (分类速查)

### 2.1 文件与目录管理 (File & Directory)
| 指令 | 描述 |
| :--- | :--- |
| `ls` | 列出目录内容 (参数: -l 详细, -a 所有, -h 人类可读) |
| `cd` | 更改目录 |
| `pwd` | 显示当前工作目录 |
| `mkdir` | 创建目录 |
| `rmdir` | 删除空目录 |
| `rm` | 删除文件或目录 (参数: -r 递归, -f 强制) |
| `cp` | 复制文件/目录 |
| `mv` | 移动或重命名文件 |
| `touch` | 创建空文件或更新时间戳 |
| `ln` | 创建链接 (参数: -s 软链接) |
| `find` | 在目录层次结构中搜索文件 (`find / -name filename`) |
| `locate` | 通过索引快速查找文件 |
| `tree` | 以树状图列出目录内容 |
| `basename`| 去除目录和后缀，显示文件名 |
| `dirname` | 显示文件所在的目录路径 |

### 2.2 文件内容查看与处理 (Text Processing)
| 指令 | 描述 |
| :--- | :--- |
| `cat` | 连接并打印文件内容 |
| `more` | 分页显示文件内容 |
| `less` | 分页显示 (支持向前/后翻页，比more强大) |
| `head` | 显示文件开头 (默认10行) |
| `tail` | 显示文件结尾 (常用 `tail -f` 跟踪日志) |
| `grep` | 文本搜索工具，支持正则 |
| `sed` | 流编辑器，用于文本替换/处理 |
| `awk` | 强大的文本分析与处理工具 |
| `cut` | 按列提取文本字符 |
| `sort` | 对文本行进行排序 |
| `uniq` | 去除重复行 (通常配合 sort 使用) |
| `wc` | 统计字数、行数、字节数 |
| `diff` | 比较两个文件的差异 |
| `echo` | 输出字符串或变量值 |

### 2.3 系统信息与管理 (System Info)
| 指令 | 描述 |
| :--- | :--- |
| `uname` | 显示系统信息 (`uname -a`) |
| `hostname`| 显示或设置主机名 |
| `dmesg` | 显示内核环形缓冲区信息 (开机信息) |
| `uptime` | 显示系统运行时间及负载 |
| `date` | 显示或设置系统时间 |
| `cal` | 显示日历 |
| `who` | 显示当前登录用户 |
| `w` | 显示已登录用户及其操作 |
| `id` | 显示用户ID和组ID信息 |
| `last` | 显示最近登录的用户列表 |
| `history` | 显示指令历史记录 |
| `man` | 查看指令帮助手册 |
| `clear` | 清屏 |
| `alias` | 设置指令别名 |
| `export` | 设置环境变量 |
| `shutdown`| 关机 (`shutdown -h now`) |
| `reboot` | 重启 |

### 2.4 进程管理 (Process Management)
| 指令 | 描述 |
| :--- | :--- |
| `ps` | 报告当前进程快照 |
| `top` | 实时显示进程状态 |
| `htop` | 交互式进程查看器 (比top更直观) |
| `kill` | 向进程发送信号 (通常用于终止) |
| `killall` | 根据名称杀死进程 |
| `pkill` | 根据名称或其他属性发送信号 |
| `bg` | 将任务放到后台运行 |
| `fg` | 将后台任务调至前台 |
| `jobs` | 显示当前终端的后台任务 |
| `nice` | 以指定优先级运行程序 |
| `renice` | 修改运行中进程的优先级 |
| `nohup` | 用户退出后继续运行进程 |

### 2.5 用户与权限管理 (User & Permissions)
| 指令 | 描述 |
| :--- | :--- |
| `chmod` | 改变文件模式/权限 (r=4, w=2, x=1) |
| `chown` | 改变文件所有者和组 |
| `chgrp` | 改变文件所属组 |
| `useradd` | 添加新用户 |
| `userdel` | 删除用户 |
| `usermod` | 修改用户信息 |
| `groupadd`| 添加新组 |
| `passwd` | 修改用户密码 |
| `su` | 切换用户身份 |
| `sudo` | 以超级用户权限执行指令 |
| `visudo` | 编辑 sudoers 配置文件 |

### 2.6 磁盘与存储管理 (Disk & Storage)
| 指令 | 描述 |
| :--- | :--- |
| `df` | 报告文件系统磁盘空间使用情况 (`df -h`) |
| `du` | 统计目录或文件的磁盘占用 (`du -sh`) |
| `fdisk` | 磁盘分区工具 |
| `mkfs` | 格式化文件系统 (如 `mkfs.ext4`) |
| `mount` | 挂载文件系统 |
| `umount` | 卸载文件系统 |
| `lsblk` | 列出块设备信息 |
| `fsck` | 检查并修复文件系统 |
| `sync` | 强制将内存数据写入磁盘 |

### 2.7 网络管理 (Networking)
| 指令 | 描述 |
| :--- | :--- |
| `ping` | 检测主机连通性 |
| `ifconfig`| 配置或显示网络接口 (旧) |
| `ip` | 显示/操作路由、设备、策略路由和隧道 (新，推荐) |
| `netstat` | 显示网络连接、路由表、接口统计 |
| `ss` | 获取socket统计信息 (比 netstat 快) |
| `ssh` | OpenSSH 远程登录客户端 |
| `scp` | 远程文件安全拷贝 |
| `wget` | 从网络下载文件 |
| `curl` | 传输数据工具，支持多种协议 |
| `nslookup`| 查询DNS记录 |
| `dig` | DNS 查找工具 (更详细) |
| `traceroute`| 追踪数据包路由路径 |
| `route` | 显示或操作IP路由表 |
| `iptables`| IPv4 数据包过滤和NAT管理 |
| `ufw`/`firewalld` | 防火墙配置前端工具 |

### 2.8 压缩与解压 (Archives & Compression)
| 指令 | 描述 |
| :--- | :--- |
| `tar` | 归档工具 (可配合 gzip/bzip2 使用) |
| `gzip` | 压缩文件 (.gz) |
| `gunzip` | 解压文件 (.gz) |
| `zip` | 压缩文件 (.zip) |
| `unzip` | 解压文件 (.zip) |
| `bzip2` | 压缩文件 (.bz2) |
| `xz` | 高压缩率工具 (.xz) |

### 2.9 软件包管理 (Package Management)
*根据发行版不同，指令不同*

| 发行版 | 安装 | 更新 | 删除 |
| :--- | :--- | :--- | :--- |
| **Debian/Ubuntu** | `apt install <pkg>` | `apt update && apt upgrade` | `apt remove <pkg>` |
| **RHEL/CentOS** | `yum install <pkg>` | `yum update` | `yum remove <pkg>` |
| **Fedora** | `dnf install <pkg>` | `dnf upgrade` | `dnf remove <pkg>` |
| **Arch Linux** | `pacman -S <pkg>` | `pacman -Syu` | `pacman -R <pkg>` |