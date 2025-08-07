// API配置
interface ApiConfig {
  baseURL: string;
  timeout: number;
}

// 获取当前环境
const getEnvironment = (): string => {
  return import.meta.env.MODE || 'development';
};

// 根据环境返回不同的配置
export const getApiConfig = (): ApiConfig => {
  const env = getEnvironment();
  
  switch (env) {
    case 'production':
      return {
        baseURL: 'https://your-production-api.com/api',
        timeout: 15000
      };
    
    case 'development':
    default:
      // 开发环境：根据当前访问地址动态选择API地址
      const currentHost = window.location.hostname;
      const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';
      
      if (isLocalhost) {
        // 本地访问使用localhost
        return {
          baseURL: 'http://localhost:5001/api',
          timeout: 10000
        };
      } else {
        // 局域网访问使用IP地址
        return {
          baseURL: `http://${currentHost}:5001/api`,
          timeout: 10000
        };
      }
  }
};

// 导出当前配置
export const apiConfig = getApiConfig();

// 导出环境信息
export const isDevelopment = getEnvironment() === 'development';
export const isProduction = getEnvironment() === 'production'; 