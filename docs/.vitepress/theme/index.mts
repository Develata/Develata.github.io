import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import './custom.css' // 保留你的自定义样式
// 引入随机跳转的组件
import RandomJump from './components/RandomJump.vue' 
//引入游戏组件
import GameHub from './components/games/GameHub.vue'// 游戏组件总汇
import TicTacToe from './components/games/TicTacToe.vue'// 井字棋组件
import Gomoku from './components/games/Gomoku.vue'// 五子棋组件

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
    // 注册全局游戏组件
    app.component('TicTacToe', TicTacToe)// 井字棋
    app.component('GameHub', GameHub)// 游戏组件总汇
    app.component('Gomoku', Gomoku)// 五子棋
  }
  
}