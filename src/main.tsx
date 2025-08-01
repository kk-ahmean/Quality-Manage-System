import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN.js'
import enUS from 'antd/locale/en_US.js'
import App from './App.tsx'
import './index.css'
import './styles/darkMode.css'

// 创建语言上下文
const LanguageContext = React.createContext<{
  locale: 'zh' | 'en';
  setLocale: (locale: 'zh' | 'en') => void;
}>({
  locale: 'zh',
  setLocale: () => {},
});

const AppWrapper: React.FC = () => {
  const [locale, setLocale] = React.useState<'zh' | 'en'>('zh');

  const antdLocale = locale === 'zh' ? zhCN : enUS;

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      <ConfigProvider locale={antdLocale}>
        <App />
      </ConfigProvider>
    </LanguageContext.Provider>
  );
};

// 导出语言上下文供其他组件使用
export { LanguageContext };

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <AppWrapper />
    </HashRouter>
  </React.StrictMode>,
) 