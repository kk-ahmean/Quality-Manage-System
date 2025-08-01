import React from 'react';
import { Card, Button, Space } from 'antd';

const TestPage: React.FC = () => {
  return (
    <div>
      <h2>功能测试页面</h2>
      <Card title="测试说明">
        <p>请测试以下功能：</p>
        <Space direction="vertical">
          <p>1. 在右上角搜索框中输入"111"或其他关键词，测试全局搜索功能</p>
          <p>2. 点击右上角的铃铛图标，测试通知功能</p>
          <p>3. 验证搜索结果是否正确显示</p>
          <p>4. 验证通知内容是否正确显示</p>
        </Space>
      </Card>
    </div>
  );
};

export default TestPage; 