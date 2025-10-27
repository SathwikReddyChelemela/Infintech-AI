import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Auth from './components/Auth';
import Box from '@mui/material/Box';
import WelcomePage from './components/WelcomePage';
import CustomerHomePage from './components/CustomerHomePage';
import AnalystHomePage from './components/AnalystHomePage';
import UnderwriterHomePage from './components/UnderwriterHomePage';
import AdminHomePage from './components/AdminHomePage';
import AuditorHomePage from './components/AuditorHomePage';


function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Render role-specific homepage
  const renderHomePage = () => {
    if (!user || !user.role) return null;

    switch (user.role.toLowerCase()) {
      case 'customer':
        return <CustomerHomePage user={user} onLogout={handleLogout} />;
      case 'analyst':
        return <AnalystHomePage user={user} onLogout={handleLogout} />;
      case 'underwriter':
        return <UnderwriterHomePage user={user} onLogout={handleLogout} />;
      case 'admin':
        return <AdminHomePage user={user} onLogout={handleLogout} />;
      case 'auditor':
        return <AuditorHomePage user={user} onLogout={handleLogout} />;
      default:
        return <CustomerHomePage user={user} onLogout={handleLogout} />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {isAuthenticated && user
        ? <>
            {renderHomePage()}
            <Box sx={{ mt: 8, py: 2, bgcolor: '#000', textAlign: 'center', color: '#fff', fontSize: 14, borderTop: '1px solid #222' }}>
              All rights reserved to Sathwik Reddy Chelemela
            </Box>
          </>
        : showLogin
          ? <>
              <Auth onLogin={handleLogin} onBackToLanding={() => setShowLogin(false)} />
              <Box sx={{ mt: 8, py: 2, bgcolor: '#000', textAlign: 'center', color: '#fff', fontSize: 14, borderTop: '1px solid #222' }}>
                All rights reserved to Sathwik Reddy Chelemela
              </Box>
            </>
          : <WelcomePage onLoginClick={() => setShowLogin(true)} />}
    </ThemeProvider>
  );
}

export default App;
