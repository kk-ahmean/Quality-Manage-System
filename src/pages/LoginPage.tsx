import React, { useEffect } from 'react'
import { Form, Input, Button, Card, message, Typography, Space, Modal } from 'antd'
import { UserOutlined, LockOutlined, BugOutlined } from '@ant-design/icons'
import { useAuthStore } from '../stores/authStore'
import './LoginPage.css'
import { useState } from 'react'

const { Title, Text } = Typography

interface LoginForm {
  username: string
  password: string
  remember: boolean
}

const LoginPage: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuthStore()
  const [forgotVisible, setForgotVisible] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [resetVisible, setResetVisible] = useState(false)
  const [resetToken, setResetToken] = useState('')

  // 检查URL token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      setResetToken(token)
      setResetVisible(true)
    }
  }, [])

  // 忘记密码提交
  const handleForgot = async (values: { username: string; email: string }) => {
    setForgotLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      if (res.ok) {
        message.success('重置邮件已发送，请查收邮箱')
        setForgotVisible(false)
      } else {
        const data = await res.json()
        message.error(data.message || '发送失败')
      }
    } catch {
      message.error('网络错误，发送失败')
    } finally {
      setForgotLoading(false)
    }
  }

  // 重置密码提交
  const handleReset = async (values: { password: string }) => {
    setForgotLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: values.password })
      })
      if (res.ok) {
        message.success('密码重置成功，请重新登录')
        setResetVisible(false)
        setTimeout(() => window.location.href = '/login', 1000)
      } else {
        const data = await res.json()
        message.error(data.message || '重置失败')
      }
    } catch {
      message.error('网络错误，重置失败')
    } finally {
      setForgotLoading(false)
    }
  }

  useEffect(() => {
    // 清除之前的错误信息
    clearError()
  }, [clearError])

  const onFinish = async (values: LoginForm) => {
    try {
      await login(values.username, values.password)
      // 登录成功后，用户会被重定向到仪表盘，所以这里不需要显示成功消息
    } catch (err) {
      // 错误已在store中处理
    }
  }

  const handleForgotPassword = () => {
    setForgotVisible(true)
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
                name="username"
                rules={[
                  { required: true, message: '请输入用户名！' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="请输入用户名"
                  autoComplete="username"
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
                <Button type="link" onClick={handleForgotPassword}>
                  忘记密码？
                </Button>
              </div>
            </Form>

            {/* 演示账户信息 */}
            <div className="demo-accounts">
              <Text type="secondary">演示账户：</Text>
              <div className="account-list">
                <Text code>admin / 123456</Text>
                <Text code>developer / 123456</Text>
                <Text code>tester / 123456</Text>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <Modal
        open={forgotVisible}
        title="找回密码"
        onCancel={() => setForgotVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form onFinish={handleForgot} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={forgotLoading} block>发送重置邮件</Button>
          </Form.Item>
        </Form>
      </Modal>
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
            <Button type="primary" htmlType="submit" loading={forgotLoading} block>重置密码</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default LoginPage 