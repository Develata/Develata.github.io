# 北境狂奔 / NORTHERN RUN

秦始皇骑北极熊：独立、单局、三道浏览器跑酷。没有账号、后端、存档、个人最佳或长期成长。
路由：/games/qin-polar-run；从 Game Lab 卡片进入。

## 本地运行

在仓库根目录执行（Windows 或 WSL；Node 与 Rust 使用同一环境）：

~~~sh
npm ci
rustup toolchain install 1.97.0 --profile minimal --target wasm32-unknown-unknown
cargo +1.97.0 install wasm-bindgen-cli --version 0.2.126 --locked
npm run game:qin-polar-run:wasm
npm run dev
~~~

确保 cargo 和 wasm-bindgen 在 PATH 中。WASM 命令仅构建本游戏，先运行 cargo test --locked，
再构建 release 并生成浏览器 ES module。修改 Rust 后重新运行该命令；只修改 Vue/TS/CSS 时无需重编 Rust。
加载生命周期回归：npm run game:qin-polar-run:test（Node 内置测试，无新增依赖）。
生产验证：npm run build，然后 npm run preview。全站内容增长后，若本机默认 Node 堆不足，
可仅在构建进程设置 NODE_OPTIONS=--max-old-space-size=4096；不改变网站运行成本。

## 所有权与生命周期

- rust/src/player.rs：三车道、连续确定性换道、解析跳跃、定时俯身、碰撞判定。
- rust/src/runner.rs：权威阶段、120 Hz 步进、时间/距离、积分、两次受撞、路段回收。
- rust/src/track.rs：独立 xorshift32、人工障碍库、难度选取、可达性校验。
- rust/src/lib.rs：薄 wasm-bindgen 外壳。Rust 测试不依赖浏览器。
- input/InputController.ts：将焦点内键盘和主指针滑动转换为四个语义 bit。
- render/：Three.js 只投影 Rust 帧；没有第二套生成、碰撞或积分规则。
- GameEntry.vue：客户端加载、DOM 状态、唯一 RAF、暂停/重开、资源释放。

游戏采用 VitePress 原生 layout: false 获得完整视口；不修改全局主题。使用 injectTitle:false 关闭自动注入的
Markdown 标题，游戏自己提供可访问的标题。createGameComponent 懒注册组件，挂载后才导入渲染器和
生成的 WASM JS。绝对 URL 避免 Vite 5 对 public 模块添加开发转换参数；只有 JS 下载失败才更新查询参数，
图形初始化重试和路由返回复用同一 WASM 模块。loadWasm.ts 同时合并并发初始化请求。

开始前直接显示 3D 场景。运行中仅 SCORE 常驻，加一个暂停按钮；短时操作提示和受撞/拾取反馈自动消退。
方向键/WASD、Space、四向滑动均可使用。Escape 暂停/继续；滑动拒绝短距离、超时、近对角线及取消事件。
只有运行中的游戏区域使用 touch-action:none；按钮和站外键盘行为不被接管。

隐藏页面、窗口失焦或焦点离开游戏时暂停；重新显示后由用户继续，不自动冲进障碍。
暂停/结束/开始静态画面没有常驻 RAF。重开复用同一个 core、renderer 和池。
卸载会取消 RAF、移除输入/可见性/失焦/上下文监听，断开 ResizeObserver，释放 core，销毁实例缓冲、
共享几何体和材质，dispose renderer 并移除画布。异步加载返回前离开页面时不创建实例。
WebGL 丢失和 WASM 加载失败都有可重试的中文提示。

## 模拟、可解性与碰撞

固定 8 个 48m 路段，每段两排（偏移 12m / 36m），跨段排间距同为 24m。
路段使用相对玩家的有界坐标；玩家 Z 固定。段尾离开后把同一槽放到最前方。
每排最多两个障碍，因而逻辑上最多 32 个障碍、16 枚秦半两；状态不随游玩时间增长。
首约十秒保留适应时间，之后引入换道、低墙、门梁，再提高组合密度。
前进速度从 12m/s 增长并封顶 22m/s，首撞减速一秒、免疫两秒，第二次有效撞击结束。
积分 = 整数距离 + 50 × 拾取数；运行时单调、重开清零、不存储。

校验器的保证是**存在一条可达安全路线**，并非任何按键序列都安全。
它用三位 mask 传播能够站立通过的空车道，只接受类型 0..3；最坏速度为 22m/s。
排间可用时间 = (24 - 2×1.15)/22 - 0.32 ≈ 0.666s；跨两道需要 2×0.16 = 0.32s。
因此上一排的任一安全车道都能在下一排窗口前到达空车道。生成器保存跨段 mask；校验失败退回空排。
跳跃/俯身是额外选择，证明不将它们当成免费通路。0.9s 跳跃和 0.8s 俯身短于去掉碰撞窗口后的
0.986s 排间隔，正常完成一个动作不会强迫下一排处于该动作。

