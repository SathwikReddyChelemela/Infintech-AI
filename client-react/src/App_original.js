import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Box } from '@mui/material';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import HomePage from './components/HomePage';
import Dashboard from './components/Dashboard';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAuthenticated(true);
      setShowLanding(false); // Skip landing if already logged in
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setShowLanding(false);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setShowLanding(true); // Return to landing page after logout
    localStorage.removeItem('user');
  };

  const handleNavigateToLogin = () => {
    setShowLanding(false);
  };

  const handleBackToLanding = () => {
    setShowLanding(true);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                <Navigate to="/home" replace />
              ) : showLanding ? (
                <LandingPage onNavigateToLogin={handleNavigateToLogin} />
              ) : (
                <Container maxWidth="lg">
                  <Box sx={{ my: 4 }}>
                    <Auth onLogin={handleLogin} onBackToLanding={handleBackToLanding} />
                  </Box>
                </Container>
              )
            } 
          />
          <Route 
            path="/login" 
            element={
              isAuthenticated ? (
                <Navigate to="/home" replace />
              ) : (
                <Container maxWidth="lg">
                  <Box sx={{ my: 4 }}>
                    <Auth onLogin={handleLogin} onBackToLanding={handleBackToLanding} />
                  </Box>
                </Container>
              )
            } 
          />
          <Route 
            path="/home" 
            element={
              isAuthenticated ? (
                <HomePage user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? (
                <Dashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />

        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
