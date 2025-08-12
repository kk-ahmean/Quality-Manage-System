import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '../types/user'
import { authAPI, userAPI } from '../services/api'

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
  login: (name: string, password: string) => Promise<void>
  logout: () => void
  clearError: () => void
  setLoading: (loading: boolean) => void
  updateUserPassword: (name: string, newPassword: string) => void
  logSystemActivity: (userId: string, action: string, description: string) => void
}

type AuthStore = AuthState & AuthActions

// 全局用户数据存储
let globalUsers: User[] = [
  {
    id: '1',
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
export const updateUserPassword = (name: string, newPassword: string) => {
  const user = globalUsers.find(u => u.name === name)
  if (user) {
    user.password = newPassword
    // 记录密码重置日志
    logSystemActivity(user.id, 'PASSWORD_RESET', `用户重置密码`)
  }
}

// 全局日志记录函数
export const logSystemActivity = (userId: string, action: string, description: string) => {
  // 使用 fire and forget 方式，不阻塞主流程
  (async () => {
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
      
      // 将日志添加到全局日志存储中（前端内存）
      if (!window.systemLogs) {
        window.systemLogs = []
      }
      window.systemLogs.unshift(newLog)
      
      console.log('系统日志记录:', newLog)
      
      // 同时保存到后端数据库
      try {
        await userAPI.logUserActivity(userId, {
          action,
          description,
          resourceType: 'system',
          resourceId: userId,
          severity: 'low',
          status: 'success'
        })
        console.log('系统日志已保存到数据库')
      } catch (dbError) {
        console.error('保存系统日志到数据库失败:', dbError)
        // 数据库保存失败不影响前端功能，只记录错误
      }
    } catch (error) {
      console.error('记录系统活动失败:', error)
    }
  })()
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (name: string, password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          // 调用真实API
          const response = await authAPI.login({ name, password })
          
          // 检查响应结构
          if (response.data && response.data.success) {
            const { user, token } = response.data.data
            
            // 保存token到localStorage
            localStorage.setItem('auth-token', token)
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })
            
            // 记录登录日志
            console.log(`用户 ${user.name} 登录成功，时间: ${new Date().toLocaleString()}`)
            logSystemActivity(user.id, 'LOGIN', `用户登录系统`)
          } else {
            throw new Error(response.data?.message || '登录失败')
          }
          
        } catch (error: any) {
          console.error('登录错误:', error)
          set({
            isLoading: false,
            error: error.response?.data?.message || error.message || '登录失败'
          })
        }
      },

      logout: () => {
        const { user } = get()
        if (user) {
          console.log(`用户 ${user.name} 退出登录，时间: ${new Date().toLocaleString()}`)
          logSystemActivity(user.id, 'LOGOUT', `用户退出登录`)
        }
        
        // 清除localStorage中的token
        localStorage.removeItem('auth-token')
        
        // 清除所有可能的认证相关存储
        sessionStorage.clear()
        
        // 清除Zustand持久化存储
        localStorage.removeItem('auth-storage')
        
        // 重置状态
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
          isLoading: false
        })
      },

      clearError: () => {
        set({ error: null })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      updateUserPassword: (name: string, newPassword: string) => {
        const user = globalUsers.find(u => u.name === name)
        if (user) {
          user.password = newPassword
          // 记录密码重置日志
          logSystemActivity(user.id, 'PASSWORD_RESET', `用户重置密码`)
        }
      },

      logSystemActivity: (userId: string, action: string, description: string) => {
        // 使用 fire and forget 方式，不阻塞主流程
        (async () => {
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
            
            // 将日志添加到全局日志存储中（前端内存）
            if (!window.systemLogs) {
              window.systemLogs = []
            }
            window.systemLogs.unshift(newLog)
            
            console.log('系统日志记录:', newLog)
            
            // 同时保存到后端数据库
            try {
              await userAPI.logUserActivity(userId, {
                action,
                description,
                resourceType: 'system',
                resourceId: userId,
                severity: 'low',
                status: 'success'
              })
              console.log('系统日志已保存到数据库')
            } catch (dbError) {
              console.error('保存系统日志到数据库失败:', dbError)
              // 数据库保存失败不影响前端功能，只记录错误
            }
          } catch (error) {
            console.error('记录系统活动失败:', error)
          }
        })()
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
          const fullUser = globalUsers.find(u => u.name === state.user?.name)
          if (fullUser) {
            state.user = fullUser
          }
        }
      }
    }
  )
) 