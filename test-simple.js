import axios from 'axios';

async function testSimple() {
  try {
    // 首先登录获取token
    const loginResponse = await axios.post('http://192.168.53.20:5001/api/auth/login', {
      username: 'admin@example.com',
      password: '123456'
    });

    const token = loginResponse.data.data.token;
    console.log('登录成功，获取到token');

    // 测试简单的项目创建，不包含productImages
    const simpleProjectData = {
      model: 'SIMPLE_TEST',
      sku: 'SIMPLE_TEST',
      categoryLevel3: '简单测试',
      description: '简单测试项目',
      level: 'L2',
      trade: '内贸',
      status: '研发设计',
      members: [
        {
          userId: '68958167046c37ca2ca31215',
          userName: '系统管理员',
          role: 'admin'
        }
      ]
    };

    console.log('发送简单项目数据:', JSON.stringify(simpleProjectData, null, 2));

    const createResponse = await axios.post('http://192.168.53.20:5001/api/projects', simpleProjectData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('简单项目创建成功:', createResponse.data);
  } catch (error) {
    console.error('测试失败:');
    console.error('错误信息:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testSimple(); 