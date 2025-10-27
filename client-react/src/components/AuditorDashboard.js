import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Container } from '@mui/material';
import Navbar from './Navbar';

function AuditorDashboard({ user }) {
  const [statusMessage, setStatusMessage] = useState('');
  // Polling for updates instead of WebSocket
  useEffect(() => {
    const pollInterval = setInterval(() => {
      setStatusMessage('Dashboard updated at ' + new Date().toLocaleTimeString());
    }, 10000); // Update status message every 10 seconds
    
    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Navbar maxWidth="lg" />

      <Container maxWidth="lg">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">Welcome, {user?.username || 'Auditor'}</Typography>
          <Typography variant="body2" color="text.secondary">
            As an Auditor, review audit trails and compliance data. Your access is
            read-only to ensure data integrity and oversight.
          </Typography>
        </Box>

        {statusMessage && (
          <div style={{ margin: '10px 0', color: 'green' }}>
            <strong>Status Update:</strong> {statusMessage}
          </div>
        )}
        {/* Auditor-specific content here */}
      </Container>
    </Box>
  );
}

export default AuditorDashboard;
