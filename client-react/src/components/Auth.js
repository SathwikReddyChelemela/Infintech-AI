import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Grow
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import axios from 'axios';

const API_URL = '/auth';

function Auth({ onLogin, onBackToLanding }) {
  const [tabValue, setTabValue] = useState(0);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [signupData, setSignupData] = useState({ 
    username: '', 
    password: '', 
    role: 'customer',
    security_code: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
    setSuccess('');
  };

  const handleLogin = async () => {
    try {
      setError('');
      const formData = new FormData();
      formData.append('username', loginData.username);
      formData.append('password', loginData.password);

      const response = await axios.post(`${API_URL}/login`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        const { access_token, user } = response.data;
        localStorage.setItem('token', access_token);
        const userData = {
          username: user.username,
          role: user.role,
          token: access_token
        };
        onLogin(userData);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  const handleSignup = async () => {
    try {
      setError('');
      setSuccess('');
      if (signupData.role === 'admin' && signupData.security_code.trim() !== '0345') {
        setError('Invalid admin security code');
        return;
      }

      const response = await axios.post(`${API_URL}/signup`, signupData);

      if (response.status === 200) {
        setSuccess('Signup successful! You can now login.');
        setSignupData({ username: '', password: '', role: 'analyst', security_code: '' });
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed');
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', px: 2 }}>
      <Card sx={{
        minWidth: 400,
        maxWidth: 500,
        width: '100%',
        transition: 'transform 300ms ease, box-shadow 300ms ease, background 300ms ease',
        ...(tabValue === 1 ? {
          // Glass effect only for signup view; uses translucent white so theme colors remain intact
          background: 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.35)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
        } : {})
      }}>
        <CardContent>
          {onBackToLanding && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <IconButton onClick={onBackToLanding} sx={{ mr: 1 }}>
                <ArrowBack />
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                Back to Landing Page
              </Typography>
            </Box>
          )}

          <Typography variant="h4" component="h1" gutterBottom align="center">
            infintech AI
          </Typography>
          {/* Removed the extra subtitle to keep signup page clean */}

          <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 3 }}>
            <Tab label="Login" />
            <Tab label="Signup" />
          </Tabs>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {tabValue === 0 && (
            <Box>
              <TextField
                fullWidth
                label="Username"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                margin="normal"
              />
              <Button
                fullWidth
                variant="contained"
                onClick={handleLogin}
                sx={{ mt: 2 }}
              >
                Login
              </Button>
            </Box>
          )}

          {tabValue === 1 && (
            <Grow in timeout={500}>
              <Box>
                <TextField
                  fullWidth
                  label="New Username"
                  value={signupData.username}
                  onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                  margin="normal"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      backdropFilter: 'blur(6px)',
                      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                      '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
                      '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(25,118,210,0.15)' }
                    }
                  }}
                />
                <TextField
                  fullWidth
                  label="New Password"
                  type="password"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  margin="normal"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      backdropFilter: 'blur(6px)',
                      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                      '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
                      '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(25,118,210,0.15)' }
                    }
                  }}
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Choose Role</InputLabel>
                  <Select
                    value={signupData.role}
                    label="Choose Role"
                    onChange={(e) => setSignupData({ ...signupData, role: e.target.value })}
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      backdropFilter: 'blur(6px)'
                    }}
                  >
                    <MenuItem value="customer">Customer</MenuItem>
                    <MenuItem value="analyst">Analyst</MenuItem>
                    <MenuItem value="underwriter">Underwriter</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="auditor">Auditor</MenuItem>
                  </Select>
                </FormControl>
                {signupData.role === 'admin' && (
                  <TextField
                    fullWidth
                    label="Security Code"
                    type="password"
                    value={signupData.security_code}
                    onChange={(e) => setSignupData({ ...signupData, security_code: e.target.value })}
                    margin="normal"
                    helperText="Required for Admin signups"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        backdropFilter: 'blur(6px)'
                      }
                    }}
                  />
                )}
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSignup}
                  sx={{
                    mt: 2,
                    py: 1.2,
                    borderRadius: 2,
                    textTransform: 'none',
                    boxShadow: '0 8px 20px rgba(25,118,210,0.20)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 26px rgba(25,118,210,0.28)'
                    }
                  }}
                >
                  Signup
                </Button>
              </Box>
            </Grow>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default Auth;
