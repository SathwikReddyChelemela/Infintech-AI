import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  Divider,
  Popover,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Assignment,
  Description,
  Visibility,
  CheckCircle,
  Schedule,
  Notifications,
  ContactSupport
} from '@mui/icons-material';
import axios from 'axios';
import Navbar from './Navbar';
import InsuranceApplicationForm from './InsuranceApplicationForm';
import ApplicationStatusDialog from './ApplicationStatusDialog';
import SupportChatDialog from './SupportChatDialog';
import PaymentMethodDialog from './PaymentMethodDialog';

function CustomerHomePage({ user, onLogout }) {
  const [stats, setStats] = useState({
    applications: 0,
    drafts: 0,
    submitted: 0,
    approved: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);
  const [applicationFormOpen, setApplicationFormOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentDisabledOpen, setPaymentDisabledOpen] = useState(false);
  

  const fetchDashboardData = useCallback(async () => {
    try {
      // JWT token is automatically added by axios interceptor
      const response = await axios.get('/customer/dashboard');
      
      // Process dashboard data
      const data = response.data;
      setStats({
        applications: data.submitted_applications?.length || 0,
        drafts: data.draft_application ? 1 : 0,
        submitted: data.submitted_applications?.filter(app => app.status === 'submitted').length || 0,
        approved: data.submitted_applications?.filter(app => app.status === 'approved').length || 0,
        pending: data.submitted_applications?.filter(app => app.status === 'under_review').length || 0
      });
      
      // Notifications: use messages returned by API
  const msgs = (data.messages || []).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  // One-time notifications: filter out seen using localStorage per user
  const seenKey = `notif_seen_customer_${user?.username}`;
  let seen = [];
  try { seen = JSON.parse(localStorage.getItem(seenKey) || '[]'); } catch {}
  const seenSet = new Set(seen);
  const unseenMsgs = msgs.filter(m => !seenSet.has(m.id));
  setNotifications(unseenMsgs);
  setUnreadCount(unseenMsgs.length);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  }, [user?.username]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleBellClick = (event) => {
    setAnchorEl(event.currentTarget);
    // On first open, mark current items as seen and clear from list
    const seenKey = `notif_seen_customer_${user?.username}`;
    let seen = [];
    try { seen = JSON.parse(localStorage.getItem(seenKey) || '[]'); } catch {}
    const merged = Array.from(new Set([...seen, ...notifications.map(n => n.id)]));
    localStorage.setItem(seenKey, JSON.stringify(merged));
    setNotifications([]);
    setUnreadCount(0);
  };
  const handleBellClose = () => setAnchorEl(null);
  const open = Boolean(anchorEl);
  const id = open ? 'notifications-popover' : undefined;

  const quickActions = [
    {
      title: 'Apply for Insurance',
      description: 'Start a new high-value insurance application',
      icon: <Assignment fontSize="large" />,
      color: '#1976d2',
      action: '/apply'
    },
    {
      title: 'View Applications',
      description: 'Check status of your submitted applications',
      icon: <Visibility fontSize="large" />,
      color: '#2e7d32',
      action: '/applications'
    },
    {
      title: 'Get Support',
      description: 'Contact our support team for assistance',
      icon: <ContactSupport fontSize="large" />,
      color: '#9c27b0',
  action: '/support'
    },
    {
      title: 'Add Payment',
      description: 'Save your payment method securely',
      icon: <CheckCircle fontSize="large" />,
      color: '#ff7043',
      action: '/payment'
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Navbar
        notificationsCount={unreadCount}
        onSupportClick={() => setSupportOpen(true)}
        onNotificationsClick={handleBellClick}
        onLogout={onLogout}
        maxWidth="lg"
      />

      {/* Role welcome and guidance */}
  <Container maxWidth="lg">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">Welcome back, {user.username}! 👋</Typography>
          <Typography variant="body2" color="text.secondary">
            As a Customer, you can submit new insurance applications, upload requested
            documents, and track your application status from your dashboard.
          </Typography>
        </Box>
      </Container>



      {/* Notifications Popover */}
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleBellClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 360, p: 1 } }}
      >
        <Box sx={{ p: 1 }}>
          <Typography variant="subtitle1" sx={{ px: 1, py: 1 }}>Notifications</Typography>
          <Divider />
          {notifications.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">No notifications</Typography>
            </Box>
          ) : (
            <List dense sx={{ maxHeight: 320, overflow: 'auto' }}>
              {notifications.slice(0, 10).map((n) => (
                <ListItem key={n.id} alignItems="flex-start">
                  <ListItemIcon>
                    <Notifications color={n.from_role === 'underwriter' ? 'warning' : 'info'} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${n.from_role === 'analyst' ? 'Analyst' : n.from_role === 'underwriter' ? 'Underwriter' : n.from_role}`}
                    secondary={
                      <>
                        <Typography variant="body2" color="text.primary">{n.body}</Typography>
                        <Typography variant="caption" color="text.secondary">{new Date(n.created_at).toLocaleString()}</Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Popover>

      <Container maxWidth="lg">
  {/* SupportChatDialog removed */}
        {/* Statistics Cards */}
  <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">{stats.applications}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Applications</Typography>
                  </Box>
                  <Assignment sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">{stats.pending}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Pending Review</Typography>
                  </Box>
                  <Schedule sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">{stats.approved}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Approved</Typography>
                  </Box>
                  <CheckCircle sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">{stats.drafts}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Draft Applications</Typography>
                  </Box>
                  <Description sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
          Quick Actions
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6
                  }
                }}
                onClick={() => {
                  if (action.title === 'Apply for Insurance') {
                    setApplicationFormOpen(true);
                  } else if (action.title === 'View Applications') {
                    setStatusDialogOpen(true);
                  } else if (action.title === 'Get Support') {
                    setSupportOpen(true);
                  } else if (action.title === 'Add Payment') {
                    setPaymentDisabledOpen(true);
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Avatar 
                    sx={{ 
                      width: 64, 
                      height: 64, 
                      mx: 'auto', 
                      mb: 2,
                      bgcolor: action.color
                    }}
                  >
                    {action.icon}
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {action.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (action.title === 'Apply for Insurance') {
                        setApplicationFormOpen(true);
                      } else if (action.title === 'View Applications') {
                        setStatusDialogOpen(true);
                      } else if (action.title === 'Get Support') {
                        setSupportOpen(true);
                      } else if (action.title === 'Add Payment') {
                        setPaymentDisabledOpen(true);
                      }
                    }}
                  >
                    Get Started
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

  {/* Recent Activity & Tips */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Schedule /> Recent Activity
                </Typography>
                <Divider sx={{ my: 2 }} />
                {loading ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">Loading recent activity...</Typography>
                  </Box>
                ) : (
                  <List>
                    {stats.applications === 0 ? (
                      <ListItem>
                        <ListItemText 
                          primary="No activity yet"
                          secondary="Start by creating your first insurance application"
                        />
                      </ListItem>
                    ) : (
                      <>
                        <ListItemButton>
                          <ListItemIcon>
                            <CheckCircle color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Application Submitted"
                            secondary="Your application has been received and is under review"
                          />
                          <Chip label="Today" size="small" color="primary" />
                        </ListItemButton>
                        <Divider />
                        <ListItemButton>
                          <ListItemIcon>
                            <Description color="info" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Document Uploaded"
                            secondary="Income proof document has been verified"
                          />
                          <Chip label="2 days ago" size="small" />
                        </ListItemButton>
                      </>
                    )}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#e3f2fd', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  💡 Tips & Reminders
                </Typography>
                <Divider sx={{ my: 2 }} />
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="📄 Complete Documentation"
                      secondary="Ensure all required documents are uploaded for faster processing"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="⏰ Application Timeline"
                      secondary="Most applications are reviewed within 24-48 hours"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="✅ Accuracy Matters"
                      secondary="Double-check all information before submitting"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="📞 Support Available"
                      secondary="Contact us anytime for assistance"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Application Process Overview */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              How the Application Process Works
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Avatar sx={{ width: 56, height: 56, mx: 'auto', mb: 1, bgcolor: '#1976d2' }}>
                    <Typography variant="h5">1</Typography>
                  </Avatar>
                  <Typography variant="subtitle2" gutterBottom>Submit Application</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Fill out your details and upload required documents
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Avatar sx={{ width: 56, height: 56, mx: 'auto', mb: 1, bgcolor: '#2e7d32' }}>
                    <Typography variant="h5">2</Typography>
                  </Avatar>
                  <Typography variant="subtitle2" gutterBottom>Analyst Review</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Our analyst validates your information and documents
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Avatar sx={{ width: 56, height: 56, mx: 'auto', mb: 1, bgcolor: '#ed6c02' }}>
                    <Typography variant="h5">3</Typography>
                  </Avatar>
                  <Typography variant="subtitle2" gutterBottom>Underwriter Decision</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Risk assessment and final decision on your application
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Avatar sx={{ width: 56, height: 56, mx: 'auto', mb: 1, bgcolor: '#9c27b0' }}>
                    <Typography variant="h5">4</Typography>
                  </Avatar>
                  <Typography variant="subtitle2" gutterBottom>Get Approved</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Receive your policy details and premium information
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>

      {/* Insurance Application Form Dialog */}
      <InsuranceApplicationForm 
        open={applicationFormOpen}
        onClose={() => {
          setApplicationFormOpen(false);
          fetchDashboardData(); // Refresh dashboard after submission
        }}
        user={user}
      />

      {/* Application Status Dialog */}
      <ApplicationStatusDialog
        open={statusDialogOpen}
        onClose={() => {
          setStatusDialogOpen(false);
          fetchDashboardData(); // Refresh dashboard when closed
        }}
  user={user}
  onAddPayment={() => setPaymentOpen(true)}
      />

      {/* Support Chat Dialog */}
      <SupportChatDialog 
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        user={user}
      />

      {/* Payment Method Dialog */}
      <PaymentMethodDialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
      />

      {/* Payment disabled notice */}
      <Snackbar
        open={paymentDisabledOpen}
        autoHideDuration={3000}
        onClose={() => setPaymentDisabledOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={() => setPaymentDisabledOpen(false)} sx={{ width: '100%' }}>
          Payment is disabled
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default CustomerHomePage;
