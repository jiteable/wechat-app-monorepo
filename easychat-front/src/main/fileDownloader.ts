import { net } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { shell } from 'electron'

/**
 * 下载文件到指定路径
 * @param url 文件URL
 * @param fileName 文件名
 * @param savePath 保存路径基础目录
 * @returns 保存的完整文件路径
 */
/**
 * 下载文件到指定路径
 * @param url 文件URL
 * @param fileName 文件名
 * @param savePath 保存路径基础目录或完整文件路径
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

    let finalPath: string

    // 检查savePath是否已经是一个完整的文件路径（包含文件名）
    const pathExt = path.extname(savePath)
    if (pathExt) {
      // savePath已经是完整文件路径，直接使用
      finalPath = savePath
      // 确保目录存在
      const dirPath = path.dirname(finalPath)
      if (!fs.existsSync(dirPath)) {
        try {
          fs.mkdirSync(dirPath, { recursive: true })
        } catch (err) {
          reject(new Error(`无法创建目录: ${(err as Error).message}`))
          return
        }
      }
    } else {
      // savePath是基础目录，使用原来逻辑创建日期子文件夹
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
      finalPath = getUniqueFilePath(fullPath)
    }

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

      response.on('data', (chunk) => {
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
 * 检查文件是否已存在，如果存在则打开文件或文件夹
 * @param fileName 文件名
 * @param basePath 基础路径
 * @param dateStr 消息发送日期 (格式: YYYY-MM)
 * @returns 检查结果和操作信息
 */
export async function checkAndOpenFile(
  fileName: string,
  basePath: string,
  dateStr?: string
): Promise<{ exists: boolean; message: string }> {
  try {
    // 构建搜索路径
    const filesPath = path.join(basePath, 'files')

    // 检查目录是否存在
    if (!fs.existsSync(filesPath)) {
      return { exists: false, message: '文件目录不存在' }
    }

    // 递归搜索所有子目录中的文件
    const foundFile = findFileInDirectory(filesPath, fileName, dateStr)

    if (foundFile) {
      try {
        // 尝试打开文件
        const opened = shell.openPath(foundFile)
        opened.then((error) => {
          if (error) {
            // 如果无法打开文件，则打开文件所在文件夹
            const dirPath = path.dirname(foundFile)
            shell.openPath(dirPath)
          }
        })
        return {
          exists: true,
          message: '文件已找到并打开'
        }
      } catch (openError) {
        // 如果无法打开文件，则打开文件所在文件夹
        try {
          const dirPath = path.dirname(foundFile)
          shell.openPath(dirPath)
          return {
            exists: true,
            message: '文件已找到，已打开文件所在文件夹'
          }
        } catch (folderError) {
          return {
            exists: true,
            message: `文件已找到，但无法打开: ${foundFile}`
          }
        }
      }
    }

    return { exists: false, message: '文件未找到，开始下载...' }
  } catch (error) {
    console.error('检查文件时出错:', error)
    return { exists: false, message: '检查文件时出错' }
  }
}

/**
 * 在目录中递归查找文件
 * @param dir 目录路径
 * @param targetFileName 目标文件名
 * @param dateStr 日期字符串 (格式: YYYY-MM)
 * @returns 找到的文件完整路径，未找到则返回null
 */
function findFileInDirectory(dir: string, targetFileName: string, dateStr?: string): string | null {
  try {
    // 如果提供了日期参数，优先在对应日期的文件夹中查找
    if (dateStr) {
      const datePath = path.join(dir, dateStr)
      if (fs.existsSync(datePath)) {
        const directPath = path.join(datePath, targetFileName)
        if (fs.existsSync(directPath)) {
          return directPath
        }
      }
    }

    // 如果在特定日期目录中未找到，则在整个目录结构中递归查找
    const items = fs.readdirSync(dir)

    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        // 递归搜索子目录
        const found = findFileInDirectory(fullPath, targetFileName, dateStr)
        if (found) {
          return found
        }
      } else if (stat.isFile() && item === targetFileName) {
        // 找到目标文件
        return fullPath
      }
    }

    return null
  } catch (error) {
    console.error('搜索文件时出错:', error)
    return null
  }
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
