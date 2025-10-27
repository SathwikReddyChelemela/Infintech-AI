import React, { useState, useEffect, useCallback } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Card,
  CardContent,
  Grid,
  Chip,
  Paper,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  IconButton,
  Alert
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// import CustomerApplication from './CustomerApplication';
// import ApplicationStatusStepper from './ApplicationStatusStepper';
import AnalystDashboard from './AnalystDashboard';
// import UnderwriterDashboard from './UnderwriterDashboard';
// import AdminDashboard from './AdminDashboard';

function HomePage({ user, onLogout }) {
  const navigate = useNavigate();

  const getRoleColor = (role) => {
    const colors = {
      customer: 'success',
      analyst: 'primary',
      underwriter: 'warning',
      admin: 'error',
      auditor: 'secondary'
    };
    return colors[role] || 'default';
  };

  const getRoleDescription = (role) => {
    const descriptions = {
      customer: 'Access financial services, view documents, and get support',
      analyst: 'Perform financial analysis, create reports, and assess market data',
      underwriter: 'Review applications, assess risk, and make approval decisions',
      admin: 'Full system access with user management and system administration',
      auditor: 'Monitor compliance, review transactions, and generate audit reports'
    };
    return descriptions[role] || 'Financial RBAC system with role-based access';
  };





  const getRoleWelcomeMessage = (role) => {
    switch (role) {
      case 'customer':
        return `Welcome back, ${user.username}! Here's your financial services dashboard.`;
      case 'analyst':
        return `Good to see you, ${user.username}! Ready to analyze today's financial data?`;
      case 'underwriter':
        return `Welcome, ${user.username}! Applications are waiting for your review.`;
      case 'admin':
        return `System Administrator ${user.username}, you have full control over the platform.`;
      case 'auditor':
        return `Auditor ${user.username}, compliance monitoring is ready for your review.`;
      default:
        return `Welcome, ${user.username}!`;
    }
  };

  const getRoleStats = (role) => {
    // Use live stats if available, otherwise fall back to default values
    if (!liveStats) {
      switch (role) {
        case 'customer':
          return [
            { label: 'Active Applications', value: '0', color: 'primary' },
            { label: 'Documents', value: '0', color: 'secondary' },
            { label: 'Support Tickets', value: '0', color: 'warning' }
          ];
        case 'analyst':
          return [
            { label: 'Reports Created', value: '0', color: 'primary' },
            { label: 'Analyses Pending', value: '0', color: 'secondary' },
            { label: 'Market Insights', value: '0', color: 'success' }
          ];
        case 'underwriter':
          return [
            { label: 'Applications Pending', value: '0', color: 'warning' },
            { label: 'Approved Today', value: '0', color: 'success' },
            { label: 'Risk Assessments', value: '0', color: 'primary' }
          ];
        case 'admin':
          return [
            { label: 'Active Users', value: '0', color: 'primary' },
            { label: 'System Health', value: '100%', color: 'success' },
            { label: 'Pending Actions', value: '0', color: 'warning' }
          ];
        case 'auditor':
          return [
            { label: 'Audit Reports', value: '0', color: 'primary' },
            { label: 'Compliance Score', value: '100%', color: 'success' },
            { label: 'Issues Found', value: '0', color: 'error' }
          ];
        default:
          return [
            { label: 'System Status', value: 'Active', color: 'success' },
            { label: 'Features', value: '4', color: 'primary' }
          ];
      }
    }
    
    // Return live stats based on role
    switch (role) {
      case 'customer':
        return [
          { label: 'Active Applications', value: liveStats.activeApplications?.toString() || '0', color: 'primary' },
          { label: 'Documents', value: liveStats.documentsCount?.toString() || '0', color: 'secondary' },
          { label: 'Support Tickets', value: liveStats.supportTickets?.toString() || '0', color: 'warning' }
        ];
      case 'analyst':
        return [
          { label: 'Reports Created', value: liveStats.reportsCreated?.toString() || '0', color: 'primary' },
          { label: 'Analyses Pending', value: liveStats.analysesPending?.toString() || '0', color: 'secondary' },
          { label: 'Market Insights', value: liveStats.marketInsights?.toString() || '0', color: 'success' }
        ];
      case 'underwriter':
        return [
          { label: 'Applications Pending', value: liveStats.applicationsPending?.toString() || '0', color: 'warning' },
          { label: 'Approved Today', value: liveStats.approvedToday?.toString() || '0', color: 'success' },
          { label: 'Risk Assessments', value: liveStats.riskAssessments?.toString() || '0', color: 'primary' }
        ];
      case 'admin':
        return [
          { label: 'Active Users', value: liveStats.activeUsers?.toString() || '0', color: 'primary' },
          { label: 'System Health', value: liveStats.systemHealth || '100%', color: 'success' },
          { label: 'Pending Actions', value: liveStats.pendingActions?.toString() || '0', color: 'warning' }
        ];
      case 'auditor':
        return [
          { label: 'Audit Reports', value: liveStats.auditReports?.toString() || '0', color: 'primary' },
          { label: 'Compliance Score', value: liveStats.complianceScore || '100%', color: 'success' },
          { label: 'Issues Found', value: liveStats.issuesFound?.toString() || '0', color: 'error' }
        ];
      default:
        return [
          { label: 'System Status', value: 'Active', color: 'success' },
          { label: 'Features', value: '4', color: 'primary' }
        ];
    }
  };

  const [applicationStatus, setApplicationStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customerTab, setCustomerTab] = useState(0);
  const [customerApplications, setCustomerApplications] = useState(null);
  const [liveStats, setLiveStats] = useState(null);
  const [searchedApplicationId, setSearchedApplicationId] = useState('');
  const [searchedApplicationStatus, setSearchedApplicationStatus] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const getLiveStats = useCallback(async () => {
    try {
      const response = await axios.get('/stats', {
        auth: {
          username: user.username,
          password: user.password
        }
      });
      setLiveStats(response.data);
    } catch (error) {
      console.error('Error fetching live stats:', error);
      // Set default stats on error
      setLiveStats({
        activeApplications: 0,
        documentsCount: 0,
        supportTickets: 0,
        reportsCreated: 0,
        analysesPending: 0,
        marketInsights: 0,
        applicationsPending: 0,
        approvedToday: 0,
        riskAssessments: 0,
        activeUsers: 0,
        systemHealth: '100%',
        pendingActions: 0,
        auditReports: 0,
        complianceScore: '100%',
        issuesFound: 0
      });
    }
  }, [user.username, user.password]);

  const getCustomerApplications = useCallback(async () => {
    if (user.role !== 'customer') return;
    
    try {
      const response = await axios.get('/customer/dashboard', {
        auth: {
          username: user.username,
          password: user.password
        }
      });
      setCustomerApplications(response.data);
    } catch (error) {
      console.error('Error fetching customer applications:', error);
    }
  }, [user.role, user.username, user.password]);

  const getApplicationStatus = useCallback(async () => {
    if (user.role !== 'customer') return;
    
    setLoading(true);
    try {
      const response = await axios.get('/application-status', {
        auth: {
          username: user.username,
          password: user.password
        }
      });
      setApplicationStatus(response.data);
    } catch (error) {
      console.error('Error fetching application status:', error);
      // Fallback to mock data if API fails
      setApplicationStatus({
        applicationId: 'APP-2024-001',
        status: 'Under Review',
        currentStep: 2,
        lastUpdate: new Date().toISOString(),
        timeline: [
          {
            step: 'Draft',
            status: 'completed',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Application created and saved as draft'
          },
          {
            step: 'Submitted',
            status: 'completed',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Application submitted for review'
          },
          {
            step: 'Under Review',
            status: 'active',
            date: new Date().toISOString(),
            description: 'Application is being reviewed by underwriter'
          },
          {
            step: 'Decision',
            status: 'pending',
            date: null,
            description: 'Final decision will be made'
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  }, [user.role, user.username, user.password]);

  useEffect(() => {
    // Initial data fetch
    getLiveStats();
    
    if (user.role === 'customer') {
      getApplicationStatus();
      getCustomerApplications();
    }
    
    // Set up polling instead of WebSocket for more reliable updates
    const pollInterval = setInterval(() => {
      getLiveStats();
      if (user.role === 'customer') {
        getApplicationStatus();
        getCustomerApplications();
      }
    }, 10000); // Poll every 10 seconds
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [user.role, user.username, getApplicationStatus, getCustomerApplications, getLiveStats]);

  const searchApplicationById = async (applicationId) => {
    if (!applicationId.trim()) {
      setSearchError('Please enter an application ID');
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    setSearchedApplicationStatus(null);

    try {
      console.log('Searching for application:', applicationId);
      console.log('User:', user.username);
      const response = await axios.get(`/customer/applications/${applicationId}/status`, {
        auth: {
          username: user.username,
          password: user.password
        }
      });
      console.log('Search response:', response.data);
      setSearchedApplicationStatus(response.data);
    } catch (error) {
      console.error('Error searching application:', error);
      console.error('Error response:', error.response?.data);
      if (error.response?.status === 404) {
        setSearchError(`Application "${applicationId}" not found or you do not have access to it. Make sure the Application ID is correct and belongs to your account.`);
      } else if (error.response?.status === 403) {
        setSearchError('You can only search your own applications');
      } else if (error.response?.status === 500) {
        setSearchError('Server error occurred. Please try again later.');
      } else {
        setSearchError(`Failed to search application. Please check the Application ID format (e.g., APP-XXXXXXXX) and try again.`);
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = () => {
    searchApplicationById(searchedApplicationId);
  };

  const handleClearSearch = () => {
    setSearchedApplicationId('');
    setSearchedApplicationStatus(null);
    setSearchError('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Pending';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
              onClick={() => navigate('/dashboard')}
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
        <Box>
      <Typography variant="h4" gutterBottom>
            {getRoleWelcomeMessage(user.role)}
          </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {getRoleDescription(user.role)}
          </Typography>
          
          {/* Role-specific Statistics */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {getRoleStats(user.role).map((stat, index) => (
              <Grid item xs={12} sm={4} key={index}>
        <Card sx={{ textAlign: 'center', bgcolor: `${stat.color}.light` }}>
                  <CardContent>
          <Typography variant="h4" color={`${stat.color}.main`} gutterBottom>
                      {stat.value}
                    </Typography>
          <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Customer Application Management */}
          {user.role === 'customer' && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  <Tabs value={customerTab} onChange={(e, newValue) => setCustomerTab(newValue)}>
                    <Tab label="Start Application" />
                    <Tab label="My Applications" />
                    <Tab label="Application Status" />
                  </Tabs>
                </Box>
                
                {customerTab === 0 && (
                  <div>Customer Application - Temporarily Disabled</div>
                )}
                
                {customerTab === 1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      My Applications
                    </Typography>
                    {customerApplications ? (
                      <Grid container spacing={2}>
                        {customerApplications.draft_application && (
                          <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ bgcolor: '#ffffff', borderColor: '#e5e7eb' }}>
                              <CardContent>
                <Typography variant="h6" sx={{ color: '#111827', fontWeight: 700 }}>
                                  Draft Application
                                </Typography>
                <Typography variant="body2" sx={{ color: '#374151' }}>
                                  Last updated: {formatDate(customerApplications.draft_application.updated_at)}
                                </Typography>
                                <Button 
                                  variant="contained" 
                                  size="small" 
                                  sx={{ mt: 1 }}
                                  onClick={() => setCustomerTab(0)}
                                >
                                  Continue Editing
                                </Button>
                              </CardContent>
                            </Card>
                          </Grid>
                        )}
                        
                        {customerApplications.submitted_applications.map((app, index) => (
                          <Grid item xs={12} md={6} key={index}>
              <Card variant="outlined" sx={{ bgcolor: '#ffffff', borderColor: '#e5e7eb' }}>
                              <CardContent>
                <Typography variant="h6" sx={{ color: '#111827', fontWeight: 700 }}>
                                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)} Application
                                </Typography>
                <Typography variant="body2" sx={{ color: '#374151' }}>
                                  ID: {app.id}
                                </Typography>
                <Typography variant="body2" sx={{ color: '#374151' }}>
                                  Submitted: {formatDate(app.created_at)}
                                </Typography>
                                <Chip 
                                  label={app.status} 
                                  color={app.status === 'approved' ? 'success' : 
                                         app.status === 'declined' ? 'error' : 'warning'}
                                  size="small"
                                  sx={{ mt: 1 }}
                                />
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
            <Typography variant="body2" sx={{ color: '#374151' }}>
                        Loading applications...
                      </Typography>
                    )}
                  </Box>
                )}
                
                {customerTab === 2 && (
                  <Box>
                    {/* Search Box */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Application Status Search
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <TextField
                          fullWidth
                          label="Enter Application ID"
                          value={searchedApplicationId}
                          onChange={(e) => setSearchedApplicationId(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                          placeholder="e.g., CUST-CUSTOMER1-123456"
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                {searchedApplicationId && (
                                  <IconButton onClick={handleClearSearch} size="small">
                                    <Clear />
                                  </IconButton>
                                )}
                                <IconButton 
                                  onClick={handleSearch} 
                                  disabled={searchLoading || !searchedApplicationId.trim()}
                                >
                                  <Search />
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                        />
                      </Box>
                      {searchError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          {searchError}
                        </Alert>
                      )}
                      
                      {/* Helper information */}
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          <strong>How to use:</strong> Enter any of your Application IDs to see its current status and timeline.
                        </Typography>
                        <Typography variant="body2">
                          <strong>Format:</strong> APP-XXXXXXXX (e.g., APP-4A06DE82)
                        </Typography>
                      </Alert>
                    </Box>

                    {/* Search Results or Latest Application */}
                    {searchLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          Searching application...
                        </Typography>
                      </Box>
                    ) : searchedApplicationStatus ? (
                      <Box>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Search Result:
                        </Typography>
                        <div>Application Status Stepper - Temporarily Disabled</div>
                      </Box>
                    ) : loading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                      </Box>
                    ) : applicationStatus ? (
                      <Box>
                        <Typography variant="subtitle1" color="secondary" gutterBottom>
                          Latest Application:
                        </Typography>
                        <div>Application Status Stepper - Temporarily Disabled</div>
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#374151' }}>
                        No applications found. Submit an application to see its status here.
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* Admin Dashboard */}
          {user.role === 'admin' && (
            <div>Admin Dashboard - Temporarily Disabled</div>
          )}

          {/* Analyst Dashboard */}
          {user.role === 'analyst' && (
            <AnalystDashboard user={user} onLogout={onLogout} />
          )}

          {/* Underwriter Dashboard */}
          {user.role === 'underwriter' && (
            <div>Underwriter Dashboard - Under Maintenance</div>
          )}

          {/* Quick Actions and Your Features sections removed as requested */}

          {/* Role-specific welcome message */}
          <Paper sx={{ p: 3, mt: 3, bgcolor: '#ffffff', border: '1px solid #e5e7eb' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#111827', fontWeight: 700 }}>
              Welcome to your {user.role} dashboard!
            </Typography>
            {user.role === 'admin' && (
              <Typography variant="body1" sx={{ color: '#374151' }}>
                As an administrator, you have full control over the system. You can upload documents for different roles, 
                manage users, and access system analytics. Use the Query interface to interact with the AI system.
              </Typography>
            )}
            {user.role === 'analyst' && (
              <Typography variant="body1" sx={{ color: '#374151' }}>
                As a financial analyst, you have access to advanced financial analysis tools, reporting capabilities, 
                and market insights. Use the Query interface to analyze financial data and generate reports.
              </Typography>
            )}
            {user.role === 'underwriter' && (
              <Typography variant="body1" sx={{ color: '#374151' }}>
                As an underwriter, you can review applications, assess risks, and make approval decisions. 
                Use the Query interface to access risk assessment tools and application data.
              </Typography>
            )}
            {user.role === 'auditor' && (
              <Typography variant="body1" sx={{ color: '#374151' }}>
                As an auditor, you can monitor compliance, review transactions, and generate audit reports. 
                Use the Query interface to access compliance data and audit tools.
              </Typography>
            )}
            {user.role === 'customer' && (
              <Typography variant="body1" sx={{ color: '#374151' }}>
                As a customer, you can get financial guidance, access relevant documents, and receive support. 
                Use the Query interface to ask questions and get personalized financial advice.
              </Typography>
            )}
          </Paper>
        </Box>
      </Container>
    </Box>
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

export default HomePage;
