import React, { useState, useEffect } from 'react';
import { Modal, Upload, Table, Button, message, Alert } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import * as XLSX from 'xlsx';

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
  const [parsing, setParsing] = useState(false);

  // 重置状态
  useEffect(() => {
    if (open) {
      setFileList([]);
      setData([]);
      setError(null);
      setLoading(false);
      setParsing(false);
    }
  }, [open]);

  const beforeUpload = (file: File) => {
    console.log('beforeUpload检查文件:', file.name, file.type, file.size); // 调试信息
    const isExcel = file.type.includes('sheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
    if (!isExcel && !isCSV) {
      message.error('仅支持Excel或CSV文件');
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const parseExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          console.log('Excel文件读取完成，开始解析...'); // 调试信息
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          console.log('Excel原始数据:', jsonData); // 调试信息
          
          if (jsonData.length < 2) {
            reject(new Error('文件内容为空或格式不正确'));
            return;
          }
          
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];
          
          console.log('Excel表头:', headers); // 调试信息
          console.log('Excel数据行数:', rows.length); // 调试信息
          
          const parsedData = rows.map((row, index) => {
            const obj: any = {};
            headers.forEach((header, headerIndex) => {
              if (header && row[headerIndex] !== undefined) {
                obj[header] = row[headerIndex];
              }
            });
            console.log(`第${index + 1}行解析结果:`, obj); // 调试信息
            return obj;
          }).filter(item => Object.keys(item).length > 0);
          
          console.log('Excel最终解析结果:', parsedData); // 调试信息
          resolve(parsedData);
        } catch (error) {
          console.error('Excel解析错误:', error); // 调试信息
          reject(error);
        }
      };
      reader.onerror = () => {
        console.error('Excel文件读取失败'); // 调试信息
        reject(new Error('文件读取失败'));
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const parseCSVFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          console.log('CSV文件读取完成，开始解析...'); // 调试信息
          const csvText = e.target?.result as string;
          const lines = csvText.split('\n');
          
          console.log('CSV原始行数:', lines.length); // 调试信息
          
          if (lines.length < 2) {
            reject(new Error('CSV文件内容为空或格式不正确'));
            return;
          }
          
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const rows = lines.slice(1).filter(line => line.trim());
          
          console.log('CSV表头:', headers); // 调试信息
          console.log('CSV数据行数:', rows.length); // 调试信息
          
          const parsedData = rows.map((line, index) => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const obj: any = {};
            headers.forEach((header, headerIndex) => {
              if (header && values[headerIndex] !== undefined) {
                obj[header] = values[headerIndex];
              }
            });
            console.log(`第${index + 1}行解析结果:`, obj); // 调试信息
            return obj;
          }).filter(item => Object.keys(item).length > 0);
          
          console.log('CSV最终解析结果:', parsedData); // 调试信息
          resolve(parsedData);
        } catch (error) {
          console.error('CSV解析错误:', error); // 调试信息
          reject(error);
        }
      };
      reader.onerror = () => {
        console.error('CSV文件读取失败'); // 调试信息
        reject(new Error('文件读取失败'));
      };
      reader.readAsText(file, 'utf-8');
    });
  };

  const handleUpload = async (info: any) => {
    console.log('=== 文件上传状态变化 ==='); // 调试信息
    console.log('文件上传状态:', info.file.status); // 调试信息
    console.log('文件信息:', info.file); // 调试信息
    console.log('当前loading状态:', loading); // 调试信息
    console.log('当前parsing状态:', parsing); // 调试信息
    console.log('当前data长度:', data.length); // 调试信息
    console.log('info对象:', info); // 调试信息
    
    if (info.file.status === 'uploading') {
      console.log('开始上传文件...'); // 调试信息
      console.log('设置loading为true'); // 调试信息
      setLoading(true);
      setParsing(false);
      setError(null);
      return;
    }
    
    if (info.file.status === 'done') {
      console.log('文件上传完成，开始解析...'); // 调试信息
      setLoading(false);
      setParsing(true);
      setError(null);
      
      const file = info.file.originFileObj || info.file;
      console.log('准备解析文件:', file.name, '文件大小:', file.size, '文件类型:', file.type); // 调试信息
      
      try {
        let parsedData: any[] = [];
        
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          console.log('开始解析Excel文件...'); // 调试信息
          parsedData = await parseExcelFile(file);
        } else if (file.name.endsWith('.csv')) {
          console.log('开始解析CSV文件...'); // 调试信息
          parsedData = await parseCSVFile(file);
        } else {
          throw new Error('不支持的文件格式');
        }
        
        console.log('解析完成，结果:', parsedData.length, '条记录'); // 调试信息
        console.log('解析数据预览:', parsedData.slice(0, 2)); // 调试信息
        
        if (parsedData.length === 0) {
          throw new Error('文件中没有有效数据');
        }
        
        console.log('设置解析数据到状态...'); // 调试信息
        setData(parsedData);
        setParsing(false);
        console.log('解析状态已重置，数据已设置'); // 调试信息
        message.success(`文件解析成功，共 ${parsedData.length} 条记录`);
      } catch (e) {
        console.error('文件解析错误:', e); // 调试信息
        setError(`文件解析失败：${e instanceof Error ? e.message : '未知错误'}`);
        setData([]);
        setParsing(false);
      }
    } else if (info.file.status === 'error') {
      console.error('文件上传错误:', info.file.error); // 调试信息
      setError('文件上传失败');
      setLoading(false);
      setParsing(false);
    } else if (info.file.status === 'removed') {
      console.log('文件已移除'); // 调试信息
      setLoading(false);
      setParsing(false);
      setData([]);
      setError(null);
    }
  };

  const handleOk = () => {
    console.log('点击确定按钮'); // 调试信息
    console.log('当前data长度:', data.length); // 调试信息
    console.log('当前loading状态:', loading); // 调试信息
    console.log('当前parsing状态:', parsing); // 调试信息
    
    if (data.length === 0) {
      console.log('数据为空，显示错误'); // 调试信息
      setError('请先上传并解析数据');
      return;
    }
    
    console.log('开始确认导入，数据:', data); // 调试信息
    onConfirm(data);
    setFileList([]);
    setData([]);
    setError(null);
    setLoading(false);
    setParsing(false);
    onClose();
  };

  const handleFileParse = async (file: File) => {
    console.log('开始手动解析文件:', file.name); // 调试信息
    setLoading(false);
    setParsing(true);
    setError(null);
    
    try {
      let parsedData: any[] = [];
      
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        console.log('开始解析Excel文件...'); // 调试信息
        parsedData = await parseExcelFile(file);
      } else if (file.name.endsWith('.csv')) {
        console.log('开始解析CSV文件...'); // 调试信息
        parsedData = await parseCSVFile(file);
      } else {
        throw new Error('不支持的文件格式');
      }
      
      console.log('解析完成，结果:', parsedData.length, '条记录'); // 调试信息
      console.log('解析数据预览:', parsedData.slice(0, 2)); // 调试信息
      
      if (parsedData.length === 0) {
        throw new Error('文件中没有有效数据');
      }
      
      console.log('设置解析数据到状态...'); // 调试信息
      setData(parsedData);
      setParsing(false);
      console.log('解析状态已重置，数据已设置'); // 调试信息
      message.success(`文件解析成功，共 ${parsedData.length} 条记录`);
    } catch (e) {
      console.error('文件解析错误:', e); // 调试信息
      setError(`文件解析失败：${e instanceof Error ? e.message : '未知错误'}`);
      setData([]);
      setParsing(false);
    }
  };

  const handleCancel = () => {
    console.log('取消导入'); // 调试信息
    setFileList([]);
    setData([]);
    setError(null);
    setLoading(false);
    setParsing(false);
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
      <div style={{ marginBottom: 16 }}>
        <Button type="link" href="/templates/bug-import-template.xlsx" target="_blank" download>
          下载模板
        </Button>
      </div>
      <Upload
        accept=".csv,.xls,.xlsx"
        fileList={fileList}
        beforeUpload={beforeUpload}
        onChange={handleUpload}
        onRemove={() => { 
          setFileList([]); 
          setData([]); 
          setError(null); 
          setLoading(false);
          setParsing(false);
        }}
        maxCount={1}
        customRequest={({ file, onSuccess, onError }: any) => {
          console.log('customRequest开始，文件:', file.name); // 调试信息
          // 模拟上传成功
          setTimeout(() => {
            console.log('customRequest完成，调用onSuccess'); // 调试信息
            // 确保文件状态正确设置
            const response = { status: 'ok' };
            // 直接调用onSuccess，让Upload组件处理状态更新
            onSuccess(response);
            
            // 手动触发文件解析
            setTimeout(() => {
              console.log('手动触发文件解析...'); // 调试信息
              handleFileParse(file);
            }, 100);
          }, 1000);
        }}
      >
        <Button icon={<UploadOutlined />} loading={loading || parsing}>
          {loading ? '上传中...' : parsing ? '解析中...' : '上传Excel/CSV文件'}
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