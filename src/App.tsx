import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import UserManagementPage from './pages/UserManagementPage'
import TeamManagementPage from './pages/TeamManagementPage'
import TaskManagementPage from './pages/TaskManagementPage'
import BugManagementPage from './pages/BugManagementPage'
import ProjectManagementPage from './pages/ProjectManagementPage'
import CommonFeaturesPage from './pages/CommonFeaturesPage'
import Layout from './components/Layout'
import SystemLogPage from './pages/SystemLogPage'
import SystemSettingsPage from './pages/SystemSettingsPage'
import TestPage from './pages/TestPage'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/dashboard"
        element={isAuthenticated ? <Layout><DashboardPage /></Layout> : <Navigate to="/login" replace />}
      />
      <Route
        path="/users/list"
        element={isAuthenticated ? <Layout><UserManagementPage /></Layout> : <Navigate to="/login" replace />}
      />
      <Route
        path="/users/teams"
        element={isAuthenticated ? <Layout><TeamManagementPage /></Layout> : <Navigate to="/login" replace />}
      />
      <Route
        path="/tasks"
        element={isAuthenticated ? <Layout><TaskManagementPage /></Layout> : <Navigate to="/login" replace />}
      />
      <Route
        path="/bugs"
        element={isAuthenticated ? <Layout><BugManagementPage /></Layout> : <Navigate to="/login" replace />}
      />
      <Route
        path="/projects"
        element={isAuthenticated ? <Layout><ProjectManagementPage /></Layout> : <Navigate to="/login" replace />}
      />
      <Route
        path="/common"
        element={<CommonFeaturesPage />}
      />
      <Route
        path="/system-logs"
        element={isAuthenticated ? <Layout><SystemLogPage /></Layout> : <Navigate to="/login" replace />}
      />
      <Route
        path="/settings"
        element={isAuthenticated ? <Layout><SystemSettingsPage /></Layout> : <Navigate to="/login" replace />}
      />
      <Route
        path="/profile"
        element={isAuthenticated ? <Layout><UserProfilePage /></Layout> : <Navigate to="/login" replace />}
      />
      <Route
        path="/test"
        element={isAuthenticated ? <Layout><TestPage /></Layout> : <Navigate to="/login" replace />}
      />
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  )
}

// 简单的个人资料页面组件
const UserProfilePage: React.FC = () => {
  const { user } = useAuthStore()
  
  return (
    <div>
      <h2>个人资料</h2>
      <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <p><strong>用户名：</strong>{user?.name}</p>
        <p><strong>角色：</strong>{user?.role}</p>
        <p><strong>邮箱：</strong>{user?.email || '未设置'}</p>
        <p><strong>用户ID：</strong>{user?.id}</p>
      </div>
    </div>
  )
}

export default App 