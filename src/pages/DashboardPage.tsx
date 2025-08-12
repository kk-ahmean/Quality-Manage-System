import React, { useEffect, useMemo, useState } from 'react'
import { Row, Col, Card, Statistic, Progress, Typography, Spin, Select, Space } from 'antd'
import { 
  BugOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined,
  TagsOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { Line } from '@ant-design/plots'
import { useBugStore } from '../stores/bugStore'
import { useTaskStore } from '../stores/taskStore'
import { useUserStore } from '../stores/userStore'
import PermissionDebug from '../components/common/PermissionDebug'

const { Title } = Typography
const { Option } = Select

const DashboardPage: React.FC = () => {
  // Bug相关数据
  const { 
    bugs,
    statistics: bugStats, 
    fetchBugs,
    fetchStatistics: fetchBugStats, 
    loading: bugLoading
  } = useBugStore()
  
  // 任务相关数据
  const { 
    tasks,
    statistics: taskStats, 
    fetchTasks,
    getStatistics: fetchTaskStats, 
    loading: taskLoading 
  } = useTaskStore()
  
  // 筛选类型状态
  const [bugDistributionType, setBugDistributionType] = useState<'status' | 'type' | 'responsibility' | 'priority'>('status')
  const [taskDistributionType, setTaskDistributionType] = useState<'status' | 'priority' | 'assignee'>('status')
  const [bugTrendPeriod, setBugTrendPeriod] = useState<'3' | '7' | '15' | '30'>('30')
  const [taskTrendPeriod, setTaskTrendPeriod] = useState<'3' | '7' | '15' | '30'>('30')
  
  // 三级类目筛选状态
  const [bugCategoryLevel3, setBugCategoryLevel3] = useState<string>('全部')
  const [taskCategoryLevel3, setTaskCategoryLevel3] = useState<string>('全部')

  // 1. 在状态管理区增加趋势栏的三级类目筛选状态
  const [bugTrendCategoryLevel3, setBugTrendCategoryLevel3] = useState<string>('全部')
  const [taskTrendCategoryLevel3, setTaskTrendCategoryLevel3] = useState<string>('全部')

  // 获取所有用户列表
  const { users } = useUserStore()

  // 计算Bug统计数据
  const bugStatistics = useMemo(() => {
    // 强制从store获取最新数据
    const currentBugs = useBugStore.getState().bugs
    const bugsToUse = bugs.length > 0 ? bugs : currentBugs
    
    if (!bugsToUse || bugsToUse.length === 0) {
      // 调试信息 - 已隐藏
      return {
        total: 0,
        resolved: 0,
        inProgress: 0,
        unresolved: 0,
        resolutionRate: 0
      }
    }
    
    // 根据三级类目筛选Bug
    let filteredBugs = bugsToUse
    if (bugCategoryLevel3 !== '全部') {
      filteredBugs = bugsToUse.filter(bug => bug.categoryLevel3 === bugCategoryLevel3)
    }
    
    const total = filteredBugs.length
    const resolved = filteredBugs.filter(bug => bug.status === '已解决' || bug.status === '已关闭').length
    const inProgress = filteredBugs.filter(bug => bug.status === '处理中').length
    const unresolved = total - resolved
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0
    
    // 调试信息 - 已隐藏
    
    return { total, resolved, inProgress, unresolved, resolutionRate }
  }, [bugs, bugCategoryLevel3])

  // 获取Bug三级类目选项
  const bugCategoryOptions = useMemo(() => {
    const currentBugs = useBugStore.getState().bugs
    const bugsToUse = bugs.length > 0 ? bugs : currentBugs
    
    if (!bugsToUse || bugsToUse.length === 0) return ['全部']
    
    const categories = [...new Set(bugsToUse.map(bug => bug.categoryLevel3).filter(Boolean))]
    return ['全部', ...categories]
  }, [bugs])

  // 获取任务三级类目选项
  const taskCategoryOptions = useMemo(() => {
    const currentTasks = useTaskStore.getState().tasks
    const tasksToUse = tasks.length > 0 ? tasks : currentTasks
    
    if (!tasksToUse || tasksToUse.length === 0) return ['全部']
    
    const categories = [...new Set(tasksToUse.map(task => task.categoryLevel3).filter(Boolean))]
    return ['全部', ...categories]
  }, [tasks])

  // 计算任务统计数据
  const taskStatistics = useMemo(() => {
    // 强制从store获取最新数据
    const currentTasks = useTaskStore.getState().tasks
    const tasksToUse = tasks.length > 0 ? tasks : currentTasks
    
    if (!tasksToUse || tasksToUse.length === 0) {
      // 调试信息 - 已隐藏
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        todo: 0,
        completionRate: 0
      }
    }
    
    // 根据三级类目筛选任务
    let filteredTasks = tasksToUse
    if (taskCategoryLevel3 !== '全部') {
      filteredTasks = tasksToUse.filter(task => task.categoryLevel3 === taskCategoryLevel3)
    }
    
    const total = filteredTasks.length
    const completed = filteredTasks.filter(task => task.status === 'completed').length
    const inProgress = filteredTasks.filter(task => task.status === 'in_progress').length
    const todo = filteredTasks.filter(task => task.status === 'todo').length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    
    // 调试信息 - 已隐藏
    
    return { total, completed, inProgress, todo, completionRate }
  }, [tasks, taskCategoryLevel3])

  // Bug分布数据
  const bugDistributionData = useMemo(() => {
    // 强制从store获取最新数据
    const currentBugs = useBugStore.getState().bugs
    const bugsToUse = bugs.length > 0 ? bugs : currentBugs
    
    if (!bugsToUse || bugsToUse.length === 0) {
      // 调试信息 - 已隐藏
      return []
    }
    
    // 根据三级类目筛选Bug
    let filteredBugs = bugsToUse
    if (bugCategoryLevel3 !== '全部') {
      filteredBugs = bugsToUse.filter(bug => bug.categoryLevel3 === bugCategoryLevel3)
    }
    
    let data: Array<{ type: string, value: number }> = []
    switch (bugDistributionType) {
      case 'status':
        const statusMap: Record<string, number> = {}
        filteredBugs.forEach(bug => { statusMap[bug.status] = (statusMap[bug.status] || 0) + 1 })
        data = Object.entries(statusMap).map(([type, value]) => ({ type, value }))
        // 调试信息 - 已隐藏
        break
      case 'type':
        const typeMap: Record<string, number> = {}
        filteredBugs.forEach(bug => { typeMap[bug.type] = (typeMap[bug.type] || 0) + 1 })
        data = Object.entries(typeMap).map(([type, value]) => ({ type, value }))
        // 调试信息 - 已隐藏
        break
      case 'responsibility':
        const responsibilityMap: Record<string, number> = {}
        filteredBugs.forEach(bug => { responsibilityMap[bug.responsibility] = (responsibilityMap[bug.responsibility] || 0) + 1 })
        data = Object.entries(responsibilityMap).map(([type, value]) => ({ type, value }))
        // 调试信息 - 已隐藏
        break
      case 'priority':
        const priorityMap: Record<string, number> = {}
        filteredBugs.forEach(bug => { priorityMap[bug.priority] = (priorityMap[bug.priority] || 0) + 1 })
        data = Object.entries(priorityMap).map(([type, value]) => ({ type, value }))
        // 调试信息 - 已隐藏
        break
      default:
        break
    }
    
    const result = data.sort((a, b) => b.value - a.value)
    // 调试信息 - 已隐藏
    return result
  }, [bugs, bugDistributionType, bugCategoryLevel3])

  // 2. 修改Bug趋势数据useMemo，支持三级类目筛选
  const bugTrendData = useMemo(() => {
    if (!bugs || bugs.length === 0) return []
    let filteredBugs = bugs
    if (bugTrendCategoryLevel3 !== '全部') {
      filteredBugs = bugs.filter(bug => bug.categoryLevel3 === bugTrendCategoryLevel3)
    }
    // 按日期统计未关闭Bug数
    const trendMap: Record<string, number> = {}
    filteredBugs.forEach(bug => {
      if (bug.status !== '已关闭') {
        const date = bug.createdAt.slice(0, 10)
        trendMap[date] = (trendMap[date] || 0) + 1
      }
    })
    const today = new Date()
    const days = parseInt(bugTrendPeriod)
    const dateArray = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().slice(0, 10)
      dateArray.push(dateStr)
    }
    const result = dateArray.map(date => ({
      date,
      value: trendMap[date] || 0,
      type: '未关闭Bug'
    }))
    return result
  }, [bugs, bugTrendPeriod, bugTrendCategoryLevel3])

  // 任务分布数据
  const taskDistributionData = useMemo(() => {
    if (!tasks || tasks.length === 0) return []
    
    // 根据三级类目筛选任务
    let filteredTasks = tasks
    if (taskCategoryLevel3 !== '全部') {
      filteredTasks = tasks.filter(task => task.categoryLevel3 === taskCategoryLevel3)
    }
    
    let data: Array<{ type: string, value: number }> = []
    switch (taskDistributionType) {
      case 'status':
        const statusMap: Record<string, number> = {}
        filteredTasks.forEach(task => { statusMap[task.status] = (statusMap[task.status] || 0) + 1 })
        data = Object.entries(statusMap).map(([type, value]) => ({ type, value }))
        break
      case 'priority':
        const priorityMap: Record<string, number> = {}
        filteredTasks.forEach(task => { priorityMap[task.priority] = (priorityMap[task.priority] || 0) + 1 })
        data = Object.entries(priorityMap).map(([type, value]) => ({ type, value }))
        break
      case 'assignee':
        const assigneeMap: Record<string, number> = {};
        filteredTasks.forEach(task => {
          let name: any = task.assigneeName || task.assignee || '未分配';
          // 兜底处理：如果不是字符串，优先取常见字段
          if (typeof name !== 'string') {
            if (name && typeof name === 'object') {
              name = name.assigneeName || name.name || name.realName || name.nickName || name.name || name.id || name._id || JSON.stringify(name);
            } else {
              name = String(name);
            }
          }
          assigneeMap[name] = (assigneeMap[name] || 0) + 1;
        });
        data = Object.entries(assigneeMap).map(([type, value]) => ({ type, value }));
        break
      default:
        break
    }
    
    const result = data.sort((a, b) => b.value - a.value)
    // 调试信息 - 已隐藏
    return result
    return result
  }, [tasks, taskDistributionType, taskCategoryLevel3])

  // 3. 修改任务趋势数据useMemo，支持三级类目筛选
  const taskTrendData = useMemo(() => {
    if (!tasks || tasks.length === 0) return []
    let filteredTasks = tasks
    if (taskTrendCategoryLevel3 !== '全部') {
      filteredTasks = tasks.filter(task => task.categoryLevel3 === taskTrendCategoryLevel3)
    }
    const trendMap: Record<string, number> = {}
    filteredTasks.forEach(task => {
      if (task.status !== 'completed') {
        const date = task.createdAt.slice(0, 10)
        trendMap[date] = (trendMap[date] || 0) + 1
      }
    })
    const today = new Date()
    const days = parseInt(taskTrendPeriod)
    const dateArray = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().slice(0, 10)
      dateArray.push(dateStr)
    }
    const result = dateArray.map(date => ({
      date,
      value: trendMap[date] || 0,
      type: '未完成任务'
    }))
    return result
  }, [tasks, taskTrendPeriod, taskTrendCategoryLevel3])

  // 任务分布栏负责人标签兜底处理
  const getAssigneeLabel = (type: any) => {
    if (!type) return '未分配';
    if (typeof type === 'string') return type;
    if (typeof type === 'object') {
      // 调试信息 - 已隐藏
      // 优先取常见姓名字段
      if (typeof type.assigneeName === 'string' && type.assigneeName) return type.assigneeName;
      if (typeof type.name === 'string' && type.name) return type.name;
      if (typeof type.realName === 'string' && type.realName) return type.realName;
      if (typeof type.nickName === 'string' && type.nickName) return type.nickName;
      if (typeof type.name === 'string' && type.name) return type.name;
      // 兼容 id 显示
      if (typeof type.id === 'string' && type.id) return type.id;
      if (typeof type._id === 'string' && type._id) return type._id;
      try {
        return JSON.stringify(type);
      } catch {
        return '未分配';
      }
    }
    return String(type);
  };

  // 自动刷新数据
  useEffect(() => {
    const loadData = async () => {
      try {
        // 调试信息 - 已隐藏
        await Promise.all([
          fetchBugs({}, 1, 1000), // 获取所有Bug数据，不分页
          fetchBugStats(),
          fetchTasks({}, 1, 1000), // 获取所有任务数据，不分页
          fetchTaskStats()
        ])
        
        // 强制等待一下确保数据更新
        setTimeout(() => {
          const currentBugs = useBugStore.getState().bugs
          const currentTasks = useTaskStore.getState().tasks
          // 调试信息 - 已隐藏
        }, 500) // 增加等待时间
      } catch (error) {
        console.error('数据加载失败:', error)
      }
    }
    
    loadData()
  }, []) // 只在组件挂载时执行一次

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>仪表盘</Title>
      
      <Row gutter={24}>
        {/* 左侧：Bug概览 */}
        <Col span={12}>
          <Card title="Bug概览" style={{ marginBottom: 24 }}>
            {/* Bug统计卡片 */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Bug总数"
                    value={bugStatistics.total}
                    prefix={<BugOutlined style={{ color: 'var(--primary-color)' }} />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="已解决"
                    value={bugStatistics.resolved}
                    prefix={<CheckCircleOutlined style={{ color: 'var(--success-color)' }} />}
                    valueStyle={{ color: 'var(--success-color)' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="处理中"
                    value={bugStatistics.inProgress}
                    prefix={<ClockCircleOutlined style={{ color: 'var(--warning-color)' }} />}
                    valueStyle={{ color: 'var(--warning-color)' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="未解决"
                    value={bugStatistics.unresolved}
                    prefix={<ExclamationCircleOutlined style={{ color: 'var(--error-color)' }} />}
                    valueStyle={{ color: 'var(--error-color)' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Bug解决率进度条 */}
            <Card style={{ marginBottom: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontWeight: 'bold' }}>Bug解决率</span>
                <span style={{ marginLeft: 8, color: 'var(--text-color-secondary)' }}>
                  {bugStatistics.resolutionRate}%
                </span>
              </div>
              <Progress
                percent={bugStatistics.resolutionRate}
                strokeColor={{ '0%': 'var(--primary-color)', '100%': 'var(--success-color)' }}
                showInfo={false}
              />
            </Card>

            {/* Bug分布图表 */}
            <Card
              title="Bug分布"
              extra={
                <Space>
                  <Select
                    value={bugCategoryLevel3}
                    onChange={setBugCategoryLevel3}
                    style={{ width: 120 }}
                    placeholder="选择三级类目"
                  >
                    {bugCategoryOptions.map(option => (
                      <Option key={option} value={option}>{option}</Option>
                    ))}
                  </Select>
                  <Select
                    value={bugDistributionType}
                    onChange={setBugDistributionType}
                    style={{ width: 120 }}
                  >
                    <Option value="status">按状态</Option>
                    <Option value="type">按类型</Option>
                    <Option value="responsibility">按责任归属</Option>
                    <Option value="priority">按优先级</Option>
                  </Select>
                </Space>
              }
              style={{ marginBottom: 24 }}
            >
              {bugDistributionData.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', height: 300 }}>
                  {/* 左侧标签 - 2/5 */}
                  <div style={{ width: '40%', paddingRight: '10px' }}>
                    {bugDistributionData.map((item, index) => {
                      const total = bugDistributionData.reduce((sum, d) => sum + d.value, 0);
                      const percentage = Math.round((item.value / total) * 100);
                      return (
                        <div key={item.type} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          marginBottom: '8px',
                          fontSize: '13px'
                        }}>
                          <span style={{ 
                            display: 'inline-block', 
                            width: '10px', 
                            height: '10px', 
                            borderRadius: '50%', 
                            background: `hsl(${index * 60}, 70%, 50%)`,
                            marginRight: '6px',
                            flexShrink: 0
                          }}></span>
                          <span style={{ flex: 1, marginRight: '4px' }}>{item.type}</span>
                          <span style={{ 
                            fontWeight: 'bold',
                            color: 'var(--text-color-primary)',
                            fontSize: '12px'
                          }}>
                            {item.value} ({percentage}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* 右侧饼图 - 3/5 */}
                  <div style={{ 
                    width: '60%', 
                    height: '200px', 
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <div style={{ 
                      width: '200px', 
                      height: '200px', 
                      borderRadius: '50%', 
                      background: `conic-gradient(${bugDistributionData.map((item, index) => {
                        const total = bugDistributionData.reduce((sum, d) => sum + d.value, 0);
                        const startPercent = bugDistributionData.slice(0, index).reduce((sum, d) => sum + d.value, 0) / total * 100;
                        const endPercent = startPercent + (item.value / total * 100);
                        return `hsl(${index * 60}, 70%, 50%) ${startPercent}% ${endPercent}%`;
                      }).join(', ')})`,
                      position: 'relative'
                    }}>
                      <div style={{ 
                        position: 'absolute', 
                        top: '50%', 
                        left: '50%', 
                        transform: 'translate(-50%, -50%)', 
                        width: '60px', 
                        height: '60px', 
                        borderRadius: '50%', 
                        background: 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: 'var(--text-color-primary)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        <span>总计</span>
                        <span style={{ fontSize: '16px', marginTop: '2px' }}>
                          {bugDistributionData.reduce((sum, d) => sum + d.value, 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-color-tertiary)' }}>
                  暂无数据
                </div>
              )}
            </Card>

                         {/* Bug趋势图表 */}
             <Card 
               title="Bug趋势"
               extra={
                 <Space>
                   <Select
                     value={bugTrendCategoryLevel3}
                     onChange={setBugTrendCategoryLevel3}
                     style={{ width: 120 }}
                     placeholder="选择三级类目"
                   >
                     {bugCategoryOptions.map(option => (
                       <Option key={option} value={option}>{option}</Option>
                     ))}
                   </Select>
                   <Select
                     value={bugTrendPeriod}
                     onChange={setBugTrendPeriod}
                     style={{ width: 120 }}
                   >
                     <Option value="3">近3天</Option>
                     <Option value="7">近7天</Option>
                     <Option value="15">近15天</Option>
                     <Option value="30">近30天</Option>
                   </Select>
                 </Space>
               }
             >
               {bugTrendData.length > 0 ? (
                 <Line
                   data={bugTrendData}
                   xField="date"
                   yField="value"
                   seriesField="type"
                   smooth
                   point={{
                     size: 4,
                     shape: 'circle'
                   }}
                   xAxis={{
                     tickFormatter: (value: string) => {
                       const date = new Date(value);
                       return `${date.getMonth() + 1}-${date.getDate().toString().padStart(2, '0')}`;
                     }
                   }}
                   yAxis={{
                     min: 1,
                     max: Math.max(...bugTrendData.map(item => item.value), 1),
                     tickCount: 5,
                     tickFormatter: (value: number) => Math.round(value).toString()
                   }}
                   style={{ height: 150 }}
                 />
               ) : (
                 <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-color-tertiary)' }}>
                   暂无数据
                 </div>
               )}
             </Card>
          </Card>
        </Col>

        {/* 右侧：任务概览 */}
        <Col span={12}>
          <Card title="任务概览" style={{ marginBottom: 24 }}>
            {/* 任务统计卡片 */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="任务总数"
                    value={taskStatistics.total}
                    prefix={<TagsOutlined style={{ color: 'var(--primary-color)' }} />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="已完成"
                    value={taskStatistics.completed}
                    prefix={<CheckCircleOutlined style={{ color: 'var(--success-color)' }} />}
                    valueStyle={{ color: 'var(--success-color)' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="进行中"
                    value={taskStatistics.inProgress}
                    prefix={<ClockCircleOutlined style={{ color: 'var(--warning-color)' }} />}
                    valueStyle={{ color: 'var(--warning-color)' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="待处理"
                    value={taskStatistics.todo}
                    prefix={<WarningOutlined style={{ color: 'var(--error-color)' }} />}
                    valueStyle={{ color: 'var(--error-color)' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* 任务完成率进度条 */}
            <Card style={{ marginBottom: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontWeight: 'bold' }}>任务完成率</span>
                <span style={{ marginLeft: 8, color: 'var(--text-color-secondary)' }}>
                  {taskStatistics.completionRate}%
                </span>
              </div>
              <Progress
                percent={taskStatistics.completionRate}
                strokeColor={{ '0%': 'var(--primary-color)', '100%': 'var(--success-color)' }}
                showInfo={false}
              />
            </Card>

            {/* 任务分布图表 */}
            <Card
              title="任务分布"
              extra={
                <Space>
                  <Select
                    value={taskCategoryLevel3}
                    onChange={setTaskCategoryLevel3}
                    style={{ width: 120 }}
                    placeholder="选择三级类目"
                  >
                    {taskCategoryOptions.map(option => (
                      <Option key={option} value={option}>{option}</Option>
                    ))}
                  </Select>
                  <Select
                    value={taskDistributionType}
                    onChange={setTaskDistributionType}
                    style={{ width: 120 }}
                  >
                    <Option value="status">按状态</Option>
                    <Option value="priority">按优先级</Option>
                    <Option value="assignee">按负责人</Option>
                  </Select>
                </Space>
              }
              style={{ marginBottom: 24 }}
            >
              {taskDistributionData.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', height: 300 }}>
                  {/* 左侧标签 - 2/5 */}
                  <div style={{ width: '40%', paddingRight: '10px' }}>
                    {taskDistributionData.map((item, index) => {
                      const total = taskDistributionData.reduce((sum, d) => sum + d.value, 0);
                      const percentage = Math.round((item.value / total) * 100);
                      // 将英文标签转换为中文
                      const getChineseLabel = (type: string) => {
                        const labelMap: { [key: string]: string } = {
                          'todo': '待处理',
                          'in_progress': '进行中',
                          'review': '待审核',
                          'completed': '已完成',
                          'cancelled': '已取消'
                        };
                        return labelMap[type] || type;
                      };
                      return (
                        <div key={item.type} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          marginBottom: '8px',
                          fontSize: '13px'
                        }}>
                          <span style={{ 
                            display: 'inline-block', 
                            width: '10px', 
                            height: '10px', 
                            borderRadius: '50%', 
                            background: `hsl(${index * 60}, 70%, 50%)`,
                            marginRight: '6px',
                            flexShrink: 0
                          }}></span>
                          <span style={{ flex: 1, marginRight: '4px' }}>
                            {taskDistributionType === 'assignee'
                              ? getAssigneeLabel(item.type)
                              : getChineseLabel(item.type)}
                          </span>
                          <span style={{ 
                            fontWeight: 'bold',
                            color: 'var(--text-color-primary)',
                            fontSize: '12px'
                          }}>
                            {item.value} ({percentage}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* 右侧饼图 - 3/5 */}
                  <div style={{ 
                    width: '60%', 
                    height: '200px', 
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <div style={{ 
                      width: '200px', 
                      height: '200px', 
                      borderRadius: '50%', 
                      background: `conic-gradient(${taskDistributionData.map((item, index) => {
                        const total = taskDistributionData.reduce((sum, d) => sum + d.value, 0);
                        const startPercent = taskDistributionData.slice(0, index).reduce((sum, d) => sum + d.value, 0) / total * 100;
                        const endPercent = startPercent + (item.value / total * 100);
                        return `hsl(${index * 60}, 70%, 50%) ${startPercent}% ${endPercent}%`;
                      }).join(', ')})`,
                      position: 'relative'
                    }}>
                      <div style={{ 
                        position: 'absolute', 
                        top: '50%', 
                        left: '50%', 
                        transform: 'translate(-50%, -50%)', 
                        width: '60px', 
                        height: '60px', 
                        borderRadius: '50%', 
                        background: 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: 'var(--text-color-primary)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        <span>总计</span>
                        <span style={{ fontSize: '16px', marginTop: '2px' }}>
                          {taskDistributionData.reduce((sum, d) => sum + d.value, 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-color-tertiary)' }}>
                  暂无数据
                </div>
              )}
            </Card>

                         {/* 任务趋势图表 */}
             <Card 
               title="任务趋势"
               extra={
                 <Space>
                   <Select
                     value={taskTrendCategoryLevel3}
                     onChange={setTaskTrendCategoryLevel3}
                     style={{ width: 120 }}
                     placeholder="选择三级类目"
                   >
                     {taskCategoryOptions.map(option => (
                       <Option key={option} value={option}>{option}</Option>
                     ))}
                   </Select>
                   <Select
                     value={taskTrendPeriod}
                     onChange={setTaskTrendPeriod}
                     style={{ width: 120 }}
                   >
                     <Option value="3">近3天</Option>
                     <Option value="7">近7天</Option>
                     <Option value="15">近15天</Option>
                     <Option value="30">近30天</Option>
                   </Select>
                 </Space>
               }
             >
               {taskTrendData.length > 0 ? (
                 <Line
                   data={taskTrendData}
                   xField="date"
                   yField="value"
                   seriesField="type"
                   smooth
                   point={{
                     size: 4,
                     shape: 'circle'
                   }}
                   xAxis={{
                     tickFormatter: (value: string) => {
                       const date = new Date(value);
                       return `${date.getMonth() + 1}-${date.getDate().toString().padStart(2, '0')}`;
                     }
                   }}
                   yAxis={{
                     min: 1,
                     max: Math.max(...taskTrendData.map(item => item.value), 1),
                     tickCount: 5,
                     tickFormatter: (value: number) => Math.round(value).toString()
                   }}
                   style={{ height: 150 }}
                 />
               ) : (
                 <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-color-tertiary)' }}>
                   暂无数据
                 </div>
               )}
             </Card>
          </Card>
        </Col>
      </Row>

      {/* 权限调试组件 - 已隐藏 */}
    </div>
  )
}

export default DashboardPage