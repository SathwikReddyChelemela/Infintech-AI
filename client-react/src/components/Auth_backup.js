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
  IconButton
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
    role: 'customer' 
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
        
        // Store JWT token in localStorage
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
      const response = await axios.post(`${API_URL}/signup`, signupData);

      if (response.status === 200) {
        setSuccess('Signup successful! You can now login.');
        setSignupData({ username: '', password: '', role: 'analyst' });
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed');
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Card sx={{ minWidth: 400, maxWidth: 500 }}>
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
            Financial RBAC RAG
          </Typography>
          <Typography variant="h6" component="h2" gutterBottom align="center">
            Login or Signup
          </Typography>

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
            <Box>
              <TextField
                fullWidth
                label="New Username"
                value={signupData.username}
                onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={signupData.password}
                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Choose Role</InputLabel>
                <Select
                  value={signupData.role}
                  label="Choose Role"
                  onChange={(e) => setSignupData({ ...signupData, role: e.target.value })}
                >
                  <MenuItem value="customer">Customer</MenuItem>
                  <MenuItem value="analyst">Analyst</MenuItem>
                  <MenuItem value="underwriter">Underwriter</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="auditor">Auditor</MenuItem>
                </Select>
              </FormControl>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSignup}
                sx={{ mt: 2 }}
              >
                Signup
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default Auth;
