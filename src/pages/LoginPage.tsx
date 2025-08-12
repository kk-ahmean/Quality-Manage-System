import React, { useEffect } from 'react'
import { Form, Input, Button, Card, message, Typography, Space, Modal } from 'antd'
import { UserOutlined, LockOutlined, BugOutlined } from '@ant-design/icons'
import { useAuthStore } from '../stores/authStore'
import { authAPI } from '../services/api'
import './LoginPage.css'
import { useState } from 'react'

const { Title, Text } = Typography

interface LoginForm {
  name: string
  password: string
  remember: boolean
}

const LoginPage: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuthStore()
  const [resetVisible, setResetVisible] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  // 检查URL token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      setResetToken(token)
      setResetVisible(true)
    }
  }, [])

  // 重置密码提交
  const handleReset = async (values: { password: string }) => {
    setResetLoading(true)
    try {
      const response = await authAPI.resetPassword(resetToken, values.password)
      
      if (response.data.success) {
        message.success('密码重置成功，请重新登录')
        setResetVisible(false)
        setTimeout(() => window.location.href = '/login', 1000)
      } else {
        message.error(response.data.message || '重置失败')
      }
    } catch (error: any) {
      console.error('重置密码失败:', error)
      if (error.response?.data?.message) {
        message.error(error.response.data.message)
      } else {
        message.error('网络错误，重置失败')
      }
    } finally {
      setResetLoading(false)
    }
  }

  useEffect(() => {
    // 清除之前的错误信息
    clearError()
  }, [clearError])

  const onFinish = async (values: LoginForm) => {
    try {
      await login(values.name, values.password)
      // 登录成功后，用户会被重定向到仪表盘，所以这里不需要显示成功消息
    } catch (err) {
      // 错误已在store中处理
    }
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-content">
          <Card className="login-card" bordered={false}>
            <div className="login-header">
              <Space direction="vertical" align="center" size="large">
                <div className="logo">
                  <BugOutlined className="logo-icon" />
                </div>
                <Title level={2} className="login-title">
                  品质管理系统
                </Title>
                <Text type="secondary" className="login-subtitle">
                  专业的品质跟踪与项目管理平台
                </Text>
              </Space>
            </div>

            <Form
              name="login"
              onFinish={onFinish}
              autoComplete="off"
              size="large"
              className="login-form"
            >
              <Form.Item
                name="name"
                rules={[
                  { required: true, message: '请输入用户名！' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="请输入用户名"
                  autoComplete="name"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码！' },
                  { min: 6, message: '密码至少6个字符！' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
              </Form.Item>

              {error && (
                <div className="error-message">
                  <Text type="danger">{error}</Text>
                </div>
              )}

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isLoading}
                  className="login-button"
                  block
                >
                  {isLoading ? '登录中...' : '登录'}
                </Button>
              </Form.Item>

              <div className="login-footer">
                {/* 忘记密码功能已移至系统设置页面 */}
              </div>
            </Form>

            {/* 演示账户信息（已隐藏，仅保留注释，便于后续恢复） */}
            {false && (
              <div className="demo-accounts">
                <Text type="secondary">演示账户：</Text>
                <div className="account-list">
                  <Text code>admin / 123456</Text>
                  <Text code>developer / 123456</Text>
                  <Text code>tester / 123456</Text>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
      <Modal
        open={resetVisible}
        title="重置密码"
        onCancel={() => setResetVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form onFinish={handleReset} layout="vertical">
          <Form.Item name="password" label="新密码" rules={[{ required: true, min: 6, message: '密码至少6位' }]}>
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={resetLoading} block>重置密码</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default LoginPage 