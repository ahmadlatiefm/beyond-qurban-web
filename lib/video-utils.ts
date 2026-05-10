export function getEmbedUrl(url: string): string | null {
  const ytWatch = url.match(/youtube\.com\/watch\?v=([^&]+)/)
  if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}`

  const ytShort = url.match(/youtu\.be\/([^?]+)/)
  if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}`

  const ytShorts = url.match(/youtube\.com\/shorts\/([^?]+)/)
  if (ytShorts) return `https://www.youtube.com/embed/${ytShorts[1]}`

  const drive = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`

  return null
}

export function isValidVideoUrl(url: string): boolean {
  return getEmbedUrl(url) !== null
}

export function getYoutubeThumbnail(url: string): string | null {
  const ytWatch = url.match(/youtube\.com\/watch\?v=([^&]+)/)
  if (ytWatch) return `https://img.youtube.com/vi/${ytWatch[1]}/mqdefault.jpg`

  const ytShort = url.match(/youtu\.be\/([^?]+)/)
  if (ytShort) return `https://img.youtube.com/vi/${ytShort[1]}/mqdefault.jpg`

  const ytShorts = url.match(/youtube\.com\/shorts\/([^?]+)/)
  if (ytShorts) return `https://img.youtube.com/vi/${ytShorts[1]}/mqdefault.jpg`

  return null
}
