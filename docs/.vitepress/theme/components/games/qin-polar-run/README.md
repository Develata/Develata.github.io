# 北境狂奔 / Northern Run

秦始皇骑北极熊的独立三道跑酷。Phase 2 保留原有 Vue/Three.js/Rust 边界，新增持续加速、三种秦境、金币蓄力冲刺与可静音循环音乐。没有账号、存档、历史最佳或跨游戏引擎。

## 本地构建

Rust 1.97.0 与 wasm32-unknown-unknown 由 rust/rust-toolchain.toml 固定。安装一次 wasm-bindgen-cli 0.2.126，与 Cargo.lock 匹配。

- npm run game:qin-polar-run:wasm：仅测试并编译本游戏 Rust，生成 wasm-bindgen web 包。
- npm run game:qin-polar-run:test：Node 内置加载器、ABI 版本、键盘/手势、音频生命周期测试。
- npm run dev：开发预览。Rust 修改后需重新运行 WASM 命令。
- npm run build，然后 npm run preview：完整生产验证。全站较大，本地必要时仅为构建进程设置 NODE_OPTIONS=--max-old-space-size=4096。

生成包位于 docs/public/game-assets/qin-polar-run/wasm/，与 rust/target/ 一起忽略。发布 profile 使用 opt-level=s、LTO、单 codegen unit、panic=abort、strip；没有 wasm-pack/wasm-opt 或额外引擎依赖。

## 所有权与模块

| 模块 | 唯一职责 |
| --- | --- |
| rust/src/difficulty.rs | 纯速度曲线、普通到达速度上界、40 秒场景编号 |
| rust/src/player.rs | 0.16s smoothstep 换道、解析跳跃、俯身、逻辑碰撞 |
| rust/src/track.rs | 有界路段、确定性 xorshift32、障碍库、动态间距与可达性 |
| rust/src/boost.rs | 10 枚金币充能、手动启动、计时与结束保护 |
| rust/src/runner.rs | 权威状态、120Hz 固定步进、积分、碰撞、回收、紧凑帧 |
| input/InputController.ts | 浏览器事件映射为动作位；不决定游戏规则 |
| render/ | Three.js 投影帧、三个预生成环境、相机与有限特效池 |
| audio/GameAudio.ts | 单个延迟创建的 HTMLAudioElement |
| GameEntry.vue | Vue UI、唯一 RAF、暂停/重开/卸载 |

Game Lab AGENTS.md 明确独立纵向模块。共享的只有 Vue/VitePress/Three.js、懒注册、卡片元数据和部署；不导入其他游戏实现。

## 持续加速与可解性

普通速度在 0/30/90/180/360s 分别约为 12/15/19.5/24.5/31；之后每秒增加 0.015。没有几分钟就碰到的玩法速度上限。ABSOLUTE_SPEED_GUARD=120 只防止异常长会话的数值问题，约 105 分钟才达到；界面不显示速度。冲刺后的实际速度也受这条数值保护约束。所有预测调用同一个 base_speed_at。

保留八个 48m 路段、每段两处 24m 间隔的候选排。生成器累计距上一排**实际危险障碍**的距离，空排不重置累计值。若间距不足，则插入空排；金币和景物仍可出现。

最低运动速度是 12×0.65=7.8m/s，所以 d 米前的候选排最迟在 elapsed+d/7.8 到达。用该时刻的单调速度函数作为普通到达速度上界 v；不会把普通障碍全按冲刺倍数拉疏。

安全决策时间取 max(0.32s 反应 + 两次固定步量化换道, 0.9s 跳跃, 0.8s 俯身)+0.1s，目前为 1s。危险排至少相距 2×1.15m 碰撞窗口 + v×1s。三位 mask 校验器使用**累计真实间距和速度上界**传播站立可通过的车道；非法/不可达模式退为空排。它保证存在安全路线，不保证追逐每一枚恢复排金币都安全。

玩家 Z 固定，路段相对坐标有界。横向渲染和碰撞共用 Rust 的权威 x；同一窗口内检查过渡时重叠的车道。每排最多两个障碍，逻辑上至多 32 个障碍、16 枚金币。

## 冲刺与积分

