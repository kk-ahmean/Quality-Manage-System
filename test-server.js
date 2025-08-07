const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Test server is running' }));
});

server.listen(5000, () => {
  console.log('✅ 测试服务器运行在端口 5000');
  console.log('📡 地址: http://localhost:5000');
});

server.on('error', (error) => {
  console.error('❌ 服务器错误:', error);
}); 