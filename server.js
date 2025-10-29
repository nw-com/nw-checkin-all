const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const root = __dirname;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function serveFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = err.code === 'ENOENT' ? 404 : 500;
      res.end(err.code === 'ENOENT' ? 'Not Found' : 'Server Error');
      return;
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.join(root, urlPath);

  // Directory -> fallback to index.html
  try {
    const stat = fs.existsSync(filePath) && fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
  } catch (_) {}

  // If requesting root, serve index.html
  if (urlPath === '/' || !fs.existsSync(filePath)) {
    filePath = path.join(root, 'index.html');
  }

  serveFile(filePath, res);
});

server.listen(port, () => {
  console.log(`Preview URL: http://localhost:${port}/`);
});