碰撞检查整个 ±1.15m 纵向窗口。换道期间按连续横向位置检查可能重叠的两条车道，避免瞬移穿障碍。
冰岩必须换道；低墙要求跳跃净高至少 0.95；门梁要求处于地面俯身状态。
实际窗口的跳跃/俯身通过、受撞、免疫和长时间安全路线均有 Rust 测试。

## ABI v1 与构建产物

每渲染帧一个 advance(dt, actionMask, Float32Array) 调用；最多执行 12 次固定步进，dt 截断至 0.1s，
无效/负数时间步被忽略。小时间步期间的输入在 Rust 暂存，避免高刷新率丢按键。
缓冲固定 144 个 f32（576 字节）：

| 范围 | 内容 |
| --- | --- |
| 0..12 | ABI 版本、阶段、时间、48m 内滚动偏移、分数、x、y、俯身、免疫、跌撞、速度、事件 bit、内部撞击数 |
| 13..15 | 保留 |
| 16 + 16×slot | 段 z，随后每排各 5 项：三道障碍类型、引导金币车道、已收集标记；其余保留 |

这是小规模复制 ABI，不是零复制：wasm-bindgen 为 mutable slice 分配临时区并复制进出，JS 复用同一帧数组。
每帧约 1.1KiB 双向复制，没有 JSON、对象树或逐对象 getter。配置偏移由 config.ts 与 Rust 注释共同定义，
加载检查 ABI 版本。参考：[wasm-bindgen 数值切片](https://rustwasm.github.io/docs/wasm-bindgen/reference/types/number-slices.html)。

源代码在本模块的 rust/ 中；Cargo.lock 与工具链文件入库。
生成产物在 docs/public/game-assets/qin-polar-run/wasm/，target/ 与生成包都被忽略。
固定 Rust 1.97.0、wasm-bindgen crate/CLI 0.2.126。直接使用 cargo + wasm-bindgen --target web，
不再加入 wasm-pack。release 使用 opt-level=s、LTO、单 codegen unit、panic=abort、strip。
没有额外 wasm-opt 下载步骤；发布 WASM 仅约 22KB，具体测量见 QA.md。

## Pages CI：热内容复用冷代码

唯一发布路径仍是 .github/workflows/deploy.yml，权限、环境、并发、打包、deploy-pages 语义均保留。

缓存路径为上述生成包目录；key 为 northern-run-wasm-v1 + runner.os + hashFiles：
Cargo.toml、Cargo.lock、rust-toolchain.toml、rust/src/**、本模块 build-wasm.mjs。
工具版本和构建选项都固定在这些输入中；修改 ABI/构建策略时可以提升命名空间。

- 精确命中：不安装 Rust/wasm-bindgen，不运行 Cargo 测试或编译；运行轻量 Node 加载回归、验证输出文件存在，再构建完整 VitePress 站点。
- 缺失或驱逐：安装固定工具，测试核心、生成 release WASM，再构建站点并保存输出缓存。
- news/** 不在游戏缓存键里，所以普通新闻更新正常复用 WASM。偶发缓存驱逐允许从源码重建。

没有第二套重复编译的 Rust workflow，没有 Release 二进制仓库，没有改造 News/RSS。
CI 中安装版本需与 rust-toolchain.toml 和 build-wasm.mjs 一同维护。

## 渲染成本与隔离

道路、三类障碍、秦半两用 8 个固定容量 InstancedMesh；城墙、塔、旗和守卫也实例化。
角色由共享几何体组合，无 GLB/图片/字体/CDN/音频下载依赖。
一个半球光、一个方向光、雾、简单接触阴影；无动态阴影、后处理或粒子系统。
竖屏 DPR 上限 1.25，其余 1.5。遵循 reduced-motion，去掉装饰晃动/冲击，保留必要跑动。

热循环复用帧数组、Object3D 与 Vector3；不新建模型/材质、数组或渲染矩阵对象。
诊断读取才复制帧数组，正常渲染不调用诊断。场景池容量固定，QA 中实际节点数保持 111。

Game Lab 的 AGENTS.md 明确每个游戏是独立纵向模块。该游戏不导入其他游戏实现；共享的只有 Vue、
VitePress、Three.js 依赖、懒加载注册、卡片元数据和部署设施。没有跨游戏核心、Rust workspace 或通用引擎。

## 验证与限制

实际命令、视口、生命周期和失败路径结果见 [QA.md](./QA.md)。
首玩 1–3 分钟是难度目标，尚未做新玩家样本统计。桌面 Chrome 的触摸模拟不等于真实 Android GPU 测试。
Actions 缓存的实际命中以对应 GitHub Actions 运行记录为准；缓存驱逐时会正常重建。
