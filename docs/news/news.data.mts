import { createContentLoader } from 'vitepress'

interface News {
  title: string
  url: string
  date: {
    time: number
    string: string
  }
  excerpt: string | undefined
}

declare const data: News[]
export { data }

export default createContentLoader('news/**/*.md', {
  excerpt: true,
  transform(raw): News[] {
    return raw
      .filter(({ url }) => url !== '/news/' && !url.includes('/news/index'))
      .map(({ url, frontmatter, excerpt }) => ({
        title: frontmatter.title,
        url,
        excerpt,
        date: formatDate(frontmatter.date)
      }))
      .sort((a, b) => b.date.time - a.date.time) // 按日期倒序
  }
})

function formatDate(raw: string | number | Date) {
  const date = new Date(raw)
  return {
    time: +date,
    string: date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }
}