const http = require('http');
const fs = require('fs');
const path = require('path');

function sendRedirect(res, targetUrl) {
  res.writeHead(302, {
    Location: targetUrl,
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    'Surrogate-Control': 'no-store'
  });
  res.end();
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // Pretty URL rewrites
  // /community -> /index.html?mode=community
  // /community/:id -> /index.html?mode=community&communityId=:id
  if (url.pathname === '/community' || url.pathname.startsWith('/community/')) {
    const parts = url.pathname.split('/').filter(Boolean); // [ 'community', ':id' ]
    const id = parts[1] ? decodeURIComponent(parts[1]) : null;
    const params = new URLSearchParams(url.search);
    params.set('mode', 'community');
    if (id) params.set('communityId', id);
    // 移除舊版強制導覽的參數，改為儀表板預設
    params.delete('goto');
    params.delete('sub');
    return sendRedirect(res, '/index.html?' + params.toString());
  }

  let filePath = '.' + url.pathname + (url.search || '');
  if (url.pathname === '/' || url.pathname === '') {
    filePath = './index.html' + (url.search || '');
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  // Strip query for filesystem read
  const cleanFilePath = filePath.split('?')[0];
  fs.readFile(cleanFilePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // SPA fallback: serve index.html for unknown paths
        fs.readFile('./index.html', (err2, indexContent) => {
          if (err2) {
            res.writeHead(404);
            res.end('File not found');
          } else {
            res.writeHead(200, {
              'Content-Type': 'text/html',
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'Surrogate-Control': 'no-store'
            });
            res.end(indexContent, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {
      // Disable caching to ensure latest files are served
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});