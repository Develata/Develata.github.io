/**
 * @file index.mts
 * @description 主题入口文件 (Theme Entry)
 * 职责：
 * 1. 扩展默认 VitePress 主题。
 * 2. 注册和注入全局组件 (Background, FolderTree, RandomJump 等)。
 * 3. 实现游戏组件的异步懒加载机制 (createGameComponent)。
 */
import { h, defineAsyncComponent } from 'vue' // Vue 的核心函数
import DefaultTheme from 'vitepress/theme' // 引入默认主题
import './custom.css' // 引入自定义样式
import RandomJump from './components/RandomJump.vue' // 引入随机跳转组件
import FolderTree from './components/FolderTree.vue'// 引入文件夹树组件
import ParticlesBg from './components/Background.vue' // 引入背景组件

// ⚡️ 封装一个带有 Loading 状态的异步加载器
// 优化体验：当网络加载游戏代码时，显示一个加载提示，避免页面长时间空白
function createGameComponent(loader: () => Promise<any>) {
  return defineAsyncComponent({
    loader,
    loadingComponent: {
      render() {
        return h('div', {
          style: 'padding: 50px; text-align: center; color: var(--vp-c-text-2); font-family: monospace; animation: pulse 1.5s infinite;'
        }, '👾 Loading Game Resources...')
      }
    },
    // 展示加载组件前的延迟时间，默认为 200ms
    // 改为 50ms，让用户点击后立刻有反馈，感觉更灵敏
    delay: 50,
    timeout: 10000 // 超时时间
  })
}

// 使用封装好的函数加载组件
const GameHub = createGameComponent(() => import('./components/games/GameHub.vue'))
const MathHub = createGameComponent(() => import('./components/games/MathHub.vue'))
const TicTacToe = createGameComponent(() => import('./components/games/TicTacToe.vue'))
const Gomoku = createGameComponent(() => import('./components/games/Gomoku.vue'))
const GameOfLife = createGameComponent(() => import('./components/games/GameOfLife.vue'))
const Minesweeper = createGameComponent(() => import('./components/games/Minesweeper.vue'))
const Game2048 = createGameComponent(() => import('./components/games/Game2048.vue'))
const Sudoku = createGameComponent(() => import('./components/games/Sudoku.vue'))
const LightsOut = createGameComponent(() => import('./components/games/LightsOut.vue'))
const ConvergenceGame = createGameComponent(() => import('./components/games/convergence/GameEntry.vue'))
const Snake = createGameComponent(() => import('./components/games/Snake.vue'))
const Tetris = createGameComponent(() => import('./components/games/Tetris.vue'))
const Sokoban = createGameComponent(() => import('./components/games/Sokoban.vue'))


export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-content-after': () => h(RandomJump),// 导航栏后添加随机跳转按钮
      'layout-bottom': () => h(ParticlesBg) //背景组件
    })
  },// 注册全局组件
  enhanceApp({ app }: any) {
    app.component('RandomJump', RandomJump)// 注册随机跳转组件
    app.component('FolderTree', FolderTree)// 注册文件夹树组件
    app.component('GameHub', GameHub)// 注册游戏中心组件
    app.component('MathHub', MathHub)// 注册数学实验中心组件
    app.component('TicTacToe', TicTacToe)// 注册井字棋组件
    app.component('Gomoku', Gomoku)// 注册五子棋组件
    app.component('GameOfLife', GameOfLife)// 注册生命游戏组件
    app.component('Minesweeper', Minesweeper)// 注册扫雷组件
    app.component('Game2048', Game2048)// 注册2048组件
    app.component('Sudoku', Sudoku)// 注册数独组件
    app.component('LightsOut', LightsOut)// 注册熄灯组件
    app.component('ConvergenceGame', ConvergenceGame)// 注册聚合游戏组件
    app.component('Snake', Snake)// 注册贪吃蛇组件
    app.component('Tetris', Tetris)// 注册俄罗斯方块组件
    app.component('Sokoban', Sokoban)// 注册推箱子组件
  }
}
