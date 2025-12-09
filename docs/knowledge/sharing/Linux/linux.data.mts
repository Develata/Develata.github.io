import { createContentLoader } from 'vitepress'

interface Post {
  title: string
  url: string
  date: {
    time: number
    string: string
  }
  excerpt: string | undefined
}

declare const data: Post[]
export { data }

export default createContentLoader('knowledge/sharing/Linux/**/*.md', {
  excerpt: true,
  transform(raw): Post[] {
    return raw
      .filter(({ url }) => !url.endsWith('/目录') && !url.endsWith('/index')) // 排除目录页和索引页
      .map(({ url, frontmatter, excerpt }) => ({
        title: frontmatter.title || url.split('/').pop()?.replace(/^\d+-?/, '').replace(/\.md$/, '') || '无标题',
        url,
        excerpt,
        date: formatDate(frontmatter.date)
      }))
      .sort((a, b) => b.date.time - a.date.time)
  }
})

function formatDate(raw: string | number | Date) {
  const date = new Date(raw || new Date()) // 如果没有日期，使用当前日期或文件修改时间（这里简化为当前日期，实际可能需要fs.stat）
  // 注意：createContentLoader 默认不提供文件修改时间，除非配置 includeSrc: true 并自己解析，或者依赖 git timestamp
  // 这里简单处理，如果没有 frontmatter.date，就放最后或者按文件名排序可能更好。
  // 为了演示，这里先不强求准确日期排序，主要展示列表。
  return {
    time: +date,
    string: date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }
}
