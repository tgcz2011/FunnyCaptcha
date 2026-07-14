import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// 读取 embed 包的 IIFE bundle
function getEmbedScript(): string {
  try {
    // 从 @funnycaptcha/embed 的 dist 读取 IIFE bundle
    const embedPkgPath = require.resolve('@funnycaptcha/embed/package.json');
    const embedDir = dirname(embedPkgPath);
    return readFileSync(resolve(embedDir, 'dist/embed.global.js'), 'utf-8');
  } catch {
    return '';
  }
}

// 生成 demo HTML 页面
function getDemoHTML(): string {
  const embedScript = getEmbedScript();
  return `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>FunnyChapter — 有趣的验证码合集</title>
  <style>
    :root {
      --bg: #0b1020; --bg-soft: #111733; --bg-card: #131a36;
      --border: #1f2a4d; --text: #e5e9f0; --text-soft: #94a3b8;
      --accent: #818cf8; --accent-soft: #1a2150; --success: #4ade80; --danger: #f87171;
      --radius: 12px;
    }
    [data-theme='light'] {
      --bg: #ffffff; --bg-soft: #f6f7f9; --bg-card: #ffffff;
      --border: #e5e7eb; --text: #0f172a; --text-soft: #64748b;
      --accent: #6366f1; --accent-soft: #eef2ff; --success: #16a34a; --danger: #dc2626;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 0; background: var(--bg); color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Segoe UI', Roboto, sans-serif;
    }
    .container { max-width: 1000px; margin: 0 auto; padding: 0 24px; }
    .header {
      position: sticky; top: 0; z-index: 10;
      background: color-mix(in srgb, var(--bg) 90%, transparent);
      backdrop-filter: blur(8px); border-bottom: 1px solid var(--border);
    }
    .header-inner { display: flex; align-items: center; justify-content: space-between; height: 60px; }
    .brand { font-weight: 700; font-size: 18px; }
    .brand-dot { color: var(--accent); }
    .hero { padding: 48px 0 32px; text-align: center; }
    .hero h1 { font-size: 32px; margin: 0 0 8px; font-weight: 800; }
    .hero p { margin: 0 auto; max-width: 560px; color: var(--text-soft); font-size: 15px; line-height: 1.6; }
    .tagline {
      display: inline-block; margin-top: 10px; padding: 5px 12px;
      background: var(--accent-soft); color: var(--accent);
      border-radius: 999px; font-size: 12px; font-weight: 500;
    }
    .section-title { font-size: 18px; font-weight: 700; margin: 32px 0 14px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 16px; }
    .card {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 18px; display: flex; flex-direction: column; gap: 8px;
    }
    .card-title { font-size: 15px; font-weight: 700; margin: 0; }
    .card-desc { font-size: 12px; color: var(--text-soft); line-height: 1.4; }
    .fc-demo { min-height: 120px; padding: 12px; border: 1px dashed var(--border); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .footer { margin-top: 48px; padding: 20px 0; border-top: 1px solid var(--border); color: var(--text-soft); font-size: 12px; text-align: center; }
    .toggle { cursor: pointer; padding: 4px 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-card); color: var(--text); font-size: 12px; }
    .toggle:hover { border-color: var(--accent); }
  </style>
</head>
<body data-theme="dark">
  <div class="header">
    <div class="container header-inner">
      <span class="brand">Funny<span class="brand-dot">Chapter</span></span>
      <div style="display:flex;gap:8px;">
        <button class="toggle" id="lang-toggle">中/EN</button>
        <button class="toggle" id="theme-toggle">☾/☀</button>
      </div>
    </div>
  </div>
  <div class="container">
    <div class="hero">
      <h1>FunnyChapter</h1>
      <p>有趣的验证码合集 — 10 种验证码，3 种集成方式，开箱即用</p>
      <span class="tagline">CLI Demo Mode</span>
    </div>
    <h2 class="section-title">全部验证码</h2>
    <div class="grid" id="grid"></div>
  </div>
  <footer class="footer"><div class="container">FunnyChapter · GPL-3.0 · Built by the community</div></footer>

  <!-- 内联 embed IIFE bundle -->
  <script>${embedScript}</script>
  <script>
    var types = [
      { type: 'math', zh: '算术验证码', en: 'Math Captcha', descZh: '解答简单的加减乘除题', descEn: 'Solve a simple arithmetic problem' },
      { type: 'text-distort', zh: '扭曲文字', en: 'Distorted Text', descZh: 'Canvas 扭曲字符 + 干扰线', descEn: 'Canvas distorted characters' },
      { type: 'slider', zh: '滑动拼图', en: 'Slider Puzzle', descZh: '把滑块拖到最右端', descEn: 'Drag slider to the right' },
      { type: 'click-order', zh: '点选顺序', en: 'Click in Order', descZh: '按 1→2→3→4 顺序点击', descEn: 'Click in ascending order' },
      { type: 'rotate', zh: '旋转对齐', en: 'Rotate to Align', descZh: '旋转图形使其回正', descEn: 'Rotate to align' },
      { type: 'spot-diff', zh: '找不同', en: 'Spot the Difference', descZh: '在两张图中找出不同', descEn: 'Find the differences' },
      { type: 'emoji-match', zh: '表情匹配', en: 'Emoji Match', descZh: '选出匹配的 emoji', descEn: 'Pick matching emoji' },
      { type: 'meme-quiz', zh: '梗图问答', en: 'Meme Quiz', descZh: '看梗图选梗名', descEn: 'Pick the right meme' },
      { type: 'mini-game', zh: '迷你游戏', en: 'Mini Game', descZh: '30 秒打地鼠达 10 分', descEn: 'Whack-a-mole, score 10 in 30s' },
      { type: 'anti-bot', zh: '反人类讽刺', en: 'Anti-Bot Satire', descZh: '机器人注入 JS 就能通过', descEn: 'Bots can inject JS to pass' },
      { type: 'click-text', zh: '文字点选', en: 'Click Text', descZh: '按顺序点击指定汉字', descEn: 'Click characters in order' },
      { type: 'color-pick', zh: '颜色选择', en: 'Color Pick', descZh: '点击指定颜色的方块', descEn: 'Pick the right color' },
      { type: 'puzzle', zh: '拼图缺口', en: 'Puzzle Gap', descZh: '拖动拼图到缺口位置', descEn: 'Drag puzzle to the gap' }
    ];
    var locale = 'zh';
    var theme = 'dark';

    function renderGrid() {
      var grid = document.getElementById('grid');
      grid.innerHTML = '';
      types.forEach(function(item) {
        var card = document.createElement('div');
        card.className = 'card';
        card.innerHTML =
          '<h3 class="card-title">' + (locale === 'zh' ? item.zh : item.en) + '</h3>' +
          '<p class="card-desc">' + (locale === 'zh' ? item.descZh : item.descEn) + '</p>' +
          '<div class="fc-demo" data-funny-captcha data-type="' + item.type + '" data-locale="' + locale + '" data-theme="' + theme + '"></div>';
        grid.appendChild(card);
      });
      // 重新扫描挂载
      if (window.FunnyCaptcha) {
        window.FunnyCaptcha.render();
      }
    }

    document.getElementById('lang-toggle').addEventListener('click', function() {
      locale = locale === 'zh' ? 'en' : 'zh';
      renderGrid();
    });
    document.getElementById('theme-toggle').addEventListener('click', function() {
      theme = theme === 'dark' ? 'light' : 'dark';
      document.body.setAttribute('data-theme', theme);
      renderGrid();
    });

    // 初始渲染
    renderGrid();
  </script>
</body>
</html>`;
}

// 打开浏览器
function openBrowser(url: string): void {
  const platform = process.platform;
  let cmd: string;
  if (platform === 'darwin') {
    cmd = `open "${url}"`;
  } else if (platform === 'win32') {
    cmd = `start "" "${url}"`;
  } else {
    cmd = `xdg-open "${url}"`;
  }
  exec(cmd, (err) => {
    if (err) {
      console.log(`请手动打开浏览器访问: ${url}`);
    }
  });
}

// CLI 主入口
const port = 3000;
const server = createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    const html = getDemoHTML();
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(port, () => {
  const url = `http://localhost:${port}`;
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║       FunnyChapter CLI Demo           ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  console.log(`  ➜  Demo:    ${url}`);
  console.log(`  ➜  按 Ctrl+C 退出`);
  console.log('');
  openBrowser(url);
});

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n 再见！');
  server.close();
  process.exit(0);
});
