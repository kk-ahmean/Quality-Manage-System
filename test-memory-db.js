import axios from 'axios';

async function testMemoryDB() {
  try {
    // 首先登录获取token
    const loginResponse = await axios.post('http://192.168.53.20:5001/api/auth/login', {
      username: 'admin@example.com',
      password: '123456'
    });

    const token = loginResponse.data.data.token;
    console.log('登录成功，获取到token');

    // 测试带图片的项目创建
    const projectData = {
      model: 'MEMORY_TEST',
      sku: 'MEMORY_TEST',
      categoryLevel3: '内存测试',
      interfaceFeatures: 'USB 3.0接口',
      description: '内存数据库测试项目',
      level: 'L2',
      trade: '内贸',
      status: '研发设计',
      supplier: '内存测试供应商',
      hardwareSolution: 'ARM处理器方案',
      remarks: '这是一个内存数据库测试项目',
      productImages: [
        {
          name: 'test-image.jpg',
          url: 'https://example.com/test-image.jpg',
          size: 1000,
          type: 'image/jpeg'
        }
      ],
      members: [
        {
          userId: 'admin',
          userName: '系统管理员',
          role: 'admin'
        }
      ]
    };

    console.log('发送项目数据:', JSON.stringify(projectData, null, 2));

    const createResponse = await axios.post('http://192.168.53.20:5001/api/projects', projectData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('项目创建成功:', createResponse.data);
  } catch (error) {
    console.error('测试失败:');
    console.error('错误信息:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testMemoryDB(); 