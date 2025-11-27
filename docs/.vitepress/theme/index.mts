import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import './custom.css' // 保留你的自定义样式
import RandomJump from './components/RandomJump.vue' // 引入刚才创建的组件

export default {
  extends: DefaultTheme, // 使用 extends 继承默认主题
  Layout() {
    // 扩展默认的 Layout
    return h(DefaultTheme.Layout, null, {
      // 在导航栏内容之后（通常是社交图标左边或右边）插入我们的按钮
      'nav-bar-content-after': () => h(RandomJump)
    })
  },
  enhanceApp({ app }) {
    // 注册全局组件，这样你也可以在 markdown 文件里直接写 <RandomJump />
    app.component('RandomJump', RandomJump)
  }
}