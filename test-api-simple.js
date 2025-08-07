import http from 'http';

const testAPI = (hostname, port, path, description) => {
  const options = {
    hostname: hostname,
    port: port,
    path: path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`\n${description}`);
    console.log(`状态码: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('✅ API响应:', response);
      } catch (e) {
        console.log('❌ 解析响应失败:', e.message);
        console.log('原始响应:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ ${description} - 请求错误: ${e.message}`);
  });

  req.end();
};

console.log('🧪 测试API连接...\n');

// 测试健康检查API
testAPI('localhost', 5000, '/api/health', '测试健康检查API:');

setTimeout(() => {
  // 测试登录API（GET请求，仅测试连接）
  testAPI('localhost', 5000, '/api/auth/login', '测试登录API连接:');
}, 1000); 