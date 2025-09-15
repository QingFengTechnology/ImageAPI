![ImageAPI](https://socialify.git.ci/QingFengTechnology/ImageAPI/image?custom_description=%E4%B8%80%E4%B8%AA%E7%AE%80%E5%8D%95%E7%9A%84%E5%9B%BE%E7%89%87API&custom_language=Node.js&description=1&font=KoHo&language=1&name=1&owner=1&pattern=Solid&theme=Auto)

一个简单的随机图片服务端，由 AI 编写。

## 使用

下载项目：
```bash

# clone 该项目
git clone git@github.com:QingFengTechnology/ImageAPI.git

# 进入文件夹并安装依赖
cd ImageAPI
npm install

```

将你的图片文件放入 `images` 文件夹中。支持的格式：
- JPEG/JPG
- PNG
- GIF
- BMP
- WebP

启动开发服务器：
```bash

# 开发模式（自动重启）
npm run dev

# 生产模式
npm start

```

服务器将在配置的端口启动（默认 `http://localhost:3000`）。

## 配置

程序支持通过 `config.json` 文件进行配置，包含以下选项：

```json
{
  "port": 3000,
  "proxyHeaders": ["x-forwarded-for"],
  "imagesFolder": "images",
  "logFile": "access.log"
}
```

- **port**: 服务器运行的端口号。
- **proxyHeaders**: 检测的代理头列表，此项在你的 CDN 不使用`x-forwarded-for`头时很有用。
- **imagesFolder**: 图片文件夹路径，支持相对路径。
- **logFile**: 访问日志文件路径，支持相对路径。

`config.json`若不存在将在启动时被自动创建。

## API 端点

```
GET /
```
返回一个随机选择的图片文件。

```
GET /list
```
返回所有可用图片的列表。

```
GET /health
```
返回服务器状态信息。