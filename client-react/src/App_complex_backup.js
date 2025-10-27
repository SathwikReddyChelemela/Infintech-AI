import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Box,
  Alert
} from '@mui/material';
import axios from 'axios';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8000/auth/login', {
        email: email,
        password: password
      });

      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        setIsLoggedIn(true);
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
  };

  if (isLoggedIn && user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">
            Welcome {user.username}!
          </Typography>
          <Button variant="outlined" onClick={handleLogout}>
            Logout
          </Button>
        </Box>
        
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            Role: {user.role}
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            Email: {user.email}
          </Typography>

          {user.role === 'analyst' && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Analyst Features:
              </Typography>
              <Typography variant="body2">
                • Review customer applications
              </Typography>
              <Typography variant="body2">
                • Analyze financial data
              </Typography>
              <Typography variant="body2">
                • Generate reports
              </Typography>
            </Box>
          )}

          {user.role === 'admin' && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Admin Features:
              </Typography>
              <Typography variant="body2">
                • Manage users
              </Typography>
              <Typography variant="body2">
                • System administration
              </Typography>
              <Typography variant="body2">
                • Upload documents
              </Typography>
            </Box>
          )}

          {user.role === 'customer' && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Customer Features:
              </Typography>
              <Typography variant="body2">
                • Submit applications
              </Typography>
              <Typography variant="body2">
                • View application status
              </Typography>
              <Typography variant="body2">
                • Upload documents
              </Typography>
            </Box>
          )}

          {user.role === 'underwriter' && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Underwriter Features:
              </Typography>
              <Typography variant="body2">
                • Review applications
              </Typography>
              <Typography variant="body2">
                • Risk assessment
              </Typography>
              <Typography variant="body2">
                • Approval decisions
              </Typography>
            </Box>
          )}
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          RBAC Medical Assistant
        </Typography>
        
        <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 3 }}>
          Please Login
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            Test Accounts:
          </Typography>
          <Typography variant="caption" display="block" align="center">
            analyst@company.com / analyst123
          </Typography>
          <Typography variant="caption" display="block" align="center">
            admin@company.com / admin123
          </Typography>
          <Typography variant="caption" display="block" align="center">
            customer@company.com / customer123
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default App;
