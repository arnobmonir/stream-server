import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { NotificationProvider } from './NotificationProvider';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </ThemeProvider>
  </React.StrictMode>
);
