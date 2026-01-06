var express = require('express');
var router = express.Router();
const multer = require('multer');
const path = require('path');
const { ossClient } = require('../utils/oss');
const { db } = require('../db/db');
const { authenticateToken } = require('../middleware');
const ffmpeg = require('fluent-ffmpeg');

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

// 配置文件过滤器
const videoFileFilter = (req, file, cb) => {
  // 允许视频文件类型
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(null, false);
    // cb(new Error('只允许上传视频文件!'), false);
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

const videoUpload = multer({
  storage: storage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 1024 // 100MB
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
      const result = await ossClient.put(fileName, req.file.buffer, {
        timeout: 120000 // 为头像上传设置2分钟超时
      });

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
    const { fileName, fileType, sessionId } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '没有上传文件'
      });
    }

    // 确定文件目录
    let fileDirectory = 'Chatfiles';
    if (fileType) {
      fileDirectory = fileType === 'video' ? 'videos' : 'files';
    }

    const filename = `/EasyChat/${fileDirectory}/${sessionId}/${fileName}`;

    // 使用 OSS 客户端上传文件
    if (ossClient) {
      const result = await ossClient.put(filename, req.file.buffer, {
        timeout: 120000 // 为文件上传设置2分钟超时
      });

      // 替换URL前缀为指定的域名
      const customUrl = `https://file-dev.document-ai.top/${filename}`;

      // 返回自定义前缀的文件路径和其他文件信息
      const fileExtension = path.extname(fileName).toLowerCase();

      // 解码文件名用于显示
      res.json({
        success: true,
        mediaUrl: customUrl,
        originalName: fileName,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        fileExtension: fileExtension, // 确保返回文件扩展名
        message: '文件上传成功'
      });
    } else {
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
      const result = await ossClient.put(fileName, req.file.buffer, {
        timeout: 120000 // 为图片上传设置2分钟超时
      });

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

router.post('/video', authenticateToken, videoUpload.single('video'), async function (req, res) {
  let tempFilePath = null;

  try {
    const userId = req.user.id;
    const { fileName, sessionId } = req.body;
    console.log('req.file: ', req.file);

    console.log('fileName: ', fileName)

    // 检查是否有文件上传
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '没有上传文件'
      });
    }

    // 生成唯一的文件名
    const fileExt = path.extname(fileName || req.file.originalname);
    const baseName = fileName ? path.parse(fileName).name : `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const uniqueFileName = `EasyChat/videos/${sessionId}/${baseName}${fileExt}`;

    // 上传原始视频文件到 OSS
    if (ossClient) {
      // 直接从 buffer 上传，不使用临时文件
      const result = await ossClient.put(uniqueFileName, req.file.buffer, {
        timeout: 300000 // 为视频上传设置5分钟超时
      });

      // 视频文件的公共URL
      const videoUrl = `https://file-dev.document-ai.top/${uniqueFileName}`;

      // 生成下载URL（使用OSS参数强制下载）
      const downloadUrl = `https://file-dev.document-ai.top/${uniqueFileName}?response-content-disposition=attachment`;

      // 初始化视频信息对象
      const videoInfo = {
        duration: null,
        width: null,
        height: null,
        bitrate: null,
        codec: null,
        fps: null,
        thumbnailUrl: null,
        downloadUrl: downloadUrl
      };

      try {
        // 创建一个临时文件用于FFmpeg处理
        const tempDir = path.join(__dirname, '../temp');
        tempFilePath = path.join(tempDir, `${baseName}${fileExt}`);

        // 确保临时目录存在
        const fs = require('fs');
        if (!fs.existsSync(tempDir)) {
          const mkdirp = require('mkdirp');
          await mkdirp.sync(tempDir);
        }

        // 将buffer写入临时文件
        fs.writeFileSync(tempFilePath, req.file.buffer);

        // 使用Promise包装ffmpeg以支持async/await
        await new Promise((resolve, reject) => {
          ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
            if (err) {
              console.error('FFmpeg ffprobe error:', err);
              // 即使获取元数据失败，也不中断主要的上传流程
              resolve();
              return;
            }

            const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
            if (videoStream) {
              videoInfo.duration = metadata.format.duration;
              videoInfo.width = videoStream.width;
              videoInfo.height = videoStream.height;
              videoInfo.bitrate = parseInt(metadata.format.bit_rate) || null;
              videoInfo.codec = videoStream.codec_name;
              // 安全地计算帧率
              if (videoStream.avg_frame_rate) {
                const parts = videoStream.avg_frame_rate.split('/');
                if (parts.length === 2) {
                  videoInfo.fps = parseFloat((parseInt(parts[0]) / parseInt(parts[1])).toFixed(2));
                }
              }
            }
            console.log('video: ', videoInfo)
            resolve();
          });
        });

        // 生成缩略图
        const thumbFileName = `EasyChat/videos/${sessionId}/thumbnails/${baseName}.jpg`;
        const thumbPath = path.join(tempDir, 'thumbnail.jpg');

        await new Promise((resolve, reject) => {
          ffmpeg(tempFilePath)
            .screenshots({
              count: 1,
              folder: tempDir,
              filename: 'thumbnail.jpg',
              size: '320x240'
            })
            .on('end', async () => {
              try {
                // 检查缩略图是否生成成功
                if (fs.existsSync(thumbPath)) {
                  // 读取生成的缩略图
                  const thumbnailBuffer = fs.readFileSync(thumbPath);

                  // 上传缩略图到OSS
                  await ossClient.put(thumbFileName, thumbnailBuffer, {
                    timeout: 60 * 1000 // 为缩略图上传设置1分钟超时
                  });
                  videoInfo.thumbnailUrl = `https://file-dev.document-ai.top/${thumbFileName}`;

                  // 清理临时缩略图文件
                  fs.unlinkSync(thumbPath);
                }
                resolve();
              } catch (uploadErr) {
                console.error('缩略图上传错误:', uploadErr);
                // 即使缩略图上传失败，也不中断主要的上传流程
                resolve();
              }
            })
            .on('error', (err) => {
              console.error('生成缩略图错误:', err);
              // 即使生成缩略图失败，也不中断主要的上传流程
              resolve();
            });
        });
      } catch (processErr) {
        console.error('处理视频元数据时出错:', processErr);
        // 即使处理元数据失败，也不中断主要的上传流程
      } finally {
        // 清理临时文件
        if (tempFilePath) {
          try {
            const fs = require('fs');
            if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
            }
          } catch (cleanupErr) {
            console.error('清理临时文件时出错:', cleanupErr);
          }
        }
      }

      // 将视频信息保存到数据库
      const fileExtension = fileExt.toLowerCase();
      
      // 返回结果
      res.json({
        success: true,
        mediaUrl: videoUrl,
        originalName: fileName || req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        fileExtension: fileExtension,
        videoInfo: videoInfo,
        message: '视频上传成功'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'OSS 客户端未配置'
      });
    }

  } catch (err) {
    console.error('视频上传错误:', err);

    // 清理临时文件（如果有的话）
    if (tempFilePath) {
      try {
        const fs = require('fs');
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (cleanupErr) {
        console.error('清理临时文件时出错:', cleanupErr);
      }
    }

    res.status(500).json({
      success: false,
      error: '视频上传失败: ' + err.message
    });
  }
});

module.exports = router;