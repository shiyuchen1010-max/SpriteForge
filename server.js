const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8888;
const ROOT_DIR = __dirname;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log('Request:', req.url);
  
  // Parse URL to get pathname without query parameters
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  let filePath = path.join(ROOT_DIR, pathname === '/' ? 'index.html' : pathname);
  
  const extname = path.extname(filePath);
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        console.log('File not found:', filePath);
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        console.error('Server error:', error);
        res.writeHead(500);
        res.end('Server Error: ' + error.code, 'utf-8');
      }
    } else {
      console.log('Serving:', filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Serving files from: ${ROOT_DIR}`);
  console.log('Files available:');
  console.log('- index.html');
  console.log('- css/main.css');
  console.log('- js/app.js');
  console.log('- js/frame-extract.js');
  console.log('- test.js');
});
