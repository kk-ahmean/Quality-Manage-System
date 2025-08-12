import React from 'react';
import { Card, Descriptions, Tag, Button } from 'antd';
import { useAuthStore } from '../../stores/authStore';
import { hasPermission, isAdmin, canShowDeleteButton } from '../../utils/permissions';
import { Permission } from '../../types/user';

const PermissionDebug: React.FC = () => {
  const { user: currentUser } = useAuthStore();

  if (!currentUser) {
    return (
      <Card title="权限调试" style={{ margin: '16px' }}>
        <p>未登录用户</p>
      </Card>
    );
  }

  const permissions = (currentUser.permissions || []) as Permission[];
  const isUserAdmin = isAdmin(permissions);
  
  // 测试各种权限检查
  const testPermissions = {
    'user:delete': hasPermission(permissions, 'user:delete'),
    'team:delete': hasPermission(permissions, 'team:delete'),
    'project:delete': hasPermission(permissions, 'project:delete'),
    'bug:delete': hasPermission(permissions, 'bug:delete'),
    'task:delete': hasPermission(permissions, 'task:delete'),
  };

  // 测试删除按钮显示权限
  const testDeleteButtonPermissions = {
    'user': canShowDeleteButton(permissions, currentUser.id || '', 'any', 'user'),
    'team': canShowDeleteButton(permissions, currentUser.id || '', 'any', 'team'),
    'project': canShowDeleteButton(permissions, currentUser.id || '', 'any', 'project'),
    'bug': canShowDeleteButton(permissions, currentUser.id || '', 'any', 'bug'),
    'task': canShowDeleteButton(permissions, currentUser.id || '', 'any', 'task'),
  };

  return (
    <Card title="权限调试" style={{ margin: '16px' }}>
      <Descriptions title="用户信息" bordered>
        <Descriptions.Item label="用户ID">{currentUser.id}</Descriptions.Item>
        <Descriptions.Item label="用户名">{currentUser.name}</Descriptions.Item>
        <Descriptions.Item label="邮箱">{currentUser.email}</Descriptions.Item>
        <Descriptions.Item label="角色">{currentUser.role}</Descriptions.Item>
        <Descriptions.Item label="是否为管理员">
          <Tag color={isUserAdmin ? 'green' : 'red'}>
            {isUserAdmin ? '是' : '否'}
          </Tag>
        </Descriptions.Item>
      </Descriptions>

      <Descriptions title="权限列表" bordered style={{ marginTop: '16px' }}>
        <Descriptions.Item label="权限数量">{permissions.length}</Descriptions.Item>
        <Descriptions.Item label="权限列表" span={3}>
          {permissions.map(permission => (
            <Tag key={permission} color="blue" style={{ margin: '2px' }}>
              {permission}
            </Tag>
          ))}
        </Descriptions.Item>
      </Descriptions>

      <Descriptions title="删除权限检查" bordered style={{ marginTop: '16px' }}>
        {Object.entries(testPermissions).map(([permission, hasPerm]) => (
          <Descriptions.Item key={permission} label={permission}>
            <Tag color={hasPerm ? 'green' : 'red'}>
              {hasPerm ? '有权限' : '无权限'}
            </Tag>
          </Descriptions.Item>
        ))}
      </Descriptions>

      <Descriptions title="删除按钮显示权限" bordered style={{ marginTop: '16px' }}>
        {Object.entries(testDeleteButtonPermissions).map(([resource, canShow]) => (
          <Descriptions.Item key={resource} label={`${resource}删除按钮`}>
            <Tag color={canShow ? 'green' : 'red'}>
              {canShow ? '显示' : '隐藏'}
            </Tag>
          </Descriptions.Item>
        ))}
      </Descriptions>

      <div style={{ marginTop: '16px' }}>
        <Button 
          type="primary" 
          onClick={() => {
            console.log('当前用户信息:', currentUser);
            console.log('权限数组:', permissions);
            console.log('是否为管理员:', isUserAdmin);
            console.log('删除权限检查:', testPermissions);
            console.log('删除按钮权限检查:', testDeleteButtonPermissions);
          }}
        >
          在控制台输出详细信息
        </Button>
      </div>
    </Card>
  );
};

export default PermissionDebug; 