import React, { useState } from 'react';
import { Card, Button, Space, Select, Row, Col, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Option } = Select;

const TestPage: React.FC = () => {
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  return (
    <div>
      <h2>功能测试页面</h2>
      
      <Card title="筛选框Placeholder测试" style={{ marginBottom: 16 }}>
        <p>请测试以下筛选框的placeholder提示信息是否正常显示：</p>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Input
              placeholder="搜索用户名、姓名或邮箱"
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              className="filter-select"
              placeholder="请选择角色"
              value={roleFilter}
              onChange={setRoleFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="admin">管理员</Option>
              <Option value="product_engineer">产品工程师</Option>
              <Option value="project_engineer">项目工程师</Option>
              <Option value="developer">开发者</Option>
              <Option value="dqe">DQE</Option>
              <Option value="tester">测试员</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              className="filter-select"
              placeholder="请选择状态"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="active">启用</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              className="filter-select"
              placeholder="请选择优先级"
              value={priorityFilter}
              onChange={setPriorityFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="high">高</Option>
              <Option value="medium">中</Option>
              <Option value="low">低</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              className="filter-select"
              placeholder="请选择负责人"
              value={assigneeFilter}
              onChange={setAssigneeFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="user1">张三</Option>
              <Option value="user2">李四</Option>
              <Option value="user3">王五</Option>
            </Select>
          </Col>
        </Row>
        
        <Space>
          <Button onClick={() => {
            setRoleFilter('');
            setStatusFilter('');
            setPriorityFilter('');
            setAssigneeFilter('');
          }}>
            重置所有筛选框
          </Button>
        </Space>
      </Card>

      <Card title="测试说明">
        <p>请测试以下功能：</p>
        <Space direction="vertical">
          <p>1. 在右上角搜索框中输入"111"或其他关键词，测试全局搜索功能</p>
          <p>2. 点击右上角的铃铛图标，测试通知功能</p>
          <p>3. 验证搜索结果是否正确显示</p>
          <p>4. 验证通知内容是否正确显示</p>
          <p>5. <strong>验证上方筛选框的placeholder提示信息是否正常显示</strong></p>
          <p>6. 测试筛选框在有值和空值状态下placeholder的显示情况</p>
        </Space>
      </Card>
    </div>
  );
};

export default TestPage; 