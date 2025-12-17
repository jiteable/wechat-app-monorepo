import { app, net } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

/**
 * 下载文件到指定路径
 * @param url 文件URL
 * @param fileName 文件名
 * @param savePath 保存路径
 * @returns 保存的完整文件路径
 */
export async function downloadFile(url: string, fileName: string, savePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // 确保保存目录存在
    if (!fs.existsSync(savePath)) {
      try {
        fs.mkdirSync(savePath, { recursive: true })
      } catch (err) {
        reject(new Error(`无法创建目录: ${err.message}`))
        return
      }
    }

    // 构建完整的文件路径
    const fullPath = path.join(savePath, fileName)

    // 处理文件名冲突
    const finalPath = getUniqueFilePath(fullPath)

    // 发起网络请求
    const request = net.request(url)

    request.on('response', (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`下载失败，HTTP状态码: ${response.statusCode}`))
        return
      }

      const fileStream = fs.createWriteStream(finalPath)

      response.pipe(fileStream)

      fileStream.on('finish', () => {
        fileStream.close()
        resolve(finalPath)
      })

      fileStream.on('error', (err) => {
        reject(new Error(`写入文件失败: ${err.message}`))
      })
    })

    request.on('error', (err) => {
      reject(new Error(`网络请求失败: ${err.message}`))
    })

    request.end()
  })
}

/**
 * 获取唯一的文件路径（处理重名文件）
 * @param filePath 原始文件路径
 * @returns 唯一的文件路径
 */
function getUniqueFilePath(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    return filePath
  }

  const dir = path.dirname(filePath)
  const ext = path.extname(filePath)
  const name = path.basename(filePath, ext)

  let counter = 1
  let uniquePath = filePath

  while (fs.existsSync(uniquePath)) {
    uniquePath = path.join(dir, `${name} (${counter})${ext}`)
    counter++
  }

  return uniquePath
}
