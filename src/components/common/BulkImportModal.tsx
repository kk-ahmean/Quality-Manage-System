import React, { useState } from 'react';
import { Modal, Upload, Table, Button, message, Alert } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: any[]) => void;
  columns: any[];
  templateUrl?: string;
  title?: string;
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({ open, onClose, onConfirm, columns, templateUrl, title }) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const beforeUpload = (file: File) => {
    const isExcel = file.type.includes('sheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
    if (!isExcel && !isCSV) {
      message.error('仅支持Excel或CSV文件');
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const handleUpload = async (info: any) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      setError(null);
      setLoading(true);
      const file = info.file.originFileObj;
      try {
        // 模拟文件解析
        const mockData = [
          {
            title: '测试Bug1',
            description: '这是一个测试Bug',
            reproductionSteps: '步骤1，步骤2',
            expectedResult: '预期结果',
            actualResult: '实际结果',
            priority: 'P1',
            severity: 'A',
            type: '功能缺陷',
            responsibility: '软件'
          },
          {
            title: '测试Bug2',
            description: '这是另一个测试Bug',
            reproductionSteps: '步骤1，步骤2，步骤3',
            expectedResult: '预期结果2',
            actualResult: '实际结果2',
            priority: 'P2',
            severity: 'B',
            type: '性能问题',
            responsibility: '软件'
          }
        ];
        setData(mockData);
        message.success('文件解析成功');
      } catch (e) {
        setError('文件解析失败，请检查格式');
        setData([]);
      }
      setLoading(false);
    }
  };

  const handleOk = () => {
    if (data.length === 0) {
      setError('请先上传并解析数据');
      return;
    }
    onConfirm(data);
    setFileList([]);
    setData([]);
    setError(null);
    onClose();
  };

  const handleCancel = () => {
    setFileList([]);
    setData([]);
    setError(null);
    onClose();
  };

  return (
    <Modal 
      open={open} 
      title={title || '批量导入'} 
      onCancel={handleCancel} 
      onOk={handleOk} 
      destroyOnClose 
      width={700}
      okText="确定"
      cancelText="取消"
    >
      {templateUrl && (
        <div style={{ marginBottom: 16 }}>
          <Button type="link" href={templateUrl} target="_blank">
            下载模板
          </Button>
        </div>
      )}
      <Upload
        accept=".csv,.xls,.xlsx"
        fileList={fileList}
        beforeUpload={beforeUpload}
        onChange={handleUpload}
        onRemove={() => { 
          setFileList([]); 
          setData([]); 
          setError(null); 
        }}
        maxCount={1}
        customRequest={({ file, onSuccess }: any) => {
          // 模拟上传成功
          setTimeout(() => {
            onSuccess("ok");
          }, 1000);
        }}
      >
        <Button icon={<UploadOutlined />} loading={loading}>
          上传Excel/CSV文件
        </Button>
      </Upload>
      {error && <Alert type="error" message={error} style={{ margin: '12px 0' }} />}
      {data.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>预览数据 ({data.length} 条记录):</strong>
          </div>
          <Table 
            columns={columns} 
            dataSource={data} 
            rowKey={(_, i) => i || 0} 
            pagination={false} 
            size="small"
            scroll={{ x: 600 }}
          />
        </div>
      )}
    </Modal>
  );
};

export default BulkImportModal; 