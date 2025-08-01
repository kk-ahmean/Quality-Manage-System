import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '../types/user'

// 扩展Window接口以包含systemLogs属性
declare global {
  interface Window {
    systemLogs?: Array<{
      id: string;
      userId: string;
      action: string;
      description: string;
      ipAddress: string;
      userAgent: string;
      createdAt: string;
    }>;
  }
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  clearError: () => void
  setLoading: (loading: boolean) => void
  updateUserPassword: (username: string, newPassword: string) => void
  logSystemActivity: (userId: string, action: string, description: string) => void
}

type AuthStore = AuthState & AuthActions

// 全局用户数据存储
let globalUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    name: '系统管理员',
    status: 'active',
    password: '123456',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    username: 'developer',
    email: 'developer@example.com',
    role: 'developer',
    name: '开发工程师',
    status: 'active',
    password: '123456',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  },
  {
    id: '3',
    username: 'tester',
    email: 'tester@example.com',
    role: 'tester',
    name: '测试工程师',
    status: 'active',
    password: '123456',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z'
  }
]

// 添加用户到全局存储
export const addUserToGlobalStore = (user: User) => {
  globalUsers.push(user)
}

// 获取所有用户
export const getAllUsers = () => {
  return globalUsers
}

// 更新用户密码
export const updateUserPassword = (username: string, newPassword: string) => {
  const user = globalUsers.find(u => u.username === username)
  if (user) {
    user.password = newPassword
  }
}

// 全局日志记录函数
export const logSystemActivity = (userId: string, action: string, description: string) => {
  try {
    const newLog = {
      id: Date.now().toString(),
      userId,
      action,
      description,
      ipAddress: '192.168.1.100', // 模拟IP地址
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      createdAt: new Date().toISOString()
    }
    
    // 将日志添加到全局日志存储中
    if (!window.systemLogs) {
      window.systemLogs = []
    }
    window.systemLogs.unshift(newLog)
    
    console.log('系统日志记录:', newLog)
  } catch (error) {
    console.error('记录系统活动失败:', error)
  }
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          // 模拟API调用延迟
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // 从全局用户数据中查找用户
          const user = globalUsers.find(u => u.username === username)
          
          // 调试信息
          console.log('登录尝试:', {
            username,
            password,
            foundUser: user,
            allUsers: globalUsers.map(u => ({ username: u.username, hasPassword: !!u.password }))
          })
          
          if (!user) {
            throw new Error('用户名或密码错误')
          }
          
          // 验证用户密码
          if (user.password !== password) {
            console.log('密码验证失败:', {
              expected: user.password,
              provided: password
            })
            throw new Error('用户名或密码错误')
          }
          
          if (user.status === 'inactive') {
            throw new Error('账户已被禁用，请联系管理员')
          }
          
          const token = `mock_token_${user.id}_${Date.now()}`
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
          
          // 记录登录日志
          console.log(`用户 ${user.username} 登录成功，时间: ${new Date().toLocaleString()}`)
          logSystemActivity(user.id, 'LOGIN', `用户登录系统`)
          
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : '登录失败'
          })
        }
      },

      logout: () => {
        const { user } = get()
        if (user) {
          console.log(`用户 ${user.username} 退出登录，时间: ${new Date().toLocaleString()}`)
          logSystemActivity(user.id, 'LOGOUT', `用户退出登录`)
        }
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        })
      },

      clearError: () => {
        set({ error: null })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      updateUserPassword: (username: string, newPassword: string) => {
        const user = globalUsers.find(u => u.username === username)
        if (user) {
          user.password = newPassword
          // 记录密码重置日志
          logSystemActivity(user.id, 'PASSWORD_RESET', `用户重置密码`)
        }
      },

      logSystemActivity: (userId: string, action: string, description: string) => {
        try {
          const newLog = {
            id: Date.now().toString(),
            userId,
            action,
            description,
            ipAddress: '192.168.1.100', // 模拟IP地址
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            createdAt: new Date().toISOString()
          }
          
          // 将日志添加到全局日志存储中
          if (!window.systemLogs) {
            window.systemLogs = []
          }
          window.systemLogs.unshift(newLog)
          
          console.log('系统日志记录:', newLog)
        } catch (error) {
          console.error('记录系统活动失败:', error)
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
      // 确保从存储中恢复时包含完整信息
      onRehydrateStorage: () => (state) => {
        if (state && state.user) {
          // 从全局用户数据中恢复完整的用户信息
          const fullUser = globalUsers.find(u => u.username === state.user?.username)
          if (fullUser) {
            state.user = fullUser
          }
        }
      }
    }
  )
) 