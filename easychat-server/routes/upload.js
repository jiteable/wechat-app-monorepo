var express = require('express');
var router = express.Router();
const multer = require('multer');
const path = require('path');
const { ossClient } = require('../utils/oss');
const { db } = require('../db/db');
const { authenticateToken } = require('../middleware');

// 配置 multer 内存存储引擎，这样文件会被保存在内存中而不是磁盘上
const storage = multer.memoryStorage();

// 头像文件过滤器
const avatarFileFilter = (req, file, cb) => {
  // 只允许图片文件
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件!'), false);
  }
};

// 通用文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许所有类型的文件
  cb(null, true);
};

// 创建 multer 实例
const avatarUpload = multer({
  storage: storage,
  fileFilter: avatarFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制文件大小为5MB
  }
});

const fileUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 1024 // 限制文件大小为1G
  }
});

// 上传头像接口
router.post('/avatar', authenticateToken, avatarUpload.single('avatar'), async function (req, res, next) {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '没有上传文件'
      });
    }

    // 生成唯一的文件名
    const fileName = `avatar/chatImage/${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;

    // 使用 OSS 客户端上传文件
    if (ossClient) {
      // 上传到 OSS
      const result = await ossClient.put(fileName, req.file.buffer);

      // 替换URL前缀为指定的域名
      const customUrl = `https://file-dev.document-ai.top/${fileName}`;

      // 返回自定义前缀的文件路径
      res.json({
        success: true,
        avatarUrl: customUrl,
        message: '头像上传成功'
      });
    } else {
      // 如果 OSS 不可用，则返回错误
      return res.status(500).json({
        success: false,
        error: 'OSS 客户端未配置'
      });
    }
  } catch (error) {
    console.error('头像上传失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 上传文件接口
router.post('/file', authenticateToken, fileUpload.single('file'), async function (req, res, next) {
  try {
    const userId = req.user.id;
    const {fileName, fileType, sessionId } = req.body; // 从请求体中获取文件类型和会话ID

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '没有上传文件'
      });
    }

    // 检查 sessionId 是否存在
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: '缺少会话ID'
      });
    }

    console.log('req.file.original: ', fileName)

    // 确定文件目录
    let fileDirectory = 'Chatfiles';
    if (fileType) {
      fileDirectory = fileType === 'video' ? 'videos' : 'files';
    }

    const filename = `/EasyChat/${fileDirectory}/${sessionId}/${fileName}`;

    // 使用 OSS 客户端上传文件
    if (ossClient) {
      // 上传到 OSS
      const result = await ossClient.put(filename, req.file.buffer);

      // 替换URL前缀为指定的域名
      const customUrl = `https://file-dev.document-ai.top/${filename}`;

      // 返回自定义前缀的文件路径和其他文件信息
      // 解码文件名用于显示
      res.json({
        success: true,
        mediaUrl: customUrl,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        message: '文件上传成功'
      });
    } else {
      // 如果 OSS 不可用，则返回错误
      return res.status(500).json({
        success: false,
        error: 'OSS 客户端未配置'
      });
    }
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.post('/image', authenticateToken, avatarUpload.single('image'), async function (req, res, next) {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '没有上传文件'
      });
    }

    // 生成唯一的文件名
    const fileName = `EasyChat/images/chatImage/${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;

    // 使用 OSS 客户端上传文件
    if (ossClient) {
      // 上传到 OSS
      const result = await ossClient.put(fileName, req.file.buffer);

      // 替换URL前缀为指定的域名
      const customUrl = `https://file-dev.document-ai.top/${fileName}`;

      // 返回自定义前缀的文件路径
      res.json({
        success: true,
        imageUrl: customUrl,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        message: '图片上传成功'
      });
    } else {
      // 如果 OSS 不可用，则返回错误
      return res.status(500).json({
        success: false,
        error: 'OSS 客户端未配置'
      });
    }
  } catch (error) {
    console.error('图片上传失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

module.exports = router;