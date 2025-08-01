export const translations = {
  zh: {
    // 通用
    common: {
      dashboard: '仪表盘',
      userManagement: '用户管理',
      teamManagement: '团队管理',
      taskManagement: '任务管理',
      bugManagement: 'Bug管理',
      systemLog: '系统日志',
      systemSettings: '系统设置',
      profile: '个人资料',
      settings: '设置',
      logout: '退出登录',
      welcome: '欢迎',
      search: '搜索',
      add: '添加',
      edit: '编辑',
      delete: '删除',
      confirm: '确定',
      cancel: '取消',
      save: '保存',
      close: '关闭',
      loading: '加载中...',
      success: '成功',
      error: '错误',
      warning: '警告',
      info: '信息',
    },
    // 仪表盘
    dashboard: {
      title: '仪表盘',
      overview: '概览',
      statistics: '统计',
      recentActivities: '最近活动',
      quickActions: '快速操作',
    },
    // 用户管理
    userManagement: {
      title: '用户管理',
      createUser: '创建用户',
      editUser: '编辑用户',
      deleteUser: '删除用户',
      name: '姓名',
      email: '邮箱',
      role: '角色',
      status: '状态',
      lastLogin: '最后登录',
      actions: '操作',
    },
    // 任务管理
    taskManagement: {
      title: '任务管理',
      createTask: '创建任务',
      editTask: '编辑任务',
      deleteTask: '删除任务',
      taskTitle: '标题',
      description: '描述',
      assignee: '负责人',
      priority: '优先级',
      status: '状态',
      dueDate: '截止日期',
      progress: '进度',
    },
    // Bug管理
    bugManagement: {
      title: 'Bug管理',
      createBug: '新建Bug',
      editBug: '编辑Bug',
      deleteBug: '删除Bug',
      bulkImport: '批量导入',
      bugTitle: '标题',
      description: '描述',
      priority: '优先级',
      severity: '严重程度',
      type: '类型',
      status: '状态',
      assignee: '负责人',
      reporter: '报告人',
      createdAt: '创建时间',
      updatedAt: '更新时间',
    },
    // 系统设置
    systemSettings: {
      title: '系统设置',
      themeSettings: '主题设置',
      darkMode: '暗黑模式',
      languageSettings: '多语言设置',
      selectLanguage: '选择语言',
      announcementManagement: '公告管理',
      addAnnouncement: '添加公告',
      editAnnouncement: '编辑公告',
      deleteAnnouncement: '删除公告',
      announcementTitle: '标题',
      content: '内容',
      createdAt: '创建时间',
      actions: '操作',
    },
    // 登录
    login: {
      title: '登录',
      username: '用户名',
      password: '密码',
      login: '登录',
      forgotPassword: '忘记密码？',
      rememberMe: '记住我',
    },
  },
  en: {
    // 通用
    common: {
      dashboard: 'Dashboard',
      userManagement: 'User Management',
      teamManagement: 'Team Management',
      taskManagement: 'Task Management',
      bugManagement: 'Bug Management',
      systemLog: 'System Log',
      systemSettings: 'System Settings',
      profile: 'Profile',
      settings: 'Settings',
      logout: 'Logout',
      welcome: 'Welcome',
      search: 'Search',
      add: 'Add',
      edit: 'Edit',
      delete: 'Delete',
      confirm: 'Confirm',
      cancel: 'Cancel',
      save: 'Save',
      close: 'Close',
      loading: 'Loading...',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Info',
    },
    // 仪表盘
    dashboard: {
      title: 'Dashboard',
      overview: 'Overview',
      statistics: 'Statistics',
      recentActivities: 'Recent Activities',
      quickActions: 'Quick Actions',
    },
    // 用户管理
    userManagement: {
      title: 'User Management',
      createUser: 'Create User',
      editUser: 'Edit User',
      deleteUser: 'Delete User',
      name: 'Name',
      email: 'Email',
      role: 'Role',
      status: 'Status',
      lastLogin: 'Last Login',
      actions: 'Actions',
    },
    // 任务管理
    taskManagement: {
      title: 'Task Management',
      createTask: 'Create Task',
      editTask: 'Edit Task',
      deleteTask: 'Delete Task',
      taskTitle: 'Title',
      description: 'Description',
      assignee: 'Assignee',
      priority: 'Priority',
      status: 'Status',
      dueDate: 'Due Date',
      progress: 'Progress',
    },
    // Bug管理
    bugManagement: {
      title: 'Bug Management',
      createBug: 'Create Bug',
      editBug: 'Edit Bug',
      deleteBug: 'Delete Bug',
      bulkImport: 'Bulk Import',
      bugTitle: 'Title',
      description: 'Description',
      priority: 'Priority',
      severity: 'Severity',
      type: 'Type',
      status: 'Status',
      assignee: 'Assignee',
      reporter: 'Reporter',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
    },
    // 系统设置
    systemSettings: {
      title: 'System Settings',
      themeSettings: 'Theme Settings',
      darkMode: 'Dark Mode',
      languageSettings: 'Language Settings',
      selectLanguage: 'Select Language',
      announcementManagement: 'Announcement Management',
      addAnnouncement: 'Add Announcement',
      editAnnouncement: 'Edit Announcement',
      deleteAnnouncement: 'Delete Announcement',
      announcementTitle: 'Title',
      content: 'Content',
      createdAt: 'Created At',
      actions: 'Actions',
    },
    // 登录
    login: {
      title: 'Login',
      username: 'Username',
      password: 'Password',
      login: 'Login',
      forgotPassword: 'Forgot Password?',
      rememberMe: 'Remember Me',
    },
  },
};

export const getTranslation = (key: string, locale: 'zh' | 'en' = 'zh'): string => {
  const keys = key.split('.');
  let value: any = translations[locale];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // 如果找不到翻译，返回原key
    }
  }
  
  return typeof value === 'string' ? value : key;
}; 