import React, { useState } from 'react'
import { Form, Input, Button, Select, message, List, Typography } from 'antd'

const { Option } = Select
const { TextArea } = Input
const { Text } = Typography

const NotificationSender: React.FC = () => {
  const [form] = Form.useForm()
  const [sending, setSending] = useState(false)
  const [logs, setLogs] = useState<any[]>([])

  const handleSend = async (values: any) => {
    setSending(true)
    try {
      // 假设后端接口 /api/notifications/send
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      const data = await res.json()
      if (res.ok) {
        message.success('通知发送成功')
        setLogs([{ ...values, time: new Date().toLocaleString() }, ...logs])
        form.resetFields()
      } else {
        message.error(data.message || '通知发送失败')
      }
    } catch (e) {
      message.error('网络错误，发送失败')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <Form form={form} layout="vertical" onFinish={handleSend}>
        <Form.Item name="type" label="通知类型" rules={[{ required: true, message: '请选择通知类型' }]}> 
          <Select placeholder="请选择">
            <Option value="system">系统通知</Option>
            <Option value="email">邮件通知</Option>
            <Option value="at">@提醒</Option>
          </Select>
        </Form.Item>
        <Form.Item name="to" label="接收人" rules={[{ required: true, message: '请输入接收人' }]}> 
          <Input placeholder="用户名/邮箱/ID" />
        </Form.Item>
        <Form.Item name="content" label="通知内容" rules={[{ required: true, message: '请输入内容' }]}> 
          <TextArea rows={3} placeholder="请输入通知内容" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={sending}>发送通知</Button>
        </Form.Item>
      </Form>
      <List
        size="small"
        header={<Text strong>发送日志</Text>}
        dataSource={logs}
        renderItem={item => (
          <List.Item>
            [{item.type}] {item.to} - {item.content} <span style={{ color: '#aaa', marginLeft: 8 }}>{item.time}</span>
          </List.Item>
        )}
        style={{ marginTop: 16 }}
      />
    </div>
  )
}

export default NotificationSender 