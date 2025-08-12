import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN.js'
import { vi } from 'vitest'
import LoginPage from '../LoginPage'
import { useAuthStore } from '../../stores/authStore'

// Mock the auth store
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn()
}))

const mockUseAuthStore = vi.mocked(useAuthStore)

// 兼容AntD响应式组件在JSDOM下的测试
beforeAll(() => {
  window.matchMedia = window.matchMedia || function(query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    }
  }
})

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <ConfigProvider locale={zhCN}>
        <LoginPage />
      </ConfigProvider>
    </BrowserRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    mockUseAuthStore.mockReturnValue({
      login: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      setLoading: vi.fn(),
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('renders login form', () => {
    renderLoginPage()
    
    expect(screen.getByText('品质管理系统')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入用户名')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入密码')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /登.?录/ })).toBeInTheDocument()
  })

  test('shows error message when login fails', () => {
    const mockLogin = vi.fn().mockRejectedValue(new Error('用户名或密码错误'))
    
    mockUseAuthStore.mockReturnValue({
      login: mockLogin,
      logout: vi.fn(),
      clearError: vi.fn(),
      setLoading: vi.fn(),
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: '用户名或密码错误'
    })

    renderLoginPage()
    
    expect(screen.getByText('用户名或密码错误')).toBeInTheDocument()
  })

  test('calls login function with form data', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined)
    
    mockUseAuthStore.mockReturnValue({
      login: mockLogin,
      logout: vi.fn(),
      clearError: vi.fn(),
      setLoading: vi.fn(),
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    })

    renderLoginPage()
    
    const nameInput = screen.getByPlaceholderText('请输入用户名')
    const passwordInput = screen.getByPlaceholderText('请输入密码')
    const loginButton = screen.getByRole('button', { name: /登.?录/ })

    fireEvent.change(nameInput, { target: { value: 'admin' } })
    fireEvent.change(passwordInput, { target: { value: '123456' } })
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', '123456')
    })
  })

  test('shows loading state during login', () => {
    mockUseAuthStore.mockReturnValue({
      login: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      setLoading: vi.fn(),
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      error: null
    })

    renderLoginPage()
    
    expect(screen.getByRole('button', { name: /登录中/ })).toBeInTheDocument()
  })

  test('validates required fields', async () => {
    renderLoginPage()
    
    const loginButton = screen.getByRole('button', { name: /登.?录/ })
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText('请输入用户名！')).toBeInTheDocument()
      expect(screen.getByText('请输入密码！')).toBeInTheDocument()
    })
  })

  test('displays demo accounts', () => {
    renderLoginPage()
    
    expect(screen.getByText('演示账户：')).toBeInTheDocument()
    expect(screen.getByText('admin / 123456')).toBeInTheDocument()
    expect(screen.getByText('developer / 123456')).toBeInTheDocument()
    expect(screen.getByText('tester / 123456')).toBeInTheDocument()
  })
}) 