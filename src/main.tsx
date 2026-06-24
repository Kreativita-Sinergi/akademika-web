import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, App as AntApp } from 'antd';
import idID from 'antd/locale/id_ID';
import 'dayjs/locale/id';
import './index.css';
import App from './App';

// Tema global Ant Design (primary mengikuti brand Akademika #4263eb) + locale Indonesia.
const theme = {
  token: {
    colorPrimary: '#4263eb',
    borderRadius: 10,
    fontFamily: 'inherit',
  },
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider theme={theme} locale={idID}>
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  </StrictMode>,
);
