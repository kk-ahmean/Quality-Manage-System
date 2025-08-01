import React, { useState } from 'react'
import { Upload, Button, message, List, Typography } from 'antd'
import { UploadOutlined, FileOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd/es/upload/interface'

const { Text, Link } = Typography

const FILE_ACCEPT = '.jpg,.jpeg,.png,.gif,.txt,.log,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar'
const MAX_SIZE_MB = 10

const FileUpload: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)

  const props: UploadProps = {
    name: 'file',
    multiple: true,
    action: '/api/files/upload', // 后端真实接口
    accept: FILE_ACCEPT,
    fileList,
    onChange(info) {
      let newList = [...info.fileList]
      setFileList(newList)
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`)
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`)
      }
    },
    beforeUpload(file) {
      const isAllowed = FILE_ACCEPT.split(',').some(ext => file.name.endsWith(ext.trim()))
      if (!isAllowed) {
        message.error('不支持的文件类型')
        return Upload.LIST_IGNORE
      }
      const isLtMax = file.size / 1024 / 1024 < MAX_SIZE_MB
      if (!isLtMax) {
        message.error(`文件不能超过${MAX_SIZE_MB}MB`)
        return Upload.LIST_IGNORE
      }
      return true
    },
    onRemove(file) {
      // 可选：调用后端删除接口
      return true
    },
    showUploadList: true,
  }

  return (
    <div>
      <Upload {...props} disabled={uploading}>
        <Button icon={<UploadOutlined />} loading={uploading}>
          选择文件
        </Button>
      </Upload>
      <List
        size="small"
        header={<Text strong>已上传文件</Text>}
        dataSource={fileList.filter(f => f.status === 'done')}
        renderItem={item => (
          <List.Item>
            <FileOutlined style={{ marginRight: 8 }} />
            <Link href={item.response?.url || '#'} target="_blank" rel="noopener noreferrer">
              {item.name}
            </Link>
          </List.Item>
        )}
        style={{ marginTop: 16 }}
      />
    </div>
  )
}

export default FileUpload 