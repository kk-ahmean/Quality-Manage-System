import React, { useState } from 'react'
import { Form, Select, Button, message, Input, Typography } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'

const { Option } = Select
const { Text } = Typography

const DataExport: React.FC = () => {
  const [form] = Form.useForm()
  const [downloading, setDownloading] = useState(false)

  const handleExport = async (values: any) => {
    setDownloading(true)
    try {
      // 假设后端接口 /api/export
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      if (!res.ok) throw new Error('导出失败')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${values.type || 'export'}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
      form.resetFields()
    } catch (e) {
      message.error('导出失败')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div>
      <Form form={form} layout="inline" onFinish={handleExport} style={{ marginBottom: 16 }}>
        <Form.Item name="type" label="导出类型" rules={[{ required: true, message: '请选择导出类型' }]}> 
          <Select placeholder="请选择" style={{ width: 120 }}>
            <Option value="bug">Bug报表</Option>
            <Option value="task">任务报表</Option>
            <Option value="custom">自定义导出</Option>
          </Select>
        </Form.Item>
        <Form.Item name="condition" label="导出条件"> 
          <Input placeholder="可选，筛选条件" style={{ width: 200 }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" icon={<DownloadOutlined />} loading={downloading}>导出</Button>
        </Form.Item>
      </Form>
      <Text type="secondary">支持导出Bug、任务等数据，导出后自动下载Excel文件。</Text>
    </div>
  )
}

export default DataExport 