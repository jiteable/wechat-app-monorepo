import { net } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

/**
 * 下载文件到指定路径
 * @param url 文件URL
 * @param fileName 文件名
 * @param savePath 保存路径基础目录
 * @returns 保存的完整文件路径
 */
export async function downloadFile(
  url: string,
  fileName: string,
  savePath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    // 验证URL有效性
    try {
      new URL(url)
    } catch (err) {
      reject(new Error(`无效的URL: ${url}`))
      return
    }

    // 构建带日期的完整保存路径: 基础路径/files/年月/
    const currentDate = new Date().toISOString().slice(0, 7) // 格式: YYYY-MM
    const finalSavePath = path.join(savePath, 'files', currentDate)

    // 确保保存目录存在
    if (!fs.existsSync(finalSavePath)) {
      try {
        fs.mkdirSync(finalSavePath, { recursive: true })
      } catch (err) {
        reject(new Error(`无法创建目录: ${(err as Error).message}`))
        return
      }
    }

    // 构建完整的文件路径
    const fullPath = path.join(finalSavePath, fileName)

    // 处理文件名冲突
    const finalPath = getUniqueFilePath(fullPath)

    // 发起网络请求
    const request = net.request({
      url: url,
      redirect: 'follow' // 自动跟随重定向
    })

    request.on('response', (response) => {
      // 检查状态码
      if (response.statusCode >= 400) {
        reject(new Error(`下载失败，HTTP状态码: ${response.statusCode} ${response.statusMessage}`))
        return
      }

      // 对于重定向响应，我们需要处理Location头部
      if (response.statusCode >= 300 && response.statusCode < 400) {
        const location = response.headers.location
        if (location && location.length > 0) {
          // 递归调用下载函数处理重定向
          downloadFile(location[0], fileName, savePath).then(resolve).catch(reject)
          return
        }
      }

      const fileStream = fs.createWriteStream(finalPath)
      let receivedBytes = 0

      response.on('data', (chunk) => {
        receivedBytes += chunk.length
        fileStream.write(chunk)
      })

      response.on('end', () => {
        fileStream.end(() => {
          resolve(finalPath)
        })
      })

      fileStream.on('error', (err) => {
        reject(new Error(`写入文件失败: ${(err as Error).message}`))
      })
    })

    request.on('error', (err) => {
      reject(new Error(`网络请求失败: ${(err as Error).message}`))
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
