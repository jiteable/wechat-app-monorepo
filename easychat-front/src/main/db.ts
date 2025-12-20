/* eslint-disable @typescript-eslint/no-explicit-any */
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

/**
 * 数据库管理类
 */
class DatabaseManager {
  private dbPath: string
  private db: sqlite3.Database | null = null

  constructor() {
    // 使用指定路径 D:\EasyChat\fileStorage
    const dbDir = 'D:\\EasyChat\\fileStorage'
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true })
    }
    this.dbPath = join(dbDir, 'easychat.db')
  }

  /**
   * 检查数据库是否存在
   */
  public checkDatabaseExists(): boolean {
    return existsSync(this.dbPath)
  }

  /**
   * 创建数据库及表结构
   */
  public async createDatabase(): Promise<void> {
    try {
      // 打开数据库
      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      // 创建所有表
      await this.createTables(db)

      await db.close()
      console.log('数据库及表结构已创建于:', this.dbPath)
    } catch (error) {
      console.error('创建数据库失败:', error)
    }
  }

  /**
   * 检查并创建所有必需的表
   */
  public async initializeTables(): Promise<void> {
    try {
      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      // 检查并创建所有表（使用IF NOT EXISTS确保安全）
      await this.createTables(db)

      await db.close()
      console.log('所有表已初始化完成')
    } catch (error) {
      console.error('初始化表结构失败:', error)
      throw error
    }
  }

  /**
   * 创建所有必需的表
   * @param db 数据库连接
   */
  private async createTables(db: any): Promise<void> {
    // 创建 Session 表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Session (
        id TEXT PRIMARY KEY,
        sessionToken TEXT UNIQUE,
        userId TEXT,
        expires DATETIME
      )
    `)

    await db.exec(`
      CREATE TABLE IF NOT EXISTS ChatSession (
        id TEXT PRIMARY KEY,
        sessionType TEXT,
        name TEXT,
        avatar TEXT,
        ownerId TEXT,
        groupId TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        isPinned BOOLEAN DEFAULT 0,
        isMuted BOOLEAN DEFAULT 0,
        isDeleted BOOLEAN DEFAULT 0,
        deletedAt DATETIME
      )
    `)

    // 创建 UnifiedMessage 表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS UnifiedMessage (
        id TEXT PRIMARY KEY,
        sessionId TEXT,
        senderId TEXT,
        receiverId TEXT,
        groupId TEXT,
        content TEXT,
        messageType TEXT DEFAULT 'text',
        mediaUrl TEXT,
        fileName TEXT,
        fileSize INTEGER,
        isRecalled BOOLEAN DEFAULT 0,
        isDeleted BOOLEAN DEFAULT 0,
        status TEXT DEFAULT 'SENDING',
        readStatus BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        recalledAt DATETIME,
        deletedAt DATETIME,
        FOREIGN KEY (sessionId) REFERENCES ChatSession(id)
      )
    `)

    // 创建 File 表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS File (
        id TEXT PRIMARY KEY,
        name TEXT,
        url TEXT,
        thumbnailUrl TEXT,
        size INTEGER,
        mimeType TEXT,
        fileExtension TEXT,
        fileType TEXT,
        uploaderId TEXT,
        unifiedMessageId TEXT UNIQUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        expireAt DATETIME,
        sessionId TEXT,
        FOREIGN KEY (unifiedMessageId) REFERENCES UnifiedMessage(id) ON DELETE SET NULL,
        FOREIGN KEY (sessionId) REFERENCES ChatSession(id) ON DELETE SET NULL
      )
    `)

    // 创建 Video 表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Video (
        id TEXT PRIMARY KEY,
        fileId TEXT UNIQUE,
        duration REAL,
        width INTEGER,
        height INTEGER,
        bitrate INTEGER,
        codec TEXT,
        fps REAL,
        thumbnailUrl TEXT,
        previewUrl TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (fileId) REFERENCES File(id)
      )
    `)

    await db.exec(`
      CREATE TABLE IF NOT EXISTS ChatSessionUser (
        id TEXT PRIMARY KEY,
        sessionId TEXT,
        userId TEXT,
        joinTime DATETIME DEFAULT CURRENT_TIMESTAMP,
        lastReadTime DATETIME DEFAULT CURRENT_TIMESTAMP,
        isMuted BOOLEAN DEFAULT 0,
        isPinned BOOLEAN DEFAULT 0,
        customRemark TEXT,
        unreadCount INTEGER DEFAULT 0,
        sessionType TEXT,
        identity TEXT,
        nickname TEXT,
        remark TEXT,
        showMemberNameCard BOOLEAN DEFAULT 1,
        background TEXT,
        displayName TEXT,
        displayAvatar TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sessionId) REFERENCES ChatSession(id),
        FOREIGN KEY (userId) REFERENCES Session(userId)
      )
    `)
  }

  /**
   * 向ChatSession表中添加一条数据
   */
  public async addChatSession(sessionData: any): Promise<any> {
    try {
      // 确保传入了必要的数据
      if (!sessionData) {
        throw new Error('会话数据不能为空')
      }

      // 检查必要字段
      if (!sessionData.id) {
        throw new Error('会话数据必须包含id字段')
      }

      // 确保表存在
      await this.initializeTables()

      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      // 插入数据到ChatSession表
      await db.run(
        `INSERT INTO ChatSession 
         (id, sessionType, name, avatar, ownerId, groupId, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sessionData.id,
          sessionData.sessionType,
          sessionData.name,
          sessionData.avatar,
          sessionData.ownerId,
          sessionData.groupId,
          sessionData.createdAt || new Date().toISOString(),
          sessionData.updatedAt || new Date().toISOString()
        ]
      )

      console.log('成功向ChatSession表中添加了一条数据')

      // 查询刚刚插入的数据
      const result = await db.get(`SELECT * FROM ChatSession WHERE id = ?`, [sessionData.id])

      await db.close()

      console.log('新创建的数据:', result)
      return result
    } catch (error) {
      console.error('操作ChatSession表失败:', error)
      throw error
    }
  }

  /**
   * 获取ChatSession表中的所有数据
   */
  public async getAllChatSessions(): Promise<any[]> {
    try {
      // 确保表存在
      await this.initializeTables()

      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      // 查询所有ChatSession数据
      const sessions = await db.all(`SELECT * FROM ChatSession`)

      await db.close()

      return sessions
    } catch (error) {
      console.error('查询ChatSession表失败:', error)
      throw error
    }
  }

  /**
   * 清空ChatSession表中的所有数据
   */
  public async clearChatSessions(): Promise<void> {
    try {
      // 确保表存在
      await this.initializeTables()

      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      // 清空ChatSession表
      await db.run(`DELETE FROM ChatSession`)

      await db.close()

      console.log('成功清空ChatSession表中的所有数据')
    } catch (error) {
      console.error('清空ChatSession表失败:', error)
      throw error
    }
  }

  public async upsertChatSession(sessionData: any): Promise<void> {
    try {
      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      await db.run(
        `
      INSERT OR REPLACE INTO ChatSession 
      (id, sessionType, name, avatar, ownerId, groupId, createdAt, updatedAt, isPinned, isMuted, isDeleted, deletedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
          sessionData.id,
          sessionData.sessionType,
          sessionData.name,
          sessionData.avatar,
          sessionData.ownerId,
          sessionData.groupId,
          sessionData.createdAt || new Date().toISOString(),
          sessionData.updatedAt || new Date().toISOString(),
          sessionData.isPinned ? 1 : 0,
          sessionData.isMuted ? 1 : 0,
          sessionData.isDeleted ? 1 : 0,
          sessionData.deletedAt
        ]
      )

      await db.close()
    } catch (error) {
      console.error('Upsert ChatSession failed:', error)
      throw error
    }
  }

  public async updateChatSession(sessionId: string, updateData: any): Promise<void> {
    try {
      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      const fields: string[] = []
      const values: any[] = []

      for (const [key, value] of Object.entries(updateData)) {
        fields.push(`${key} = ?`)
        values.push(value)
      }

      values.push(sessionId)

      await db.run(
        `
      UPDATE ChatSession 
      SET ${fields.join(', ')}, updatedAt = ?
      WHERE id = ?
    `,
        [...values, new Date().toISOString(), sessionId]
      )

      await db.close()
    } catch (error) {
      console.error('Update ChatSession failed:', error)
      throw error
    }
  }

  public async deleteChatSession(sessionId: string): Promise<void> {
    try {
      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      await db.run(`DELETE FROM ChatSession WHERE id = ?`, [sessionId])
      await db.close()
    } catch (error) {
      console.error('Delete ChatSession failed:', error)
      throw error
    }
  }

  /**
   * 插入或更新ChatSessionUser记录
   */
  public async upsertChatSessionUser(userData: any): Promise<void> {
    try {
      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      await db.run(
        `
        INSERT OR REPLACE INTO ChatSessionUser 
        (id, sessionId, userId, joinTime, lastReadTime, isMuted, isPinned, customRemark, 
         unreadCount, sessionType, identity, nickname, remark, showMemberNameCard, 
         background, displayName, displayAvatar, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          userData.id,
          userData.sessionId,
          userData.userId,
          userData.joinTime || new Date().toISOString(),
          userData.lastReadTime || new Date().toISOString(),
          userData.isMuted ? 1 : 0,
          userData.isPinned ? 1 : 0,
          userData.customRemark || null,
          userData.unreadCount || 0,
          userData.sessionType,
          userData.identity || null,
          userData.nickname || null,
          userData.remark || null,
          userData.showMemberNameCard !== undefined ? (userData.showMemberNameCard ? 1 : 0) : 1,
          userData.background || null,
          userData.displayName || null,
          userData.displayAvatar || null,
          userData.createdAt || new Date().toISOString(),
          userData.updatedAt || new Date().toISOString()
        ]
      )

      await db.close()
    } catch (error) {
      console.error('Upsert ChatSessionUser failed:', error)
      throw error
    }
  }

  /**
   * 更新ChatSessionUser记录
   */
  public async updateChatSessionUser(id: string, updateData: any): Promise<void> {
    try {
      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      const fields: string[] = []
      const values: any[] = []

      // 处理布尔值和普通字段
      for (const [key, value] of Object.entries(updateData)) {
        if (key === 'isMuted' || key === 'isPinned' || key === 'showMemberNameCard') {
          fields.push(`${key} = ?`)
          values.push(value ? 1 : 0)
        } else {
          fields.push(`${key} = ?`)
          values.push(value)
        }
      }

      values.push(id)

      await db.run(
        `
        UPDATE ChatSessionUser 
        SET ${fields.join(', ')}, updatedAt = ?
        WHERE id = ?
        `,
        [...values, new Date().toISOString(), id]
      )

      await db.close()
    } catch (error) {
      console.error('Update ChatSessionUser failed:', error)
      throw error
    }
  }

  /**
   * 根据sessionId和userId获取ChatSessionUser记录
   */
  public async getChatSessionUser(sessionId: string, userId: string): Promise<any> {
    try {
      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      const result = await db.get(
        `SELECT * FROM ChatSessionUser WHERE sessionId = ? AND userId = ?`,
        [sessionId, userId]
      )

      await db.close()

      // 处理布尔值
      if (result) {
        result.isMuted = !!result.isMuted
        result.isPinned = !!result.isPinned
        result.showMemberNameCard = !!result.showMemberNameCard
      }

      return result
    } catch (error) {
      console.error('Get ChatSessionUser failed:', error)
      throw error
    }
  }

  /**
   * 根据sessionId获取所有ChatSessionUser记录
   */
  public async getChatSessionUsersBySessionId(sessionId: string): Promise<any[]> {
    try {
      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      const results = await db.all(`SELECT * FROM ChatSessionUser WHERE sessionId = ?`, [sessionId])

      await db.close()

      // 处理布尔值
      return results.map((result) => ({
        ...result,
        isMuted: !!result.isMuted,
        isPinned: !!result.isPinned,
        showMemberNameCard: !!result.showMemberNameCard
      }))
    } catch (error) {
      console.error('Get ChatSessionUsers by sessionId failed:', error)
      throw error
    }
  }

  public async deleteChatSessionUser(id: string): Promise<void> {
    try {
      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      await db.run(`DELETE FROM ChatSessionUser WHERE id = ?`, [id])
      await db.close()
    } catch (error) {
      console.error('Delete ChatSessionUser failed:', error)
      throw error
    }
  }

  /**
   * 更新用户的未读消息计数
   */
  public async updateUnreadCount(
    sessionId: string,
    userId: string,
    unreadCount: number
  ): Promise<void> {
    try {
      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      await db.run(
        `UPDATE ChatSessionUser SET unreadCount = ?, updatedAt = ? WHERE sessionId = ? AND userId = ?`,
        [unreadCount, new Date().toISOString(), sessionId, userId]
      )

      await db.close()
    } catch (error) {
      console.error('Update unread count failed:', error)
      throw error
    }
  }

  /**
   * 增加用户的未读消息计数
   */
  public async incrementUnreadCount(sessionId: string, userId: string): Promise<void> {
    try {
      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      await db.run(
        `UPDATE ChatSessionUser SET unreadCount = unreadCount + 1, updatedAt = ? WHERE sessionId = ? AND userId = ?`,
        [new Date().toISOString(), sessionId, userId]
      )

      await db.close()
    } catch (error) {
      console.error('Increment unread count failed:', error)
      throw error
    }
  }

  /**
   * 重置用户的未读消息计数
   */
  public async resetUnreadCount(sessionId: string, userId: string): Promise<void> {
    try {
      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      await db.run(
        `UPDATE ChatSessionUser SET unreadCount = 0, lastReadTime = ?, updatedAt = ? WHERE sessionId = ? AND userId = ?`,
        [new Date().toISOString(), new Date().toISOString(), sessionId, userId]
      )

      await db.close()
    } catch (error) {
      console.error('Reset unread count failed:', error)
      throw error
    }
  }

  /**
   * 向UnifiedMessage表中添加一条数据
   */
  public async addUnifiedMessage(messageData: any): Promise<any> {
    try {
      // 确保表存在
      await this.initializeTables()

      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      // 根据消息类型处理不同字段
      let fileRecord: any = null
      if (
        (messageData.messageType === 'file' || messageData.messageType === 'video') &&
        messageData.mediaUrl &&
        messageData.fileName &&
        messageData.fileSize
      ) {
        // 创建文件记录
        fileRecord = await db.run(
          `INSERT INTO File 
           (id, name, url, thumbnailUrl, size, mimeType, fileExtension, fileType, uploaderId, createdAt, expireAt, sessionId)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            messageData.fileId || this.generateUUID(),
            messageData.fileName,
            messageData.mediaUrl,
            messageData.thumbnailUrl || null,
            messageData.fileSize,
            messageData.mimeType || '',
            messageData.fileExtension || this.getFileExtension(messageData.fileName),
            messageData.fileType || this.getFileType(messageData.fileName),
            messageData.senderId,
            messageData.createdAt || new Date().toISOString(),
            messageData.expireAt || null,
            messageData.sessionId
          ]
        )

        // 如果是视频消息，还需要创建视频记录
        if (messageData.messageType === 'video' && messageData.videoInfo) {
          await db.run(
            `INSERT INTO Video 
             (id, fileId, duration, width, height, bitrate, codec, fps, thumbnailUrl, previewUrl, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              this.generateUUID(),
              fileRecord.lastID, // 使用刚创建的文件ID
              messageData.videoInfo.duration || null,
              messageData.videoInfo.width || null,
              messageData.videoInfo.height || null,
              messageData.videoInfo.bitrate || null,
              messageData.videoInfo.codec || null,
              messageData.videoInfo.fps || null,
              messageData.videoInfo.thumbnailUrl || null,
              messageData.videoInfo.previewUrl || null,
              new Date().toISOString(),
              new Date().toISOString()
            ]
          )
        }
      }

      // 插入消息记录
      const result = await db.run(
        `INSERT INTO UnifiedMessage 
         (id, sessionId, senderId, receiverId, groupId, content, messageType, mediaUrl, fileName, fileSize, 
          isRecalled, isDeleted, status, readStatus, createdAt, updatedAt, recalledAt, deletedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          messageData.id || this.generateUUID(),
          messageData.sessionId,
          messageData.senderId,
          messageData.receiverId || null,
          messageData.groupId || null,
          messageData.content || '',
          messageData.messageType,
          messageData.mediaUrl || null,
          messageData.fileName || null,
          messageData.fileSize || null,
          messageData.isRecalled ? 1 : 0,
          messageData.isDeleted ? 1 : 0,
          messageData.status || 'SENT',
          messageData.readStatus ? 1 : 0,
          messageData.createdAt || new Date().toISOString(),
          messageData.updatedAt || new Date().toISOString(),
          messageData.recalledAt || null,
          messageData.deletedAt || null
        ]
      )

      console.log('成功向UnifiedMessage表中添加了一条数据')

      // 查询刚刚插入的数据
      const insertedMessage = await db.get(`SELECT * FROM UnifiedMessage WHERE id = ?`, [
        messageData.id || result.lastID
      ])

      await db.close()

      console.log('新创建的消息数据aaaaaaaa:', insertedMessage)
      return insertedMessage
    } catch (error) {
      console.error('操作UnifiedMessage表失败:', error)
      throw error
    }
  }

  public async getAllUnifiedMessages(): Promise<any[]> {
    try {
      // 确保表存在
      await this.initializeTables()

      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      // 查询所有UnifiedMessage数据
      const messages = await db.all(`SELECT * FROM UnifiedMessage`)

      await db.close()

      return messages
    } catch (error) {
      console.error('查询UnifiedMessage表失败:', error)
      throw error
    }
  }

  public async getMessagesBySessionId(
    sessionId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ messages: any[]; pagination: any }> {
    try {
      // 确保表存在
      await this.initializeTables()

      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      const skip = (page - 1) * limit

      // 查询消息记录总数
      const totalResult = await db.get(
        `SELECT COUNT(*) as count FROM UnifiedMessage WHERE sessionId = ?`,
        [sessionId]
      )
      const totalMessages = totalResult.count

      // 查询消息记录，按创建时间倒序排列（从新到旧）
      const messages = await db.all(
        `SELECT m.*, 
                f.thumbnailUrl as file_thumbnailUrl,
                v.duration as video_duration,
                v.width as video_width,
                v.height as video_height
         FROM UnifiedMessage m
         LEFT JOIN File f ON m.id = f.unifiedMessageId
         LEFT JOIN Video v ON f.id = v.fileId
         WHERE m.sessionId = ?
         ORDER BY m.createdAt DESC
         LIMIT ? OFFSET ?`,
        [sessionId, limit, skip]
      )

      // 处理消息数据，确保视频文件的thumbnailUrl被包含
      const processedMessages = messages.map((message) => {
        if (message.file_thumbnailUrl) {
          const processedMessage = {
            ...message,
            thumbnailUrl: message.file_thumbnailUrl
          }

          // 如果文件有关联的视频信息，也包含视频的宽度和高度
          if (message.video_duration || message.video_width || message.video_height) {
            processedMessage.videoInfo = {
              duration: message.video_duration,
              width: message.video_width,
              height: message.video_height
            }
          }

          return processedMessage
        }
        return message
      })

      // 计算分页信息
      const totalPages = Math.ceil(totalMessages / limit)
      const hasNextPage = page < totalPages
      const hasPrevPage = page > 1

      await db.close()

      return {
        messages: processedMessages,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalMessages: totalMessages,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage
        }
      }
    } catch (error) {
      console.error('根据sessionId获取消息失败:', error)
      throw error
    }
  }

  /**
   * 根据ID删除UnifiedMessage记录
   */
  public async deleteUnifiedMessage(id: string): Promise<void> {
    try {
      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      // 先删除关联的文件和视频记录
      const message = await db.get(`SELECT id FROM UnifiedMessage WHERE id = ?`, [id])
      if (message) {
        // 删除关联的文件记录
        await db.run(`DELETE FROM File WHERE unifiedMessageId = ?`, [id])

        // 删除消息记录
        await db.run(`DELETE FROM UnifiedMessage WHERE id = ?`, [id])
      }

      await db.close()
    } catch (error) {
      console.error('Delete UnifiedMessage failed:', error)
      throw error
    }
  }

  /**
   * 根据ID删除File记录
   */
  public async deleteFile(id: string): Promise<void> {
    try {
      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      // 先删除关联的视频记录
      const file = await db.get(`SELECT id FROM File WHERE id = ?`, [id])
      if (file) {
        // 删除关联的视频记录
        await db.run(`DELETE FROM Video WHERE fileId = ?`, [id])

        // 删除文件记录
        await db.run(`DELETE FROM File WHERE id = ?`, [id])
      }

      await db.close()
    } catch (error) {
      console.error('Delete File failed:', error)
      throw error
    }
  }

  /**
   * 生成UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0
      const v = c == 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  /**
   * 根据文件名获取文件扩展名
   */
  private getFileExtension(fileName: string): string {
    if (!fileName) return ''
    const parts = fileName.split('.')
    return parts.length > 1 ? '.' + parts.pop()?.toLowerCase() : ''
  }

  /**
   * 根据文件名判断文件类型
   */
  private getFileType(fileName: string): string {
    if (!fileName) return 'document'

    const imageExtensions = ['.jpg', '.jpeg', '.jpe', '.jfif', '.png', '.gif', '.bmp', '.webp']
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv']
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.m4a']

    const extension = this.getFileExtension(fileName)

    if (imageExtensions.includes(extension)) return 'image'
    if (videoExtensions.includes(extension)) return 'video'
    if (audioExtensions.includes(extension)) return 'audio'

    return 'document'
  }
  /**
   * 获取数据库路径
   */
  public getDbPath(): string {
    return this.dbPath
  }
}

export const databaseManager = new DatabaseManager()
