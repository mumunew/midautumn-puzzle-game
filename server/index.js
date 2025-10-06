const path = require('path');
const fs = require('fs');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// 目录配置
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const IMAGE_DIR = path.join(PUBLIC_DIR, 'assets', 'images');
const DATA_DIR = path.join(__dirname, '..', 'data');
const LOG_FILE = path.join(DATA_DIR, 'logs.txt');
const PIC_DIR = path.join(__dirname, '..', 'pic');

// 中间件
app.use(express.json());
app.use(express.static(PUBLIC_DIR));
app.use('/pic', express.static(PIC_DIR));

// 确保必要目录存在
function ensureDirs() {
  [PUBLIC_DIR, IMAGE_DIR, DATA_DIR, PIC_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, '', 'utf-8');
  }
}
ensureDirs();

// 图片列表接口
app.get('/api/images', (req, res) => {
  fs.readdir(PIC_DIR, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read images' });
    }
    const images = files
      .filter((f) => /\.(jpg|jpeg)$/i.test(f))
      .map((f) => `/pic/${f}`);
    res.json({ images });
  });
});

// 记录日志接口
app.post('/api/log', (req, res) => {
  const { loginTime, gameDurationMs, image, difficulty } = req.body || {};
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || req.ip;
  const record = {
    loginTime,
    gameDurationMs,
    image,
    difficulty,
    ip,
    ts: new Date().toISOString(),
  };
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(record) + '\n', 'utf-8');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to write log' });
  }
});

app.listen(PORT, () => {
  console.log(`Puzzle game server running at http://localhost:${PORT}`);
});