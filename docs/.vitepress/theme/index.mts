import { h, defineAsyncComponent } from 'vue' // 引入 defineAsyncComponent
import DefaultTheme from 'vitepress/theme'
import './custom.css' // 保留你的自定义样式
// 引入随机跳转的组件
import RandomJump from './components/RandomJump.vue' 

// 使用异步加载，只有当组件在页面上渲染时才会加载对应的 JS
const GameHub = defineAsyncComponent(() => import('./components/games/GameHub.vue'))
const TicTacToe = defineAsyncComponent(() => import('./components/games/TicTacToe.vue'))
const Gomoku = defineAsyncComponent(() => import('./components/games/Gomoku.vue'))
const GameOfLife = defineAsyncComponent(() => import('./components/games/GameOfLife.vue'))
const Minesweeper = defineAsyncComponent(() => import('./components/games/Minesweeper.vue'))
const Game2048 = defineAsyncComponent(() => import('./components/games/Game2048.vue'))
const Sudoku = defineAsyncComponent(() => import('./components/games/Sudoku.vue'))

export default {
  extends: DefaultTheme, // 使用 extends 继承默认主题
  Layout() {
    // 扩展默认的 Layout
    return h(DefaultTheme.Layout, null, {
      // 在导航栏内容之后（通常是github图标左边或右边）插入随机跳转按钮
      'nav-bar-content-after': () => h(RandomJump)
    })
  },
  // 注册全局组件，
  enhanceApp({ app }) {
    // 注册全局RandomJump组件
    app.component('RandomJump', RandomJump)
    // 注册异步组件
    app.component('GameHub', GameHub)// 游戏组件总汇
    app.component('TicTacToe', TicTacToe)// 井字棋
    app.component('Gomoku', Gomoku)// 五子棋
    app.component('GameOfLife', GameOfLife)// 生命游戏
    app.component('Minesweeper', Minesweeper)// 扫雷
    app.component('Game2048', Game2048)// 2048
    app.component('Sudoku', Sudoku)// 数独
  }
  
}