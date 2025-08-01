import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CommonFeaturesPage from '../CommonFeaturesPage'
import { vi } from 'vitest'

// mock fetch for notification, comment, export
beforeAll(() => {
  vi.spyOn(global, 'fetch').mockImplementation((input, init) => {
    if (typeof input === 'string') {
      if (input.includes('/api/notifications/send')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) }) as any
      }
      if (input.includes('/api/comments/list')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) }) as any
      }
      if (input.includes('/api/comments/add')) {
        return Promise.resolve({ ok: true }) as any
      }
      if (input.includes('/api/export')) {
        return Promise.resolve({ ok: true, blob: () => Promise.resolve(new Blob(['test'], { type: 'application/vnd.ms-excel' })) }) as any
      }
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) }) as any
  })
})

afterAll(() => {
  vi.restoreAllMocks()
})

describe('CommonFeaturesPage', () => {
  it('should render all feature cards', () => {
    render(<CommonFeaturesPage />)
    expect(screen.getByText('文件上传')).toBeInTheDocument()
    expect(screen.getByText('通知系统')).toBeInTheDocument()
    expect(screen.getByText('评论功能')).toBeInTheDocument()
    expect(screen.getByText('数据导出')).toBeInTheDocument()
  })

  it('should allow sending notification', async () => {
    render(<CommonFeaturesPage />)
    fireEvent.change(screen.getByPlaceholderText('用户名/邮箱/ID'), { target: { value: 'testuser' } })
    fireEvent.change(screen.getByPlaceholderText('请输入通知内容'), { target: { value: 'hello' } })
    fireEvent.mouseDown(screen.getAllByText('请选择')[0]) // 通知类型下拉
    fireEvent.click(screen.getByText('系统通知'))
    fireEvent.click(screen.getByText('发送通知'))
    await waitFor(() => expect(screen.getByText('发送日志')).toBeInTheDocument())
  })

  it('should allow posting comment', async () => {
    render(<CommonFeaturesPage />)
    fireEvent.change(screen.getByPlaceholderText('请输入评论内容'), { target: { value: 'test comment' } })
    fireEvent.click(screen.getByText('发布评论'))
    await waitFor(() => expect(screen.getByText('评论列表')).toBeInTheDocument())
  })

  it('should allow data export', async () => {
    render(<CommonFeaturesPage />)
    fireEvent.mouseDown(screen.getAllByText('请选择')[1]) // 导出类型下拉
    fireEvent.click(screen.getByText('Bug报表'))
    fireEvent.click(screen.getByText('导出'))
    await waitFor(() => expect(screen.getByText('支持导出Bug、任务等数据，导出后自动下载Excel文件。')).toBeInTheDocument())
  })
}) 