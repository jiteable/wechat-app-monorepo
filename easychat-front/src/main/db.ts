/* eslint-disable @typescript-eslint/no-explicit-any */
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { randomUUID } from 'crypto'

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
  }

  /**
   * 向ChatSession表中添加一条数据
   */
  public async addChatSession(): Promise<any> {
    try {
      // 确保表存在
      await this.initializeTables()

      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      // 生成随机数据
      const sessionId = randomUUID()
      const sessionType = 'private'
      const name = '测试会话'
      const avatar = 'https://example.com/avatar.jpg'

      // 插入数据
      await db.run(
        `INSERT INTO ChatSession 
         (id, sessionType, name, avatar) 
         VALUES (?, ?, ?, ?)`,
        [sessionId, sessionType, name, avatar]
      )

      console.log('成功向ChatSession表中添加了一条数据')

      // 查询刚刚插入的数据
      const result = await db.get(`SELECT * FROM ChatSession WHERE id = ?`, [sessionId])

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
  /**
   * 获取数据库路径
   */
  public getDbPath(): string {
    return this.dbPath
  }
}

export const databaseManager = new DatabaseManager()
