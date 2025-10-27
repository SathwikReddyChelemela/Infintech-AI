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
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs
} from '@mui/material';
import { Paper } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People,
  Assignment,
  Security,
  Assessment,
  Notifications,
  CheckCircle,
  Warning,
  Cancel,
  Schedule,
  Refresh,
  Add,
  Edit
} from '@mui/icons-material';
import axios from 'axios';
import SupportChatDialog from './SupportChatDialog';
import Navbar from './Navbar';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function AdminHomePage({ user, onLogout }) {
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalApplications: 0,
    activeCustomers: 0,
    systemHealth: 'Healthy'
  });
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appStats, setAppStats] = useState({});
  const [userStats, setUserStats] = useState({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'customer', name: '', email: '' });
  const [busy, setBusy] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [supportOpen, setSupportOpen] = useState(false);

  // Monitoring helpers removed

  const fetchAdminDashboard = useCallback(async () => {
    try {
      // JWT token is automatically added by axios interceptor
      const response = await axios.get('/admin/dashboard');
      
      const data = response.data;
      setStats({
        totalUsers: data.system_stats?.total_users || (data.users?.length || 0),
        totalApplications: data.system_stats?.total_applications || (data.applications?.length || 0),
        activeCustomers: data.user_stats?.customers ?? (data.users?.filter(u => u.role === 'customer').length || 0),
        systemHealth: data.system_health?.status || 'Healthy'
      });
      setUsers(data.users || []);
      setApplications(data.applications || []);
      setAppStats(data.application_stats || {});
      setUserStats(data.user_stats || {});
      // Build basic notifications for admin: recent user creations and recent application updates
      const userNotifs = (data.users || []).slice().sort((a,b)=> new Date(b.created_at)-new Date(a.created_at)).slice(0,5).map(u => ({
        id: `user-${u.username}`,
        title: 'New User',
        body: `${u.username} (${u.role})` ,
        created_at: u.created_at
      }));
      const appNotifs = (data.applications || []).slice().sort((a,b)=> new Date(b.updated_at)-new Date(a.updated_at)).slice(0,5).map(a => ({
        id: `app-${a.id}`,
        title: 'Application Update',
        body: `${a.id} - ${a.status}`,
        created_at: a.updated_at
      }));
  const raw = [...userNotifs, ...appNotifs].slice(0,10);
  const seenKey = `notif_seen_admin_${user?.username}`;
  let seen = [];
  try { seen = JSON.parse(localStorage.getItem(seenKey) || '[]'); } catch {}
  const notifs = raw.filter(n => !seen.includes(n.id));
  setNotifications(notifs);
  setUnseenCount(notifs.length);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin dashboard:', error);
      setLoading(false);
    }
  }, [user?.username]);

  useEffect(() => {
    fetchAdminDashboard();
  }, [fetchAdminDashboard]);

  // Monitoring fetch removed

  const handleBellClick = (e) => {
    setAnchorEl(e.currentTarget);
    const seenKey = `notif_seen_admin_${user?.username}`;
    let seen = [];
    try { seen = JSON.parse(localStorage.getItem(seenKey) || '[]'); } catch {}
    const merged = Array.from(new Set([...seen, ...notifications.map(n => n.id)]));
    localStorage.setItem(seenKey, JSON.stringify(merged));
    setNotifications([]);
    setUnseenCount(0);
  };
  const handleBellClose = () => setAnchorEl(null);
  const bellOpen = Boolean(anchorEl);
  const bellId = bellOpen ? 'admin-notifs' : undefined;

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const openCreateUser = () => { setNewUser({ username: '', password: '', role: 'customer', name: '', email: '' }); setCreateDialogOpen(true); };

  const createUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.role) return;
    try {
      setBusy(true);
      await axios.post('/admin/users', newUser);
      await fetchAdminDashboard();
      setCreateDialogOpen(false);
    } catch (e) {
      console.error('Create user failed', e);
    } finally {
      setBusy(false);
    }
  };

  const updateUserRole = async (username, role) => {
    try {
      setBusy(true);
      const form = new FormData();
      form.append('role', role);
      await axios.patch(`/admin/users/${username}/role`, form);
      await fetchAdminDashboard();
    } catch (e) {
      console.error('Update role failed', e);
    } finally {
      setBusy(false);
    }
  };

  const exportReport = async () => {
    try {
      const res = await axios.get('/admin/reports/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'summary_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error('Export failed', e);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Navbar
        notificationsCount={unseenCount}
        onSupportClick={() => setSupportOpen(true)}
        onNotificationsClick={handleBellClick}
        onSettingsClick={() => setTabValue(4)}
        showSettings
        onLogout={onLogout}
        maxWidth="xl"
      />

      {/* Role welcome and guidance */}
      <Container maxWidth="xl">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">Welcome, {user.username} 🛡️</Typography>
          <Typography variant="body2" color="text.secondary">
            As an Admin, manage users and roles, monitor system stats, and handle
            knowledge/document ingestion for support and verification workflows.
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

      <Container maxWidth="xl">
        <SupportChatDialog 
          open={supportOpen}
          onClose={() => setSupportOpen(false)}
          user={user}
        />
        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">{stats.totalUsers}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Users</Typography>
                  </Box>
                  <People sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">{stats.totalApplications}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Applications</Typography>
                  </Box>
                  <Assignment sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">{stats.activeCustomers}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Active Customers</Typography>
                  </Box>
                  <CheckCircle sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">
                      <CheckCircle sx={{ verticalAlign: 'middle', opacity: 0.9 }} />
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>System {stats.systemHealth}</Typography>
                  </Box>
                  <Security sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card sx={{ mb: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Overview" icon={<DashboardIcon />} iconPosition="start" />
              <Tab label="User Management" icon={<People />} iconPosition="start" />
              <Tab label="Applications" icon={<Assignment />} iconPosition="start" />
              <Tab label="System Health" icon={<Assessment />} iconPosition="start" />
            </Tabs>
          </Box>

          {/* Overview Tab */}
          <TabPanel value={tabValue} index={0}>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Application Status Distribution</Typography>
                  <List>
                    {[
                      { label: 'Draft', icon: <Schedule color="default" />, value: appStats.draft },
                      { label: 'Submitted', icon: <Schedule color="warning" />, value: appStats.submitted },
                      { label: 'Analyst Approved', icon: <CheckCircle color="info" />, value: appStats.analyst_approved },
                      { label: 'Under Review', icon: <Schedule color="info" />, value: appStats.under_review },
                      { label: 'Approved', icon: <CheckCircle color="success" />, value: appStats.approved },
                      { label: 'Rejected', icon: <Cancel color="error" />, value: appStats.rejected },
                      { label: 'Declined', icon: <Cancel color="warning" />, value: appStats.declined },
                      { label: 'Needs Info', icon: <Warning color="info" />, value: appStats.pending_more_info }
                    ].map((row) => (
                      <ListItem key={row.label}>
                        <ListItemIcon>{row.icon}</ListItemIcon>
                        <ListItemText primary={row.label} />
                        <Chip label={row.value ?? 0} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>User Distribution by Role</Typography>
                  <List>
                    {[
                      { label: 'Customers', color: 'success', value: userStats.customers },
                      { label: 'Analysts', color: 'primary', value: userStats.analysts },
                      { label: 'Underwriters', color: 'warning', value: userStats.underwriters },
                      { label: 'Admins', color: 'error', value: userStats.admins },
                      { label: 'Auditors', color: 'default', value: userStats.auditors }
                    ].map((row) => (
                      <ListItem key={row.label}>
                        <ListItemText primary={row.label} />
                        <Chip label={row.value ?? 0} color={row.color} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </TabPanel>

          {/* User Management Tab */}
          <TabPanel value={tabValue} index={1}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">User Management</Typography>
                <Button startIcon={<Add />} variant="contained" onClick={openCreateUser} disabled={busy}>Add User</Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {loading ? (
                <LinearProgress />
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Username</strong></TableCell>
                        <TableCell><strong>Name</strong></TableCell>
                        <TableCell><strong>Email</strong></TableCell>
                        <TableCell><strong>Role</strong></TableCell>
                        <TableCell><strong>Created</strong></TableCell>
                        <TableCell align="right"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id} hover>
                          <TableCell>{u.username}</TableCell>
                          <TableCell>{u.name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <select value={u.role} onChange={(e) => updateUserRole(u.username, e.target.value)} disabled={busy}>
                              {['customer','analyst','underwriter','admin','auditor'].map(r => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small"><Edit /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </TabPanel>

          {/* Applications Tab */}
          <TabPanel value={tabValue} index={2}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">All Applications</Typography>
                <Button startIcon={<Refresh />} onClick={fetchAdminDashboard}>Refresh</Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {loading ? (
                <LinearProgress />
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>ID</strong></TableCell>
                        <TableCell><strong>Customer</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>State</strong></TableCell>
                        <TableCell><strong>Insurance Type</strong></TableCell>
                        <TableCell><strong>Coverage</strong></TableCell>
                        <TableCell><strong>Updated</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {applications.map((a) => (
                        <TableRow key={a.id} hover>
                          <TableCell>{a.id}</TableCell>
                          <TableCell>{a.customer_id}</TableCell>
                          <TableCell>{a.status}</TableCell>
                          <TableCell>{a.state || '-'}</TableCell>
                          <TableCell>{a.data?.insuranceType || '-'}</TableCell>
                          <TableCell>{a.data?.coverageAmount || a.data?.coverageNeeds || '-'}</TableCell>
                          <TableCell>{new Date(a.updated_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </TabPanel>

          {/* System Health Tab */}
          <TabPanel value={tabValue} index={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>System Status</Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button startIcon={<Assessment />} onClick={fetchAdminDashboard}>Refresh Summary</Button>
                <Button startIcon={<Assessment />} color="primary" variant="outlined" onClick={exportReport}>Export CSV</Button>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <List>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText 
                        primary="API Server" 
                        secondary="Running normally"
                      />
                      <Chip label="Healthy" color="success" size="small" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText 
                        primary="Database" 
                        secondary="Connected and responsive"
                      />
                      <Chip label="Healthy" color="success" size="small" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText 
                        primary="Authentication" 
                        secondary="JWT service active"
                      />
                      <Chip label="Healthy" color="success" size="small" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText 
                        primary="File Storage" 
                        secondary="GridFS operational"
                      />
                      <Chip label="Healthy" color="success" size="small" />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                    <Typography variant="subtitle2" gutterBottom>System Metrics</Typography>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">CPU Usage</Typography>
                        <Typography variant="body2" fontWeight="bold">32%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={32} />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Memory Usage</Typography>
                        <Typography variant="body2" fontWeight="bold">48%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={48} color="warning" />
                    </Box>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Storage Used</Typography>
                        <Typography variant="body2" fontWeight="bold">65%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={65} color="info" />
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </TabPanel>
        </Card>

  {/* Quick Actions removed as requested */}
      </Container>

      {/* Create User Dialog */}
      <Card sx={{ display: createDialogOpen ? 'block' : 'none', position: 'fixed', right: 24, bottom: 24, width: 360, zIndex: 1200 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Create New User</Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            <ListItem>
              <ListItemText primary="Username" />
              <input value={newUser.username} onChange={(e)=>setNewUser({...newUser, username:e.target.value})} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Password" />
              <input type="password" value={newUser.password} onChange={(e)=>setNewUser({...newUser, password:e.target.value})} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Role" />
              <select value={newUser.role} onChange={(e)=>setNewUser({...newUser, role:e.target.value})}>
                {['customer','analyst','underwriter','admin','auditor'].map(r => (<option key={r} value={r}>{r}</option>))}
              </select>
            </ListItem>
            <ListItem>
              <ListItemText primary="Name" />
              <input value={newUser.name} onChange={(e)=>setNewUser({...newUser, name:e.target.value})} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Email" />
              <input value={newUser.email} onChange={(e)=>setNewUser({...newUser, email:e.target.value})} />
            </ListItem>
          </List>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={()=>setCreateDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={createUser} disabled={busy || !newUser.username || !newUser.password}>Create</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default AdminHomePage;
