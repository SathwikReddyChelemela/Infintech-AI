import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  Divider,
  Popover,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  Schedule,
  Warning,
  Notifications,
  People,
  TrendingUp,
  Assessment,
  FilterList,
  Refresh
} from '@mui/icons-material';
import axios from 'axios';
import Navbar from './Navbar';
import ApplicationReviewDialog from './ApplicationReviewDialog';
import SupportChatDialog from './SupportChatDialog';

function AnalystHomePage({ user, onLogout }) {
  const [stats, setStats] = useState({
    submitted: 0,
    pendingReview: 0,
    dataQualityIssues: 0,
    completedToday: 0,
    slaAtRisk: 0
  });
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [supportOpen, setSupportOpen] = useState(false);

  // Debug: Log when review dialog state changes
  useEffect(() => {
    console.log('🔍 Review Dialog State:', {
      open: reviewDialogOpen,
      applicationId: selectedApplicationId
    });
  }, [reviewDialogOpen, selectedApplicationId]);

  const fetchAnalystDashboard = useCallback(async () => {
    try {
      // JWT token is automatically added by axios interceptor
      const response = await axios.get('/analyst/dashboard');

      const data = response.data;
      setStats({
        submitted: data.submitted_applications?.length || 0,
        pendingReview: data.pending_review || 0,
        dataQualityIssues: data.data_quality_issues || 0,
        completedToday: 0,
        slaAtRisk: 0
      });

      setApplications(data.submitted_applications || []);
      // Build simple notifications from submitted applications
      const raw = (data.submitted_applications || [])
        .slice()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10)
        .map(app => ({
          id: app.id,
          title: 'New Submission',
          body: `${app.id} from ${app.customer_id}`,
          created_at: app.created_at
        }));
      const seenKey = `notif_seen_analyst_${user?.username}`;
      let seen = [];
      try { seen = JSON.parse(localStorage.getItem(seenKey) || '[]'); } catch {}
      const seenSet = new Set(seen);
      const notifs = raw.filter(n => !seenSet.has(n.id));
      setNotifications(notifs);
      setUnseenCount(notifs.length);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analyst dashboard:', error);
      setLoading(false);
    }
  }, [user?.username]);

  useEffect(() => {
    fetchAnalystDashboard();
  }, [fetchAnalystDashboard]);

  const handleBellClick = (e) => {
    setAnchorEl(e.currentTarget);
    const seenKey = `notif_seen_analyst_${user?.username}`;
    let seen = [];
    try { seen = JSON.parse(localStorage.getItem(seenKey) || '[]'); } catch {}
    const merged = Array.from(new Set([...seen, ...notifications.map(n => n.id)]));
    localStorage.setItem(seenKey, JSON.stringify(merged));
    setNotifications([]);
    setUnseenCount(0);
  };
  const handleBellClose = () => setAnchorEl(null);
  const bellOpen = Boolean(anchorEl);
  const bellId = bellOpen ? 'analyst-notifs' : undefined;

  return (
  <Box sx={{ minHeight: '100vh', bgcolor: '#111', color: '#fff' }}>
      <Navbar
        notificationsCount={unseenCount || stats.pendingReview}
        onSupportClick={() => setSupportOpen(true)}
        onNotificationsClick={handleBellClick}
        onLogout={onLogout}
        maxWidth="lg"
      />

      {/* Role welcome and guidance */}
      <Container maxWidth="lg">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">Welcome, {user.username} 📊</Typography>
          <Typography variant="body2" color="text.secondary">
            As an Analyst, review submitted applications for completeness, add notes,
            request missing information, and mark cases as ready for underwriting.
          </Typography>
        </Box>
      </Container>



      <Popover
        id={bellId}
        open={bellOpen}
        anchorEl={anchorEl}
        onClose={handleBellClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 360, p: 1 } }}
      >
        <Box sx={{ p: 1 }}>
          <Typography variant="subtitle1" sx={{ px: 1, py: 1 }}>Notifications</Typography>
          <Divider />
          <List dense sx={{ maxHeight: 320, overflow: 'auto' }}>
            {(notifications.length ? notifications : []).map(n => (
              <ListItem key={n.id}>
                <ListItemIcon><Notifications color="info" /></ListItemIcon>
                <ListItemText primary={n.title} secondary={<>
                  <Typography variant="body2">{n.body}</Typography>
                  <Typography variant="caption" color="text.secondary">{new Date(n.created_at).toLocaleString()}</Typography>
                </>} />
              </ListItem>
            ))}
            {notifications.length === 0 && (
              <ListItem><ListItemText primary="No notifications" /></ListItem>
            )}
          </List>
        </Box>
      </Popover>

      <Container maxWidth="lg">
        <SupportChatDialog
          open={supportOpen}
          onClose={() => setSupportOpen(false)}
          user={user}
        />
        {/* Statistics Cards */}
  <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', bgcolor: '#181818', color: '#fff', border: '1px solid #222', boxShadow: '0 4px 24px #000a', borderRadius: 4, transition: 'transform .2s, box-shadow .2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 8 } }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">{stats.submitted}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>New Submissions</Typography>
                  </Box>
                  <Assignment sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', bgcolor: '#181818', color: '#fff', border: '1px solid #222', boxShadow: '0 4px 24px #000a', borderRadius: 4, transition: 'transform .2s, box-shadow .2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 8 } }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">{stats.pendingReview}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Pending Review</Typography>
                  </Box>
                  <Schedule sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', bgcolor: '#181818', color: '#fff', border: '1px solid #222', boxShadow: '0 4px 24px #000a', borderRadius: 4, transition: 'transform .2s, box-shadow .2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 8 } }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">{stats.completedToday}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Completed Today</Typography>
                  </Box>
                  <CheckCircle sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', bgcolor: '#181818', color: '#fff', border: '1px solid #222', boxShadow: '0 4px 24px #000a', borderRadius: 4 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">{stats.dataQualityIssues}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Data Quality Issues</Typography>
                  </Box>
                  <Warning sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', bgcolor: '#181818', color: '#fff', border: '1px solid #222', boxShadow: '0 4px 24px #000a', borderRadius: 4 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">{stats.slaAtRisk}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>SLA At Risk</Typography>
                  </Box>
                  <TrendingUp sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', bgcolor: '#181818', color: '#fff', border: '1px solid #222', boxShadow: '0 4px 24px #000a', borderRadius: 4 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">94%</Typography>
                    <Typography variant="body2" color="text.secondary">Approval Rate</Typography>
                  </Box>
                  <Assessment sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Work Queue */}
        <Card sx={{ mb: 4, bgcolor: '#181818', color: '#fff', border: '1px solid #222', boxShadow: '0 4px 24px #000a', borderRadius: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Application Work Queue</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button startIcon={<FilterList />} size="small" variant="contained" color="primary" sx={{ borderRadius: 2, fontWeight: 700, bgcolor: '#222', color: '#90caf9', '&:hover': { bgcolor: '#333', color: '#fff' } }}>Filter</Button>
                <Button startIcon={<Refresh />} size="small" onClick={fetchAnalystDashboard}>
                  Refresh
                </Button>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {loading ? (
              <LinearProgress />
            ) : applications.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">No applications in queue</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Application ID</strong></TableCell>
                      <TableCell><strong>Customer</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Submitted</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>SLA</strong></TableCell>
                      <TableCell align="right"><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {applications.slice(0, 10).map((app) => (
                      <TableRow key={app.id} hover>
                        <TableCell>{app.id}</TableCell>
                        <TableCell>{app.customer_id}</TableCell>
                        <TableCell>
                          <Chip label={app.data?.insuranceType || 'Insurance'} size="small" />
                        </TableCell>
                        <TableCell>
                          {new Date(app.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={app.status}
                            size="small"
                            color={app.status === 'submitted' ? 'warning' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip label="On Time" size="small" color="success" />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              console.log('🔵 Review button clicked!', {
                                appId: app.id,
                                appData: app
                              });
                              setSelectedApplicationId(app.id);
                              setReviewDialogOpen(true);
                            }}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions and Tips */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ bgcolor: '#181818', color: '#fff', border: '1px solid #222', boxShadow: '0 4px 24px #000a', borderRadius: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Key Responsibilities</Typography>
                <Divider sx={{ my: 2 }} />
                <List>
                  <ListItemButton>
                    <ListItemIcon>
                      <CheckCircle color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Validate Application Data"
                      secondary="Verify all personal and financial information is complete and accurate"
                    />
                  </ListItemButton>
                  <ListItemButton>
                    <ListItemIcon>
                      <Assessment color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Review Documents"
                      secondary="Check ID proof, income verification, and medical reports"
                    />
                  </ListItemButton>
                  <ListItemButton>
                    <ListItemIcon>
                      <People color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Request Information"
                      secondary="Communicate with customers for missing or unclear information"
                    />
                  </ListItemButton>
                  <ListItemButton>
                    <ListItemIcon>
                      <TrendingUp color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Approve for Underwriting"
                      secondary="Mark validated applications for underwriter review"
                    />
                  </ListItemButton>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#fff3e0', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="warning.main">
                  ⚡ Performance Tips
                </Typography>
                <Divider sx={{ my: 2 }} />
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="🎯 Target: 24hr SLA"
                      secondary="Review applications within 24 hours"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="✅ Quality First"
                      secondary="Thorough review prevents rework"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="📝 Clear Communication"
                      secondary="Be specific when requesting changes"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="🔍 Document Check"
                      secondary="Verify all required docs are present"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Application Review Dialog */}
      <ApplicationReviewDialog
        key={selectedApplicationId || 'no-app'}
        open={reviewDialogOpen}
        onClose={(shouldRefresh) => {
          setReviewDialogOpen(false);
          setSelectedApplicationId(null);
          if (shouldRefresh) {
            fetchAnalystDashboard();
          }
        }}
        applicationId={selectedApplicationId}
        user={user}
      />
    </Box>
  );
}

export default AnalystHomePage;
