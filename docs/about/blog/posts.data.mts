import { createContentLoader } from 'vitepress'

// 作用：在构建（Build）阶段，自动扫描 blog 目录下的所有 Markdown 文章，
// 提取元数据（标题、日期、摘要），并按时间倒序排列，生成一个文章列表数据。
interface Post {
  title: string
  url: string
  date: {
    time: number
    string: string
  }
  excerpt: string | undefined
  description: string | undefined
}

declare const data: Post[]
export { data }

export default createContentLoader('about/blog/**/*.md', {
  excerpt: true,
  transform(raw): Post[] {
    return raw
      .filter(({ url }) => {
        const isArchive = url.includes('/about/blog/archive/')
        const isIndex = url === '/about/blog/' || url.endsWith('/') || url.endsWith('/index')
        return !isArchive && !isIndex
      })
      .map(({ url, frontmatter, excerpt }) => ({
        title: frontmatter.title,
        url,
        excerpt,
        description: frontmatter.description,
        date: formatDate(frontmatter.date)
      }))
      .sort((a, b) => {
        const dateDiff = b.date.time - a.date.time
        if (dateDiff !== 0) return dateDiff
        return b.url.localeCompare(a.url)
      })
  }
})

function formatDate(raw: string | number | Date) {
  // 转化为时间戳，支持 '2025-11-19' (00:00) 或 '2025-11-19 14:00'
  const date = new Date(raw)
  
  return {
    time: +date, // 用于排序的毫秒数
    // 用于显示的字符串 (这里只显示年月日，不显示具体时间，保持清爽)
    string: date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}
