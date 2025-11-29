import { h, defineAsyncComponent } from 'vue'
import DefaultTheme from 'vitepress/theme'
import './custom.css'
import RandomJump from './components/RandomJump.vue'

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
const TicTacToe = createGameComponent(() => import('./components/games/TicTacToe.vue'))
const Gomoku = createGameComponent(() => import('./components/games/Gomoku.vue'))
const GameOfLife = createGameComponent(() => import('./components/games/GameOfLife.vue'))
const Minesweeper = createGameComponent(() => import('./components/games/Minesweeper.vue'))
const Game2048 = createGameComponent(() => import('./components/games/Game2048.vue'))
const Sudoku = createGameComponent(() => import('./components/games/Sudoku.vue'))

export default {
  extends: DefaultTheme, 
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-content-after': () => h(RandomJump)
    })
  },
  enhanceApp({ app }) {
    app.component('RandomJump', RandomJump)
    
    app.component('GameHub', GameHub)
    app.component('TicTacToe', TicTacToe)
    app.component('Gomoku', Gomoku)
    app.component('GameOfLife', GameOfLife)
    app.component('Minesweeper', Minesweeper)
    app.component('Game2048', Game2048)
    app.component('Sudoku', Sudoku)
  }
}