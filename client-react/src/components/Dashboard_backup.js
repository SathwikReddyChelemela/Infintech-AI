import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  AppBar,
  Toolbar,
  Container
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = '';

function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadRole, setUploadRole] = useState('finance officer');
  const [uploadStatus, setUploadStatus] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponse, setChatResponse] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);

  const handleFileUpload = async () => {
    if (!uploadFile) {
      setUploadStatus('Please select a file');
      return;
    }

    try {
      setUploadStatus('Uploading...');
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('role', uploadRole);

      const response = await axios.post(`${API_URL}/upload_docs`, formData, {
        auth: {
          username: user.username,
          password: user.password
        },
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000
      });

      if (response.status === 200) {
        setUploadStatus(`Uploaded: ${uploadFile.name}`);
        setUploadFile(null);
      }
    } catch (err) {
      setUploadStatus(err.response?.data?.detail || 'Upload failed');
    }
  };

  const handleChat = async () => {
    if (!chatMessage.trim()) {
      return;
    }

    try {
      setChatLoading(true);
      setChatResponse(null);

      const formData = new FormData();
      formData.append('message', chatMessage);

      const response = await axios.post(`${API_URL}/chat`, formData, {
        auth: {
          username: user.username,
          password: user.password
        },
        timeout: 30000
      });

      if (response.status === 200) {
        setChatResponse(response.data);
      }
    } catch (err) {
      setChatResponse({
        answer: err.response?.data?.detail || 'Something went wrong',
        sources: []
      });
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChat();
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'error',
      analyst: 'primary',
      'finance officer': 'secondary',
      'insurance agent': 'warning',
      customer: 'success'
    };
    return colors[role] || 'default';
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Navigation Bar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Financial RBAC RAG
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              color="inherit" 
              onClick={() => navigate('/home')}
            >
              Home
            </Button>
            <Button 
              color="inherit" 
              sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              Query
            </Button>
          </Box>
          
          <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={user.role} 
              color={getRoleColor(user.role)}
              size="small"
            />
            <Button color="inherit" onClick={onLogout}>
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            {user.role === 'admin' ? 'Admin Dashboard' : 
             user.role === 'analyst' ? 'Financial Analysis Interface' :
             user.role === 'finance officer' ? 'Compliance & Operations Interface' :
             user.role === 'insurance agent' ? 'Insurance Services Interface' :
             'Customer Support Interface'}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {user.role === 'admin' ? 'Manage documents and system operations' :
             user.role === 'analyst' ? 'Analyze financial data and generate reports' :
             user.role === 'finance officer' ? 'Monitor compliance and manage financial operations' :
             user.role === 'insurance agent' ? 'Manage policies and process claims' :
             'Get financial guidance and support'}
          </Typography>
        </Box>

        {/* Admin Upload Section */}
        {user.role === 'admin' && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload PDF for specific Role
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <input
                accept=".pdf"
                style={{ display: 'none' }}
                id="file-upload"
                type="file"
                onChange={(e) => setUploadFile(e.target.files[0])}
              />
              <label htmlFor="file-upload">
                <Button variant="outlined" component="span">
                  Choose PDF File
                </Button>
              </label>
              {uploadFile && (
                <Typography variant="body2" color="text.secondary">
                  {uploadFile.name}
                </Typography>
              )}
            </Box>

            <FormControl sx={{ minWidth: 200, mb: 2 }}>
              <InputLabel>Target Role for docs</InputLabel>
              <Select
                value={uploadRole}
                label="Target Role for docs"
                onChange={(e) => setUploadRole(e.target.value)}
              >
                <MenuItem value="analyst">Analyst</MenuItem>
                <MenuItem value="finance officer">Finance Officer</MenuItem>
                <MenuItem value="insurance agent">Insurance Agent</MenuItem>
                <MenuItem value="customer">Customer</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={handleFileUpload}
              disabled={!uploadFile}
            >
              Upload Document
            </Button>

            {uploadStatus && (
              <Alert severity={uploadStatus.includes('Uploaded') ? 'success' : 'error'} sx={{ mt: 2 }}>
                {uploadStatus}
              </Alert>
            )}
          </Paper>
        )}



        {/* Chat Interface */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {user.role === 'customer' && 'Ask about your financial services'}
            {user.role === 'analyst' && 'Ask about financial analysis and reports'}
            {user.role === 'underwriter' && 'Ask about risk assessment and applications'}
            {user.role === 'admin' && 'Ask about system operations and management'}
            {user.role === 'auditor' && 'Ask about compliance and audit matters'}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder={
                user.role === 'admin' ? 'Ask about system operations or document management...' :
                user.role === 'analyst' ? 'Ask about financial analysis, reports, or market data...' :
                user.role === 'underwriter' ? 'Ask about risk assessment, applications, or approval processes...' :
                user.role === 'auditor' ? 'Ask about compliance, audit reports, or regulatory matters...' :
                user.role === 'customer' ? 'Ask about your financial services, documents, or support...' :
                'Ask about financial guidance, support, or general questions...'
              }
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={chatLoading}
            />
            <Button
              variant="contained"
              onClick={handleChat}
              disabled={!chatMessage.trim() || chatLoading}
              sx={{ minWidth: 100 }}
            >
              {chatLoading ? 'Sending...' : 'Send'}
            </Button>
          </Box>

          {chatResponse && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Answer:
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body1">
                  {chatResponse.answer}
                </Typography>
              </Paper>
              
              {chatResponse.sources && chatResponse.sources.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Sources:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {chatResponse.sources.map((source, index) => (
                      <Chip 
                        key={index} 
                        label={source} 
                        variant="outlined" 
                        size="small" 
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

export default Dashboard;
