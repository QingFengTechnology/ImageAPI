const express = require('express')
const fs = require('fs')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000

// 图片文件夹路径
const IMAGES_FOLDER = path.join(__dirname, 'images')
// 日志文件路径
const LOG_FILE = path.join(__dirname, 'access.log')

// 确保图片文件夹存在
if (!fs.existsSync(IMAGES_FOLDER)) {
  fs.mkdirSync(IMAGES_FOLDER, { recursive: true })
  console.info(`已在 ${IMAGES_FOLDER} 创建图片文件夹。`)
  console.info('请将要随机的图片放入图片文件夹中。')
}

// 获取客户端IP地址
function getClientIp(req) {
  let ip = req.headers['x-forwarded-for'] || 
          req.connection.remoteAddress || 
          req.socket.remoteAddress ||
          (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
          'unknown'
  
  // 如果包含多个IP（通常是CDN或代理），只取第一个
  if (typeof ip === 'string' && ip.includes(',')) {
    ip = ip.split(',')[0].trim()
  }
  
  return ip
}

// 格式化时间戳
function formatTimestamp() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  
  return `${year}/${month}/${day} - ${hours}:${minutes}:${seconds}`
}

// 访问日志中间件
function accessLogger(req, res, next) {
  const startTime = Date.now()
  
  // 响应完成后记录日志
  res.on('finish', () => {
    const timestamp = formatTimestamp()
    const statusCode = res.statusCode
    const clientIp = getClientIp(req)
    const method = req.method
    const path = req.path
    const responseTime = Date.now() - startTime
    
    // 格式化IP地址（右对齐，最小宽度15字符）
    const formattedIp = clientIp.padStart(15)
    // 格式化响应时间（右对齐，最小宽度6字符）
    const formattedResponseTime = `${responseTime}ms`.padStart(6)
    
    // 格式化日志条目：时间戳 | 状态码 | 请求方法 | 响应时长(右对齐) | IP地址(右对齐) | 请求路径
    const logEntry = `${timestamp} | ${statusCode} | ${method} | ${formattedResponseTime} | ${formattedIp} | "${path}"\n`
    
    // 输出到控制台
    console.log(logEntry.trim())
    
    // 写入到日志文件
    fs.appendFile(LOG_FILE, logEntry, (err) => {
      if (err) {
        console.error('写入日志文件失败:', err)
      }
    })
  })
  
  next()
}

// 使用访问日志中间件
app.use(accessLogger)

// 获取支持的图片格式
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']

// 从文件夹中获取所有图片文件
function getImageFiles() {
  try {
    const files = fs.readdirSync(IMAGES_FOLDER)
    return files.filter(file => {
      const ext = path.extname(file).toLowerCase()
      return SUPPORTED_EXTENSIONS.includes(ext)
    })
  } catch (error) {
    console.error('读取图片文件夹时出错:', error)
    return []
  }
}

// 获取随机图片
function getRandomImage() {
  const imageFiles = getImageFiles()

  if (imageFiles.length === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * imageFiles.length)
  return imageFiles[randomIndex]
}

// 主API路由
app.get('/', (req, res) => {
  const randomImage = getRandomImage()

  if (!randomImage) {
    return res.status(404).json({
      error: '未能获取图片',
      message: '请确保图片文件夹中包含支持的图片文件。'
    })
  }

  const imagePath = path.join(IMAGES_FOLDER, randomImage)

  // 设置正确的Content-Type
  const ext = path.extname(randomImage).toLowerCase()
  let contentType = 'image/jpeg' // 默认

  switch (ext) {
    case '.png':
      contentType = 'image/png'
      break
    case '.gif':
      contentType = 'image/gif'
      break
    case '.bmp':
      contentType = 'image/bmp'
      break
    case '.webp':
      contentType = 'image/webp'
      break
  }

  res.setHeader('Content-Type', contentType)
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('X-Random-Image', randomImage)

  // 发送图片文件
  res.sendFile(imagePath)
})

// 获取图片列表的路由
app.get('/list', (req, res) => {
  const imageFiles = getImageFiles()

  res.json({
    total: imageFiles.length,
    images: imageFiles,
    folder: IMAGES_FOLDER
  })
})

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    imageCount: getImageFiles().length
  })
})

// 启动服务器
app.listen(PORT, () => {
  console.info(`服务器已启动在 http://localhost:${PORT}`)
  console.info(`图片文件夹位于 ${IMAGES_FOLDER}，当前已加载 ${getImageFiles().length} 张图片。`)
  console.info(`访问日志将保存到: ${LOG_FILE}`)

  if (getImageFiles().length === 0) {
    console.warn('警告: 图片文件夹中没有有效的图片文件。')
  }
})

module.exports = app