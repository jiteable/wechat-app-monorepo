/* eslint-disable @typescript-eslint/no-explicit-any */
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { generateUUID, getFileExtension, getFileType } from './utils'

/**
 * 数据库管理类
 */
class DatabaseManager {
  private dbPath: string
  private currentUserId: string | null = null

  constructor() {
    // 默认路径
    const dbDir = 'D:\\EasyChat\\fileStorage'
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true })
    }
    this.dbPath = join(dbDir, 'easychat.db')
  }

  /**
   * 设置当前用户并初始化用户特定的数据库
   */
  public setCurrentUser(userId: string): void {
    const dbDir = `D:\\EasyChat\\fileStorage\\${userId}`
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true })
    }
    this.dbPath = join(dbDir, 'easychat.db')
    this.currentUserId = userId
  }

  /**
   * 获取当前用户的数据库路径
   */
  public getCurrentUserDbPath(): string {
    return this.dbPath
  }

  /**
   * 检查指定用户的数据库是否存在
   */
  public checkDatabaseExists(userId: string): boolean {
    const dbDir = `D:\\EasyChat\\fileStorage\\${userId}`
    const dbPath = join(dbDir, 'easychat.db')
    return existsSync(dbPath)
  }

  /**
   * 为指定用户创建数据库及表结构
   */
  public createDatabase(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const dbDir = `D:\\EasyChat\\fileStorage\\${userId}`
        if (!existsSync(dbDir)) {
          mkdirSync(dbDir, { recursive: true })
        }
        const dbPath = join(dbDir, 'easychat.db')

        // 打开数据库
        const db = new sqlite3.Database(dbPath, (err) => {
          if (err) {
            console.error('打开数据库失败:', err)
            reject(err)
            return
          }

          // 创建所有表
          this.createTables(db)
            .then(() => {
              db.close((closeErr) => {
                if (closeErr) {
                  console.error('关闭数据库失败:', closeErr)
                  reject(closeErr)
                } else {
                  console.log(`数据库已创建: ${dbPath}`)
                  resolve()
                }
              })
            })
            .catch((error) => {
              console.error('创建表失败:', error)
              reject(error)
            })
        })
      } catch (error) {
        console.error('创建数据库失败:', error)
        reject(error)
      }
    })
  }

  /**
   * 检查并创建所有必需的表
   */
  public async initializeTables(): Promise<void> {
    try {
      const dbDir = `D:\\EasyChat\\fileStorage\\${this.currentUserId}`
      const dbPath = join(dbDir, 'easychat.db')

      const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      })

      // 检查并创建所有表（使用IF NOT EXISTS确保安全）
      await this.createTables(db)

      await db.close()
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
        senderName TEXT,
        senderAvatar TEXT,
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
        downloadUrl TEXT,
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
        contactId TEXT,
        groupId TEXT,  
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

  // ChatSession 表相关操作
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

      // 查询刚刚插入的数据
      const result = await db.get(`SELECT * FROM ChatSession WHERE id = ?`, [sessionData.id])

      await db.close()

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

      // 获取ChatSession表数据和对应的ChatSessionUser表数据并合并返回
      const sessions = await db.all(
        `
        SELECT 
          cs.id,
          cs.sessionType,
          cs.name,
          cs.avatar,
          cs.ownerId,
          cs.groupId,
          cs.createdAt,
          cs.updatedAt,
          cs.isDeleted,
          cs.deletedAt,
          csu.id as userSessionId,
          csu.userId,
          csu.contactId,
          csu.joinTime,
          csu.lastReadTime,
          csu.isMuted,
          csu.isPinned,
          csu.customRemark,
          csu.unreadCount,
          csu.sessionType as userSessionType,
          csu.identity,
          csu.nickname,
          csu.remark,
          csu.showMemberNameCard,
          csu.background,
          csu.displayName,
          csu.displayAvatar,
          um.content as lastMessageContent,
          um.messageType as lastMessageType,
          um.fileName as lastMessageFileName,
          um.senderName as lastMessageSenderName,
          um.senderId as lastMessageSenderId,
          um.isRecalled as lastMessageIsRecalled,
          um.isDeleted as lastMessageIsDeleted,
          um.createdAt as lastMessageCreatedAt
        FROM ChatSession cs
        INNER JOIN ChatSessionUser csu ON cs.id = csu.sessionId
        LEFT JOIN UnifiedMessage um ON cs.id = um.sessionId 
          AND um.createdAt = (
            SELECT MAX(createdAt) 
            FROM UnifiedMessage 
            WHERE sessionId = cs.id
          )
        WHERE csu.userId = ?
        ORDER BY cs.updatedAt DESC
      `,
        [this.currentUserId]
      )

      await db.close()

      // 合并两个表的数据
      return sessions.map((session) => {
        const {
          lastMessageContent,
          lastMessageType,
          lastMessageFileName,
          lastMessageSenderName,
          lastMessageSenderId,
          lastMessageIsRecalled,
          lastMessageIsDeleted,
          lastMessageCreatedAt,
          // 从ChatSessionUser中提取的字段
          userSessionId,
          userId,
          contactId,
          joinTime,
          lastReadTime,
          isMuted,
          isPinned,
          customRemark,
          unreadCount,
          userSessionType,
          identity,
          nickname,
          remark,
          showMemberNameCard,
          background,
          displayName,
          displayAvatar,
          ...chatSessionData
        } = session

        return {
          ...chatSessionData,
          // ChatSessionUser 表的字段（用户特定的会话设置）
          userSessionId,
          userId,
          contactId,
          joinTime,
          lastReadTime,
          isMuted: !!isMuted, // 转换为布尔值
          isPinned: !!isPinned, // 转换为布尔值
          customRemark,
          unreadCount: unreadCount || 0,
          userSessionType,
          identity,
          nickname,
          remark,
          showMemberNameCard: !!showMemberNameCard, // 转换为布尔值
          background,
          displayName,
          displayAvatar,
          // 最后消息信息
          lastMessage:
            lastMessageContent || lastMessageType
              ? {
                  content: lastMessageContent,
                  messageType: lastMessageType,
                  fileName: lastMessageFileName,
                  senderName: lastMessageSenderName,
                  senderId: lastMessageSenderId,
                  isRecalled: !!lastMessageIsRecalled,
                  isDeleted: !!lastMessageIsDeleted,
                  createdAt: lastMessageCreatedAt
                }
              : null
        }
      })
    } catch (error) {
      console.error('根据用户ID查询ChatSession失败:', error)
      throw error
    }
  }

  /**
   * 根据ID获取ChatSession数据
   */
  public async getChatSessionById(id: string): Promise<any> {
    try {
      // 确保表存在
      await this.initializeTables()

      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      // 在ChatSessionUser表中通过contactId或groupId查找匹配的记录
      const sessionUser = await db.get(
        `SELECT * FROM ChatSessionUser WHERE contactId = ? OR groupId = ?`,
        [id, id]
      )

      let session: any = null
      if (sessionUser) {
        // 如果在ChatSessionUser表中找到了匹配的记录，使用其sessionId查询ChatSession表
        session = await db.get(`SELECT * FROM ChatSession WHERE id = ?`, [sessionUser.sessionId])
      }

      await db.close()

      return session
    } catch (error) {
      console.error('查询ChatSession失败:', error)
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
      (id, sessionType, name, avatar, ownerId, groupId, createdAt, updatedAt, isDeleted, deletedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

      // 首先删除与该会话相关的所有消息及其关联的文件和视频
      await this.deleteUnifiedMessagesBySessionId(sessionId)

      // 删除与该会话相关的ChatSessionUser记录
      await db.run(`DELETE FROM ChatSessionUser WHERE sessionId = ?`, [sessionId])

      // 删除ChatSession记录本身
      await db.run(`DELETE FROM ChatSession WHERE id = ?`, [sessionId])

      await db.close()
    } catch (error) {
      console.error('Delete ChatSession failed:', error)
      throw error
    }
  }

  public async syncChatSessions(sessions: any[]): Promise<void> {
    try {
      for (const session of sessions) {
        await this.upsertChatSession(session)
      }
    } catch (error) {
      console.error('Sync ChatSessions failed:', error)
      throw error
    }
  }

  // ChatSessionUser 表相关操作
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
         background, displayName, displayAvatar, contactId, groupId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          userData.contactId || null,
          userData.groupId || null,
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

      // 将updatedAt值添加到values数组的末尾
      values.push(new Date().toISOString(), id)

      await db.run(
        `
        UPDATE ChatSessionUser 
        SET ${fields.join(', ')}, updatedAt = ?
        WHERE id = ?
        `,
        values
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
  public async getChatSessionUser(sessionId: string): Promise<any> {
    try {
      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      const result = await db.get(
        `SELECT * FROM ChatSessionUser WHERE sessionId = ? AND userId = ?`,
        [sessionId, this.currentUserId]
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
   * 同步ChatSessionUser数据到本地数据库
   */
  public async syncChatSessionUsers(users: any[]): Promise<void> {
    try {
      for (const user of users) {
        await this.upsertChatSessionUser(user)
      }
    } catch (error) {
      console.error('Sync ChatSessionUsers failed:', error)
      throw error
    }
  }

  /**
   * 更新用户的未读消息计数
   */
  public async updateUnreadCount(sessionId: string, unreadCount: number): Promise<void> {
    try {
      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      await db.run(
        `UPDATE ChatSessionUser SET unreadCount = ?, updatedAt = ? WHERE sessionId = ? AND userId = ?`,
        [unreadCount, new Date().toISOString(), sessionId, this.currentUserId]
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
  public async incrementUnreadCount(sessionId: string): Promise<void> {
    try {
      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      await db.run(
        `UPDATE ChatSessionUser SET unreadCount = unreadCount + 1, updatedAt = ? WHERE sessionId = ? AND userId = ?`,
        [new Date().toISOString(), sessionId, this.currentUserId]
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
  public async resetUnreadCount(sessionId: string): Promise<void> {
    try {
      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      await db.run(
        `UPDATE ChatSessionUser SET unreadCount = 0, lastReadTime = ?, updatedAt = ? WHERE sessionId = ? AND userId = ?`,
        [new Date().toISOString(), new Date().toISOString(), sessionId, this.currentUserId]
      )

      await db.close()
    } catch (error) {
      console.error('Reset unread count failed:', error)
      throw error
    }
  }

  // UnifiedMessage 表相关操作
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

      // 检查消息ID是否已存在
      const existingMessage = await db.get(`SELECT id FROM UnifiedMessage WHERE id = ?`, [
        messageData.id
      ])
      if (existingMessage) {
        // 如果消息已存在，则更新它而不是插入
        await db.run(
          `UPDATE UnifiedMessage 
           SET sessionId = ?, senderId = ?, receiverId = ?, groupId = ?, content = ?, 
               messageType = ?, mediaUrl = ?, fileName = ?, fileSize = ?, 
               isRecalled = ?, isDeleted = ?, status = ?, readStatus = ?, 
               updatedAt = ?, recalledAt = ?, deletedAt = ?, senderName = ?, senderAvatar = ?
           WHERE id = ?`,
          [
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
            messageData.updatedAt || new Date().toISOString(),
            messageData.recalledAt || null,
            messageData.deletedAt || null,
            messageData.senderName || null,
            messageData.senderAvatar || null,
            messageData.id
          ]
        )

        // 查询更新后的数据
        const updatedMessage = await db.get(
          `SELECT m.*, 
                  f.thumbnailUrl as file_thumbnailUrl,
                  f.fileExtension as file_extension,
                  f.mimeType as mime_type,
                  f.name as file_name,
                  f.size as file_size
           FROM UnifiedMessage m
           LEFT JOIN File f ON m.id = f.unifiedMessageId
           WHERE m.id = ?`,
          [messageData.id]
        )

        await db.close()

        console.log('消息已更新到本地数据库:', updatedMessage)
        return updatedMessage
      }

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
           (id, name, url, thumbnailUrl, size, mimeType, fileExtension, fileType, uploaderId, unifiedMessageId, createdAt, expireAt, sessionId)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            messageData.fileId || generateUUID(),
            messageData.fileName,
            messageData.mediaUrl,
            messageData.thumbnailUrl || null,
            messageData.fileSize,
            messageData.mimeType || '',
            messageData.fileExtension || getFileExtension(messageData.fileName),
            messageData.fileType || getFileType(messageData.fileName),
            messageData.senderId,
            messageData.id, // 关联到消息ID
            messageData.createdAt || new Date().toISOString(),
            messageData.expireAt || null,
            messageData.sessionId
          ]
        )

        // 如果是视频消息，还需要创建视频记录
        if (messageData.messageType === 'video' && messageData.videoInfo) {
          await db.run(
            `INSERT INTO Video 
             (id, fileId, duration, width, height, bitrate, codec, fps, thumbnailUrl, previewUrl, downloadUrl, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              generateUUID(),
              (fileRecord as any).lastID, // 使用刚创建的文件ID
              messageData.videoInfo.duration || null,
              messageData.videoInfo.width || null,
              messageData.videoInfo.height || null,
              messageData.videoInfo.bitrate || null,
              messageData.videoInfo.codec || null,
              messageData.videoInfo.fps || null,
              messageData.videoInfo.thumbnailUrl || null,
              messageData.videoInfo.previewUrl || null,
              messageData.videoInfo.downloadUrl || null, // 从videoInfo中获取downloadUrl
              new Date().toISOString(),
              new Date().toISOString()
            ]
          )
        }
      }

      // 插入消息记录
      await db.run(
        `INSERT INTO UnifiedMessage 
         (id, sessionId, senderId, receiverId, groupId, content, messageType, mediaUrl, fileName, fileSize, senderName, senderAvatar,
          isRecalled, isDeleted, status, readStatus, createdAt, updatedAt, recalledAt, deletedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          messageData.id || generateUUID(),
          messageData.sessionId,
          messageData.senderId,
          messageData.receiverId || null,
          messageData.groupId || null,
          messageData.content || '',
          messageData.messageType,
          messageData.mediaUrl || null,
          messageData.fileName || null,
          messageData.fileSize || null,
          messageData.senderName || null,
          messageData.senderAvatar || null,
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

      // 查询刚刚插入的数据 - 使用我们生成的ID进行查询
      const messageToInsertId = messageData.id || generateUUID()
      const insertedMessage = await db.get(
        `SELECT m.*, 
                f.thumbnailUrl as file_thumbnailUrl,
                f.fileExtension as file_extension,
                f.mimeType as mime_type,
                f.name as file_name,
                f.size as file_size
         FROM UnifiedMessage m
         LEFT JOIN File f ON m.id = f.unifiedMessageId
         WHERE m.id = ?`,
        [messageToInsertId]
      )

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
      // 增强查询，包含更多相关信息
      const messages = await db.all(
        `SELECT m.*, 
                f.thumbnailUrl as file_thumbnailUrl,
                f.fileExtension as file_extension,
                f.mimeType as mime_type,
                f.name as file_name,
                f.size as file_size,
                v.duration as video_duration,
                v.width as video_width,
                v.height as video_height,
                v.bitrate as video_bitrate,
                v.codec as video_codec,
                v.fps as video_fps,
                v.thumbnailUrl as video_thumbnailUrl
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
        // 处理基础文件信息
        if (message.file_thumbnailUrl || message.file_extension || message.mime_type) {
          const processedMessage = {
            ...message,
            thumbnailUrl: message.file_thumbnailUrl || message.video_thumbnailUrl, // 优先使用视频缩略图
            fileExtension: message.file_extension,
            mimeType: message.mime_type,
            fileName: message.file_name,
            fileSize: message.file_size,
            senderAvatar: message.senderAvatar,
            senderName: message.senderName
          }

          // 如果文件有关联的视频信息，也包含视频的宽度和高度
          if (message.video_duration || message.video_width || message.video_height) {
            processedMessage.videoInfo = {
              duration: message.video_duration,
              width: message.video_width,
              height: message.video_height,
              bitrate: message.video_bitrate,
              codec: message.video_codec,
              fps: message.video_fps,
              thumbnailUrl: message.video_thumbnailUrl // 包含视频缩略图
            }
          }

          return processedMessage
        }

        // 即使没有文件信息，也要确保发送者信息被包含
        return {
          ...message,
          senderAvatar: message.senderAvatar,
          senderName: message.senderName
        }
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

      // 先查找要删除的消息记录
      const message = await db.get(`SELECT id FROM UnifiedMessage WHERE id = ?`, [id])
      if (message) {
        // 查找关联的文件记录
        const file = await db.get(`SELECT id FROM File WHERE unifiedMessageId = ?`, [id])
        if (file) {
          const fileId = file.id
          // 删除关联的视频记录
          await db.run(`DELETE FROM Video WHERE fileId = ?`, [fileId])

          // 删除文件记录
          await db.run(`DELETE FROM File WHERE id = ?`, [fileId])
        }

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
   * 根据会话ID删除所有相关的UnifiedMessage记录
   * @param sessionId 会话ID
   */
  public async deleteUnifiedMessagesBySessionId(sessionId: string): Promise<void> {
    try {
      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      // 查找该会话下的所有消息记录
      const messages = await db.all(`SELECT id FROM UnifiedMessage WHERE sessionId = ?`, [
        sessionId
      ])

      // 删除每条消息及其关联的文件和视频记录
      for (const message of messages) {
        const messageId = message.id

        // 查找关联的文件记录
        const file = await db.get(`SELECT id FROM File WHERE unifiedMessageId = ?`, [messageId])
        if (file) {
          const fileId = file.id
          // 删除关联的视频记录
          await db.run(`DELETE FROM Video WHERE fileId = ?`, [fileId])

          // 删除文件记录
          await db.run(`DELETE FROM File WHERE id = ?`, [fileId])
        }

        // 删除消息记录
        await db.run(`DELETE FROM UnifiedMessage WHERE id = ?`, [messageId])
      }

      await db.close()
    } catch (error) {
      console.error('Delete UnifiedMessages by sessionId failed:', error)
      throw error
    }
  }

  /**
   * 同步UnifiedMessage数据到本地数据库
   */
  public async syncUnifiedMessages(messages: any[]): Promise<void> {
    try {
      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      for (const message of messages) {
        // 检查消息是否已存在
        const existing = await db.get(`SELECT id FROM UnifiedMessage WHERE id = ?`, [message.id])

        if (!existing) {
          // 插入消息
          await db.run(
            `INSERT INTO UnifiedMessage 
            (id, sessionId, senderId, receiverId, groupId, content, messageType, mediaUrl, fileName, fileSize, senderName, senderAvatar,
             isRecalled, isDeleted, status, readStatus, createdAt, updatedAt, recalledAt, deletedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              message.id,
              message.sessionId,
              message.senderId,
              message.receiverId || null,
              message.groupId || null,
              message.content || '',
              message.messageType,
              message.mediaUrl || null,
              message.fileName || null,
              message.fileSize || null,
              message.sender && message.sender.username ? message.sender.username : null,
              message.sender && message.sender.avatar ? message.sender.avatar : null,
              message.isRecalled ? 1 : 0,
              message.isDeleted ? 1 : 0,
              message.status || 'SENT',
              message.readStatus ? 1 : 0,
              message.createdAt || new Date().toISOString(),
              message.updatedAt || new Date().toISOString(),
              message.recalledAt || null,
              message.deletedAt || null
            ]
          )

          // 如果消息有关联文件，也插入文件记录
          if (message.file) {
            const file = message.file
            await db.run(
              `INSERT OR IGNORE INTO File 
              (id, name, url, thumbnailUrl, size, mimeType, fileExtension, fileType, uploaderId, unifiedMessageId, createdAt, expireAt, sessionId)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                file.id,
                file.name,
                file.url,
                file.thumbnailUrl || null,
                file.size,
                file.mimeType || '',
                file.fileExtension || null,
                file.fileType || 'document',
                file.uploaderId,
                message.id, // 关联到消息ID
                file.createdAt || new Date().toISOString(),
                file.expireAt || null,
                file.sessionId || null
              ]
            )

            // 如果文件有关联视频信息，也插入视频记录
            if (file.video) {
              const video = file.video
              await db.run(
                `INSERT OR IGNORE INTO Video 
                (id, fileId, duration, width, height, bitrate, codec, fps, thumbnailUrl, previewUrl, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  video.id,
                  file.id, // 关联到文件ID
                  video.duration || null,
                  video.width || null,
                  video.height || null,
                  video.bitrate || null,
                  video.codec || null,
                  video.fps || null,
                  video.thumbnailUrl || null,
                  video.previewUrl || null,
                  video.createdAt || new Date().toISOString(),
                  video.updatedAt || new Date().toISOString()
                ]
              )
            }
          }
        }
      }

      await db.close()
    } catch (error) {
      console.error('Sync UnifiedMessages failed:', error)
      throw error
    }
  }
  // File 表相关操作
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
   * 获取数据库路径
   */
  public getDbPath(): string {
    return this.dbPath
  }

  /**
   * 根据用户ID数组获取用户信息
   */
  public async getUsersByIds(userIds: string[]): Promise<any[]> {
    try {
      if (!userIds || userIds.length === 0) {
        return []
      }

      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      // 创建占位符
      const placeholders = userIds.map(() => '?').join(',')
      const query = `SELECT * FROM ChatSessionUser WHERE userId IN (${placeholders})`

      const users = await db.all(query, userIds)

      await db.close()

      // 处理布尔值
      return users.map((user) => ({
        ...user,
        isMuted: !!user.isMuted,
        isPinned: !!user.isPinned,
        showMemberNameCard: !!user.showMemberNameCard
      }))
    } catch (error) {
      console.error('Get users by IDs failed:', error)
      throw error
    }
  }
}

export const databaseManager = new DatabaseManager()
