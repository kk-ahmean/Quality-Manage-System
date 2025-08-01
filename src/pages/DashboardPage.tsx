import React, { useEffect, useMemo, useState } from 'react'
import { Row, Col, Card, Statistic, Progress, Typography, Spin, Select } from 'antd'
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

  // 计算Bug统计数据
  const bugStatistics = useMemo(() => {
    // 强制从store获取最新数据
    const currentBugs = useBugStore.getState().bugs
    const bugsToUse = bugs.length > 0 ? bugs : currentBugs
    
    if (!bugsToUse || bugsToUse.length === 0) {
      console.log('Bug统计数据: 无Bug数据')
      return {
        total: 0,
        resolved: 0,
        inProgress: 0,
        unresolved: 0,
        resolutionRate: 0
      }
    }
    
    const total = bugsToUse.length
    const resolved = bugsToUse.filter(bug => bug.status === '已解决' || bug.status === '已关闭').length
    const inProgress = bugsToUse.filter(bug => bug.status === '处理中').length
    const unresolved = total - resolved
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0
    
    console.log('Bug统计数据计算:', {
      total,
      resolved,
      inProgress,
      unresolved,
      resolutionRate,
      bugsStatus: bugsToUse.map(b => b.status)
    })
    
    return { total, resolved, inProgress, unresolved, resolutionRate }
  }, [bugs])

  // 计算任务统计数据
  const taskStatistics = useMemo(() => {
    // 强制从store获取最新数据
    const currentTasks = useTaskStore.getState().tasks
    const tasksToUse = tasks.length > 0 ? tasks : currentTasks
    
    if (!tasksToUse || tasksToUse.length === 0) {
      console.log('任务统计数据: 无任务数据')
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        todo: 0,
        completionRate: 0
      }
    }
    
    const total = tasksToUse.length
    const completed = tasksToUse.filter(task => task.status === 'completed').length
    const inProgress = tasksToUse.filter(task => task.status === 'in_progress').length
    const todo = tasksToUse.filter(task => task.status === 'todo').length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    
    console.log('任务统计数据计算:', {
      total,
      completed,
      inProgress,
      todo,
      completionRate,
      tasksStatus: tasksToUse.map(t => t.status)
    })
    
    return { total, completed, inProgress, todo, completionRate }
  }, [tasks])

  // Bug分布数据
  const bugDistributionData = useMemo(() => {
    // 强制从store获取最新数据
    const currentBugs = useBugStore.getState().bugs
    const bugsToUse = bugs.length > 0 ? bugs : currentBugs
    
    if (!bugsToUse || bugsToUse.length === 0) {
      console.log('Bug分布数据: 无Bug数据')
      return []
    }
    
    let data: Array<{ type: string, value: number }> = []
    switch (bugDistributionType) {
      case 'status':
        const statusMap: Record<string, number> = {}
        bugsToUse.forEach(bug => { statusMap[bug.status] = (statusMap[bug.status] || 0) + 1 })
        data = Object.entries(statusMap).map(([type, value]) => ({ type, value }))
        console.log('Bug状态分布:', statusMap)
        break
      case 'type':
        const typeMap: Record<string, number> = {}
        bugsToUse.forEach(bug => { typeMap[bug.type] = (typeMap[bug.type] || 0) + 1 })
        data = Object.entries(typeMap).map(([type, value]) => ({ type, value }))
        console.log('Bug类型分布:', typeMap)
        break
      case 'responsibility':
        const responsibilityMap: Record<string, number> = {}
        bugsToUse.forEach(bug => { responsibilityMap[bug.responsibility] = (responsibilityMap[bug.responsibility] || 0) + 1 })
        data = Object.entries(responsibilityMap).map(([type, value]) => ({ type, value }))
        console.log('Bug责任归属分布:', responsibilityMap)
        break
      case 'priority':
        const priorityMap: Record<string, number> = {}
        bugsToUse.forEach(bug => { priorityMap[bug.priority] = (priorityMap[bug.priority] || 0) + 1 })
        data = Object.entries(priorityMap).map(([type, value]) => ({ type, value }))
        console.log('Bug优先级分布:', priorityMap)
        break
      default:
        break
    }
    
    const result = data.sort((a, b) => b.value - a.value)
    console.log('Bug分布数据:', { type: bugDistributionType, data: result, bugsCount: bugsToUse.length })
    return result
  }, [bugs, bugDistributionType])

  // Bug趋势数据（按创建日期显示未关闭Bug数）
  const bugTrendData = useMemo(() => {
    if (!bugs || bugs.length === 0) return []
    
    // 按日期统计未关闭Bug数
    const trendMap: Record<string, number> = {}
    bugs.forEach(bug => {
      // 所有状态不为"已关闭"的Bug都算作未关闭Bug
      if (bug.status !== '已关闭') {
        const date = bug.createdAt.slice(0, 10) // 取日期部分 YYYY-MM-DD
        trendMap[date] = (trendMap[date] || 0) + 1
      }
    })
    
    // 根据选择的时间段生成连续的日期序列
    const today = new Date()
    const days = parseInt(bugTrendPeriod)
    const dateArray = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().slice(0, 10)
      dateArray.push(dateStr)
    }
    
    // 填充数据，确保每天都有数据点
    const result = dateArray.map(date => ({
      date,
      value: trendMap[date] || 0,
      type: '未关闭Bug'
    }))
    
    console.log('Bug趋势数据:', { 
      totalBugs: bugs.length, 
      closedBugs: bugs.filter(b => b.status === '已关闭').length,
      trendData: result,
      rawTrendMap: trendMap,
      period: bugTrendPeriod
    })
    
    return result
  }, [bugs, bugTrendPeriod])

  // 任务分布数据
  const taskDistributionData = useMemo(() => {
    if (!tasks || tasks.length === 0) return []
    
    let data: Array<{ type: string, value: number }> = []
    switch (taskDistributionType) {
      case 'status':
        const statusMap: Record<string, number> = {}
        tasks.forEach(task => { statusMap[task.status] = (statusMap[task.status] || 0) + 1 })
        data = Object.entries(statusMap).map(([type, value]) => ({ type, value }))
        break
      case 'priority':
        const priorityMap: Record<string, number> = {}
        tasks.forEach(task => { priorityMap[task.priority] = (priorityMap[task.priority] || 0) + 1 })
        data = Object.entries(priorityMap).map(([type, value]) => ({ type, value }))
        break
      case 'assignee':
        const assigneeMap: Record<string, number> = {}
        tasks.forEach(task => {
          const name = task.assigneeName || task.assignee || '未分配'
          assigneeMap[name] = (assigneeMap[name] || 0) + 1
        })
        data = Object.entries(assigneeMap).map(([type, value]) => ({ type, value }))
        break
      default:
        break
    }
    
    const result = data.sort((a, b) => b.value - a.value)
    console.log('任务分布数据:', { type: taskDistributionType, data: result, tasksCount: tasks.length })
    return result
  }, [tasks, taskDistributionType])

  // 任务趋势数据（按创建日期显示未完成任务数）
  const taskTrendData = useMemo(() => {
    if (!tasks || tasks.length === 0) return []
    
    // 按日期统计未完成任务数
    const trendMap: Record<string, number> = {}
    tasks.forEach(task => {
      if (task.status !== 'completed') {
        const date = task.createdAt.slice(0, 10) // 取日期部分 YYYY-MM-DD
        trendMap[date] = (trendMap[date] || 0) + 1
      }
    })
    
    // 根据选择的时间段生成连续的日期序列
    const today = new Date()
    const days = parseInt(taskTrendPeriod)
    const dateArray = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().slice(0, 10)
      dateArray.push(dateStr)
    }
    
    // 填充数据，确保每天都有数据点
    const result = dateArray.map(date => ({
      date,
      value: trendMap[date] || 0,
      type: '未完成任务'
    }))
    
    console.log('任务趋势数据:', { 
      totalTasks: tasks.length, 
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      trendData: result,
      rawTrendMap: trendMap,
      period: taskTrendPeriod
    })
    
    return result
  }, [tasks, taskTrendPeriod])

  // 自动刷新数据
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('开始加载数据...')
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
          console.log('数据加载完成:', {
            bugsCount: currentBugs.length,
            tasksCount: currentTasks.length,
            bugStats,
            taskStats,
            bugs: currentBugs.slice(0, 3), // 显示前3个Bug用于调试
            tasks: currentTasks.slice(0, 3) // 显示前3个任务用于调试
          })
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
                <Select
                  value={taskDistributionType}
                  onChange={setTaskDistributionType}
                  style={{ width: 120 }}
                >
                  <Option value="status">按状态</Option>
                  <Option value="priority">按优先级</Option>
                  <Option value="assignee">按负责人</Option>
                </Select>
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
                          <span style={{ flex: 1, marginRight: '4px' }}>{getChineseLabel(item.type)}</span>
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
    </div>
  )
}

export default DashboardPage