import { app } from 'electron'
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

      // 创建 User 表
      await db.exec(`
        CREATE TABLE IF NOT EXISTS User (
          id TEXT PRIMARY KEY,
          chatId TEXT UNIQUE,
          username TEXT,
          email TEXT UNIQUE,
          emailVerified DATETIME,
          avatar TEXT,
          password TEXT,
          gender TEXT,
          signature TEXT,
          region TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // 创建 Session 表
      await db.exec(`
        CREATE TABLE IF NOT EXISTS Session (
          id TEXT PRIMARY KEY,
          sessionToken TEXT UNIQUE,
          userId TEXT,
          expires DATETIME,
          FOREIGN KEY (userId) REFERENCES User(id)
        )
      `)

      // 创建 UserWithFriend 表 (好友关系表)
      await db.exec(`
        CREATE TABLE IF NOT EXISTS UserWithFriend (
          id TEXT PRIMARY KEY,
          userId TEXT,
          friendId TEXT,
          remark TEXT,
          tag TEXT,
          source TEXT,
          description TEXT,
          phone TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES User(id),
          FOREIGN KEY (friendId) REFERENCES User(id),
          UNIQUE(userId, friendId)
        )
      `)

      // 创建 UserSetting 表
      await db.exec(`
        CREATE TABLE IF NOT EXISTS UserSetting (
          id TEXT PRIMARY KEY,
          userId TEXT UNIQUE,
          newMessageSound BOOLEAN DEFAULT 1,
          needVerificationToAddFriend BOOLEAN DEFAULT 1,
          canBeSearchedByChatId BOOLEAN DEFAULT 1,
          canBeSearchedByEmail BOOLEAN DEFAULT 1,
          canAddFromGroup BOOLEAN DEFAULT 1,
          language TEXT DEFAULT 'zh',
          fontSize INTEGER DEFAULT 14,
          openFileInReadonlyMode BOOLEAN DEFAULT 0,
          showWebSearchHistory BOOLEAN DEFAULT 1,
          autoConvertVoiceToText BOOLEAN DEFAULT 1,
          StorageLocation TEXT DEFAULT 'D:\\\\EasyChat\\\\files\\\\',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES User(id)
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
          FOREIGN KEY (senderId) REFERENCES User(id),
          FOREIGN KEY (receiverId) REFERENCES User(id),
          FOREIGN KEY (groupId) REFERENCES Group(id)
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
          FOREIGN KEY (uploaderId) REFERENCES User(id),
          FOREIGN KEY (unifiedMessageId) REFERENCES UnifiedMessage(id),
          FOREIGN KEY (sessionId) REFERENCES ChatSession(id)
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

      await db.close()
      console.log('数据库及表结构已创建于:', this.dbPath)
    } catch (error) {
      console.error('创建数据库失败:', error)
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