- 每枚秦半两仍加 50 SCORE，并在非冲刺时为蓄力加 1，10 枚充满。无金币数字或百分比 HUD。
- Shift/E 或游戏区域双击手动启动：清空蓄力，持续 3.5s，速度约为当前基础速度的 1.45 倍。
- 冲刺中碰撞不扣受撞次数，而是删除该障碍并发出 smash 事件；每排的破坏车道 mask 供观察。
- 冲刺吸币横向范围为 1.15 个车道单位，普通拾取为 0.45；仅作用于玩家附近的纵向拾取窗，不能从最左吸最右。冲刺中金币加分但不蓄下次冲刺。
- 冲刺结束后保护 1s，让玩家重新读路；重叠障碍在保护期内解决，不会在保护结束后重复扣伤。
- 冲刺不治疗。首撞仍减速 1s、免疫 2s；第二次有效普通碰撞结束。
- 积分为整数距离 + 50×金币数，单调增加，重开清零。

## 三种场景与速度表现

Rust 每 40s 固定输出：冰封秦直道 → 风雪长城关隘 → 冰封陵寝遗迹 → 循环。不改变三条逻辑车道，不增加场景/关卡 HUD。

三组有限 InstancedMesh 初始化时准备并共享 Palette。直道以路标、旗和开阔雪地为主；长城有连续高墙、关门与烽火台；陵寝有封土、金铜巨门与路外兵马俑阵列。切换前后约 1.8s 使用雾幕，不黑屏，不下载新资源；雾的最近视距随权威速度保留至少约两秒前方空间。

跑动步频累积积分，避免速度变化令正弦相位跳变；高速度轻微前倾、FOV 最多多 6°，冲刺额外约 2°。12–28 条近景雪线和一个六碎片池形成有限反馈。prefers-reduced-motion 关闭非必要晃动、雪线、碎片和额外 FOV。

## ABI v2（仍为 144 个 f32 / 576 字节）

每个浏览器帧一个 advance(dt, actionMask, Float32Array)，最多 12 个 120Hz 子步；dt 截至 0.1s，小 dt 输入暂存在 Rust。没有 JSON 或逐物体 getter。wasm-bindgen mutable slice 会复制进出，约 1.1KiB/帧；未声称零复制。

| 位置 | 含义 |
| --- | --- |
| 0 | ABI_VERSION=2，加载后核对 |
| 1..12 | 阶段、时间、48m 滚动偏移、分数、x、y、俯身、保护余量、跌撞、实际速度、事件、受撞数 |
| 13/14/15 | 蓄力 0..10 / 冲刺剩余秒 / 场景编号 0..2 |
| 16+16×slot | z；两排各 [三道类型、金币车道、已拾取]；两排破坏 mask；余项保留 |

动作位：left=1/right=2/jump=4/duck=8/boost=16。事件位：coin=1/hit=2/over=4/boost=8/smash=16/biome=32。生成 JS 与 WASM 请求带 abi=2，避免静默复用旧 ABI；同页图形恢复和路由返回仍复用成功初始化的模块。

## 音频与浏览器生命周期

曲目为 skrjablin 的 Chilly Oriental Feeling With Laser Shots C64 Style，已从 OpenGameArt 官方页面确认 CC0 选项。原件与加工记录见 [AUDIO-LICENSES.md](./AUDIO-LICENSES.md)。发布文件 92,386 bytes，22.98s、单声道、22050Hz、32kbps，6500Hz 低通和微小循环交叉淡化。没有使用 Funkytown 或画离弦。

音乐在点击开始后才创建和加载，音量 0.4；暂停/失焦/隐藏会暂停音乐，继续时恢复，结束时停止归零，重开复用并重播，卸载清理 src 与音频引用。静音只在当前页面会话保留，冲刺不改变播放速度。音频失败不会阻止玩法。

页面仍用 layout:false / injectTitle:false 与 createGameComponent 懒注册。准备、暂停、结束没有游戏 RAF；重开复用核心、画布和渲染池。所有输入/生命周期/图形监听、ResizeObserver、材质/几何体/实例缓冲/WASM 实例在卸载时释放。安全区覆盖新旧 HUD 控件。

## 成本、CI 和验证

道路/金币/障碍和三种环境使用固定实例池，只有一个场景激活；一个半球光加一个方向光，假接触阴影，无纹理、后处理或动态阴影。竖屏 DPR ≤1.25，其余 ≤1.5。热路径复用 Float32Array、向量和变换对象。

Pages 发布路径与权限不变。缓存仍是 docs/public/game-assets/qin-polar-run/wasm/，键基于 Cargo.toml/lock、工具链、rust/src/** 和构建脚本。Rust 改动自然失效；新闻或音频改动不会进入键。命中跳过 Rust 安装/测试/编译；缺失或驱逐时从源码重建。音频是一次加工后提交的静态文件，不放 Rust 缓存，不在 CI 运行 FFmpeg。

实际测试、视口、资源统计与限制见 [QA.md](./QA.md)。浏览器触摸模拟与加速安全路线验证不是实际手机 GPU 或新玩家体验统计。
