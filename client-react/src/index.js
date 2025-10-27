import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import axios from 'axios';
import { ThemeProvider, createTheme, CssBaseline, GlobalStyles } from '@mui/material';

// Prefer direct API calls with an auto-detected baseURL instead of relying on CRA proxy
// Prefer explicit backend URL from env in production (e.g., Render)
const envApi = process.env.REACT_APP_API_BASE_URL;
const apiCandidates = [
  envApi,
  'http://127.0.0.1:8001',
  'http://127.0.0.1:8000',
  'http://localhost:8001',
  'http://localhost:8000'
].filter(Boolean);

const savedApiBase = typeof localStorage !== 'undefined' ? localStorage.getItem('apiBase') : null;
if (envApi) {
  axios.defaults.baseURL = envApi;
  try { localStorage.setItem('apiBase', envApi); } catch {}
} else if (savedApiBase) {
  axios.defaults.baseURL = savedApiBase;
} else if (apiCandidates.length) {
  axios.defaults.baseURL = apiCandidates[0];
}

async function probeAndSetApiBase() {
  for (const url of apiCandidates) {
    try {
      const res = await fetch(`${url}/health`, { method: 'GET' });
      if (res.ok) {
        axios.defaults.baseURL = url;
        try { localStorage.setItem('apiBase', url); } catch {}
        break;
      }
    } catch {
      // try next
    }
  }
}

// Fire and forget probe; initial requests will use saved/default and will also auto-retry on failure below
probeAndSetApiBase();

// Configure axios to automatically add JWT token to all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle network errors with one-time retry on alternate API base; and handle token expiration
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    // One-shot retry on network error by switching to a working API base
    if (!error.response && !config._retried) {
      const current = axios.defaults.baseURL || '';
      const startIdx = Math.max(0, apiCandidates.indexOf(current));
      for (let i = 1; i <= apiCandidates.length; i++) {
        const next = apiCandidates[(startIdx + i) % apiCandidates.length];
        try {
          const ok = await fetch(`${next}/health`, { method: 'GET' }).then(r => r.ok).catch(() => false);
          if (ok) {
            axios.defaults.baseURL = next;
            try { localStorage.setItem('apiBase', next); } catch {}
            config._retried = true;
            config.baseURL = next;
            return axios(config);
          }
        } catch {
          // try next
        }
      }
    }

    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage and reload
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0ea5e9' },
    secondary: { main: '#8b5cf6' },
    success: { main: '#22c55e' },
    warning: { main: '#f59e0b' },
    error: { main: '#ef4444' },
    info: { main: '#06b6d4' }
  },
  shape: { borderRadius: 12 },
  typography: {
  fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    h4: { fontWeight: 800 },
    h6: { fontWeight: 700 }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 10px 24px rgba(0,0,0,0.10)'
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          '&:hover': {
            transform: 'translateY(-1px)'
          }
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'transform 0.15s ease',
          '&:hover': { transform: 'scale(1.06)' }
        }
      }
    }
  }
});

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={{
        body: {
          background: 'radial-gradient(1200px 600px at 10% 0%, #f0f9ff 0%, #ffffff 60%)'
        }
      }} />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
