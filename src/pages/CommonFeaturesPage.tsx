import React from 'react'
import { Card, Row, Col, Divider } from 'antd'
import FileUpload from '../components/common/FileUpload'
import NotificationSender from '../components/common/NotificationSender'
import CommentBox from '../components/common/CommentBox'
import DataExport from '../components/common/DataExport'

const CommonFeaturesPage: React.FC = () => {
  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>通用功能演示</h2>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="文件上传" bordered>
            <FileUpload />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="通知系统" bordered>
            <NotificationSender />
          </Card>
        </Col>
      </Row>
      <Divider />
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="评论功能" bordered>
            <CommentBox />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="数据导出" bordered>
            <DataExport />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default CommonFeaturesPage 