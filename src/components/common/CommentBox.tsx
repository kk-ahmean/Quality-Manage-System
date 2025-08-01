import React, { useState, useEffect } from 'react'
import { List, Input, Button, message, Typography } from 'antd'

const { TextArea } = Input
const { Text } = Typography

interface Comment {
  id: string
  content: string
  author: string
  time: string
  replyTo?: string
}

const fetchComments = async (): Promise<Comment[]> => {
  const res = await fetch('/api/comments/list')
  if (!res.ok) return []
  return res.json()
}

const postComment = async (content: string, replyTo?: string) => {
  const res = await fetch('/api/comments/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, replyTo })
  })
  return res.ok
}

const CommentBox: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [replyTo, setReplyTo] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    setComments(await fetchComments())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async () => {
    if (!content.trim()) return
    setLoading(true)
    const ok = await postComment(content, replyTo)
    setLoading(false)
    if (ok) {
      message.success('评论成功')
      setContent('')
      setReplyTo(undefined)
      load()
    } else {
      message.error('评论失败')
    }
  }

  return (
    <div>
      <List
        size="small"
        header={<Text strong>评论列表</Text>}
        dataSource={comments}
        loading={loading}
        renderItem={item => (
          <List.Item
            actions={[
              <Button size="small" onClick={() => setReplyTo(item.id)} key="reply">回复</Button>
            ]}
          >
            <span style={{ color: '#1890ff', marginRight: 8 }}>{item.author}</span>
            {item.replyTo && <span style={{ color: '#aaa', marginRight: 8 }}>@{item.replyTo}</span>}
            {item.content}
            <span style={{ color: '#aaa', marginLeft: 8 }}>{item.time}</span>
          </List.Item>
        )}
        style={{ marginBottom: 16 }}
      />
      <TextArea
        rows={3}
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={replyTo ? `回复 @${replyTo}` : '请输入评论内容'}
        style={{ marginBottom: 8 }}
      />
      <div>
        <Button type="primary" onClick={handleSubmit} loading={loading}>发布评论</Button>
        {replyTo && <Button style={{ marginLeft: 8 }} onClick={() => setReplyTo(undefined)}>取消回复</Button>}
      </div>
    </div>
  )
}

export default CommentBox 