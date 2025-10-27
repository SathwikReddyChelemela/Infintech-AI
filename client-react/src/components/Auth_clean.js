import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import axios from 'axios';

function Auth({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
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
        onLogin(response.data.user);
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          RBAC System Login
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
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
            {loading ? <CircularProgress size={24} /> : 'Login'}
          </Button>
        </form>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            Test Accounts:
          </Typography>
          <Typography variant="caption" display="block" align="center">
            admin@company.com / admin123
          </Typography>
          <Typography variant="caption" display="block" align="center">
            analyst@company.com / analyst123
          </Typography>
          <Typography variant="caption" display="block" align="center">
            customer@company.com / customer123
          </Typography>
          <Typography variant="caption" display="block" align="center">
            underwriter@company.com / underwriter123
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

// Footer
import Box from '@mui/material/Box';

const Footer = () => (
  <Box sx={{ mt: 8, py: 2, bgcolor: 'background.paper', textAlign: 'center', color: 'text.secondary', fontSize: 14 }}>
    All rights reserved to Sathwik Reddy Chelemela
  </Box>
);

// ...existing code...

// Add Footer at the end of the main render
// ...existing code...
  <Footer />
// ...existing code...

export default Auth;
