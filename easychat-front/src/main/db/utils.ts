/**
 * 生成UUID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 根据文件名获取文件扩展名
 */
export function getFileExtension(fileName: string): string {
  if (!fileName) return ''
  const parts = fileName.split('.')
  return parts.length > 1 ? '.' + parts.pop()?.toLowerCase() : ''
}

/**
 * 根据文件名判断文件类型
 */
export function getFileType(fileName: string): string {
  if (!fileName) return 'document'

  const imageExtensions = ['.jpg', '.jpeg', '.jpe', '.jfif', '.png', '.gif', '.bmp', '.webp']
  const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv']
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.m4a']

  const extension = getFileExtension(fileName)

  if (imageExtensions.includes(extension)) return 'image'
  if (videoExtensions.includes(extension)) return 'video'
  if (audioExtensions.includes(extension)) return 'audio'

  return 'document'
}
