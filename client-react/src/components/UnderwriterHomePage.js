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
  Paper,
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
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  Cancel,
  Schedule,
  Warning,
  AttachMoney,
  Refresh,
  FilterList
} from '@mui/icons-material';
import { Notifications } from '@mui/icons-material';
import axios from 'axios';
import SupportChatDialog from './SupportChatDialog';
import Navbar from './Navbar';

function UnderwriterHomePage({ user, onLogout }) {
  const [stats, setStats] = useState({
    caseQueue: 0,
    underReview: 0,
    slaBreach: 0,
    approvedToday: 0,
    declinedToday: 0
  });
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [decisionData, setDecisionData] = useState({
    decision: '',
    reason: '',
    premium_amount: ''
  });
  const [makingDecision, setMakingDecision] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [supportOpen, setSupportOpen] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  // Risk assessment state
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [riskError, setRiskError] = useState('');
  // What-if simulation state
  const [simInput, setSimInput] = useState({ deductible: 1000, term: 12 });
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);

  const fetchUnderwriterDashboard = useCallback(async () => {
    try {
      // JWT token is automatically added by axios interceptor
      const response = await axios.get('/underwriter/dashboard');
      
      const data = response.data;
  const applicationsList = data.case_queue || [];

      setStats({
        caseQueue: applicationsList.length,
        underReview: data.under_review || 0,
        slaBreach: data.sla_breaches || 0,
        approvedToday: 0,
  declinedToday: 0
      });
      
  setApplications(applicationsList);
  // Build notifications for Underwriter: show analyst approved or underwriter_review items
  const raw = applicationsList
        .filter(a => a.state === 'underwriter_review' || a.status === 'analyst_approved')
        .slice()
        .sort((a,b)=> new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
        .slice(0,10)
        .map(app => ({
          id: app.id,
          title: app.status === 'analyst_approved' ? 'Analyst Approved' : 'Needs Review',
          body: `${app.id} from ${app.customer_id}`,
          created_at: app.updated_at || app.created_at
        }));
  const seenKey = `notif_seen_underwriter_${user?.username}`;
  let seen = [];
  try { seen = JSON.parse(localStorage.getItem(seenKey) || '[]'); } catch {}
  const notifs = raw.filter(n => !seen.includes(n.id));
  setNotifications(notifs);
  setUnseenCount(notifs.length);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching underwriter dashboard:', error);
      setLoading(false);
    }
  }, [user?.username]);

  useEffect(() => {
    fetchUnderwriterDashboard();
  }, [fetchUnderwriterDashboard]);

  const handleBellClick = (e) => {
    setAnchorEl(e.currentTarget);
    const seenKey = `notif_seen_underwriter_${user?.username}`;
    let seen = [];
    try { seen = JSON.parse(localStorage.getItem(seenKey) || '[]'); } catch {}
    const merged = Array.from(new Set([...seen, ...notifications.map(n => n.id)]));
    localStorage.setItem(seenKey, JSON.stringify(merged));
    setNotifications([]);
    setUnseenCount(0);
  };
  const handleBellClose = () => setAnchorEl(null);
  const bellOpen = Boolean(anchorEl);
  const bellId = bellOpen ? 'underwriter-notifs' : undefined;

  const getRiskColor = (score) => {
    if (score < 30) return 'success';
    if (score < 60) return 'warning';
    return 'error';
  };

  // Removed local risk score calculation to avoid duplicate scores on the homepage

  const handleReviewAndDecide = (application) => {
    setSelectedApplication(application);
    setDecisionData({ decision: '', reason: '', premium_amount: '' });
    setDecisionDialogOpen(true);
    setError('');
    setSuccess('');
    setRiskAssessment(null);
    setSimResult(null);
    setSimInput({ deductible: 1000, term: 12 });
    // fetch risk assessment for selected app
    fetchRiskAssessment(application.id);
  };

  const fetchRiskAssessment = async (applicationId) => {
    try {
      setRiskLoading(true);
      setRiskError('');
      const resp = await axios.get(`/underwriter/risk-assessment/${applicationId}`);
      setRiskAssessment(resp.data);
    } catch (e) {
      console.error('Error fetching risk assessment:', e);
      setRiskError(e.response?.data?.detail || 'Failed to fetch risk assessment');
    } finally {
      setRiskLoading(false);
    }
  };

  const runSimulation = async () => {
    if (!selectedApplication?.id) return;
    try {
      setSimLoading(true);
      setSimResult(null);
      const resp = await axios.post(`/underwriter/what-if-simulation/${selectedApplication.id}`,
        { deductible: Number(simInput.deductible) || 0, term: Number(simInput.term) || 0 }
      );
      setSimResult(resp.data);
    } catch (e) {
      console.error('Error running simulation:', e);
      setError(e.response?.data?.detail || 'Failed to run simulation');
    } finally {
      setSimLoading(false);
    }
  };

  // Suggest premium when approving
  useEffect(() => {
    if (
      decisionDialogOpen &&
      decisionData.decision === 'approve' &&
      riskAssessment?.premium_range?.recommended &&
      !decisionData.premium_amount
    ) {
      setDecisionData(d => ({ ...d, premium_amount: String(riskAssessment.premium_range.recommended) }));
    }
  }, [decisionDialogOpen, decisionData.decision, decisionData.premium_amount, riskAssessment]);

  const handleMakeDecision = async () => {
    if (!decisionData.decision || !decisionData.reason || !selectedApplication) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setMakingDecision(true);
      setError('');
      
      const payload = {
        decision: decisionData.decision,
        reason: decisionData.reason
      };
      
      if (decisionData.premium_amount) {
        payload.premium_amount = parseFloat(decisionData.premium_amount);
      }
      
      const response = await axios.post(
        `/underwriter/applications/${selectedApplication.id}/decision`,
        payload
      );
      
      if (response.data.message) {
        setSuccess(`Application ${decisionData.decision}d successfully!`);
        setDecisionDialogOpen(false);
        setDecisionData({ decision: '', reason: '', premium_amount: '' });
        setSelectedApplication(null);
        
        // Refresh the applications list
        await fetchUnderwriterDashboard();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error making decision:', err);
      setError(err.response?.data?.detail || 'Failed to make decision');
    } finally {
      setMakingDecision(false);
    }
  };

  return (
  <Box sx={{ minHeight: '100vh', bgcolor: '#111', color: '#fff' }}>
      <Navbar
        notificationsCount={unseenCount || stats.slaBreach}
        onSupportClick={() => setSupportOpen(true)}
        onNotificationsClick={handleBellClick}
        onLogout={onLogout}
        maxWidth="lg"
      />

      {/* Role welcome and guidance */}
      <Container maxWidth="lg">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">Welcome, {user.username} 🎯</Typography>
          <Typography variant="body2" color="text.secondary">
            As an Underwriter, evaluate risk, set premiums, and make final
            approval or decline decisions on cases marked ready by analysts.
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
        {/* Success/Error Messages */}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', bgcolor: '#181818', color: '#fff', border: '1px solid #222', boxShadow: '0 4px 24px #000a', borderRadius: 4 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">{stats.caseQueue}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Cases in Queue</Typography>
                  </Box>
                  <Assignment sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', bgcolor: '#181818', color: '#fff', border: '1px solid #222', boxShadow: '0 4px 24px #000a', borderRadius: 4 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">{stats.underReview}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Under Review</Typography>
                  </Box>
                  <Schedule sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', bgcolor: '#181818', color: '#fff', border: '1px solid #222', boxShadow: '0 4px 24px #000a', borderRadius: 4 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">{stats.approvedToday}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Approved Today</Typography>
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
                    <Typography variant="h3" fontWeight="bold">{stats.declinedToday}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Declined Today</Typography>
                  </Box>
                  <Cancel sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', bgcolor: '#181818', color: '#fff', border: '1px solid #222', boxShadow: '0 4px 24px #000a', borderRadius: 4 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">{stats.slaBreach}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>SLA Breaches</Typography>
                  </Box>
                  <Warning sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Removed Avg Risk Score card to keep score only in review dialog */}
        </Grid>

        {/* Case Queue */}
        <Card sx={{ mb: 4, bgcolor: '#181818', color: '#fff', border: '1px solid #222', boxShadow: '0 4px 24px #000a', borderRadius: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Underwriting Case Queue</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button startIcon={<FilterList />} size="small" variant="contained" color="primary" sx={{ borderRadius: 2, fontWeight: 700, bgcolor: '#222', color: '#90caf9', '&:hover': { bgcolor: '#333', color: '#fff' } }}>Filter by Risk</Button>
                <Button startIcon={<Refresh />} size="small" onClick={fetchUnderwriterDashboard}>
                  Refresh
                </Button>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {loading ? (
              <LinearProgress />
            ) : applications.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">No cases pending decision</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Application ID</strong></TableCell>
                      <TableCell><strong>Customer</strong></TableCell>
                      <TableCell><strong>Coverage</strong></TableCell>
                      {/* Removed Risk Score column to avoid duplicate score on homepage */}
                      <TableCell><strong>Analyst Notes</strong></TableCell>
                      <TableCell><strong>Time in Queue</strong></TableCell>
                      <TableCell align="right"><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {applications.slice(0, 10).map((app) => {
                      return (
                        <TableRow key={app.id} hover>
                          <TableCell>{app.id}</TableCell>
                          <TableCell>{app.customer_id}</TableCell>
                          <TableCell>
                            <Chip 
                              label={app.data?.coverageNeeds || '$500k'} 
                              size="small"
                              icon={<AttachMoney />}
                            />
                          </TableCell>
                          {/* Removed risk score cell */}
                          <TableCell>
                            <Chip label="All Clear" size="small" color="success" />
                          </TableCell>
                          <TableCell>12 hours</TableCell>
                          <TableCell align="right">
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="warning"
                              onClick={() => handleReviewAndDecide(app)}
                            >
                              Review & Decide
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Risk Assessment Tools & Guidelines */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ bgcolor: '#181818', color: '#fff', border: '1px solid #222', boxShadow: '0 4px 24px #000a', borderRadius: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Risk Assessment Guidelines</Typography>
                <Divider sx={{ my: 2 }} />
                <List>
                  <ListItemButton>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Low Risk (0–30)"
                      secondary="Balanced coverage vs income/assets, low DTI, stable income — standard rates"
                    />
                  </ListItemButton>
                  <ListItemButton>
                    <ListItemIcon>
                      <Warning color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Medium Risk (30–70)"
                      secondary="Some pressure from ratios or age/health/property factors — consider adjustments"
                    />
                  </ListItemButton>
                  <ListItemButton>
                    <ListItemIcon>
                      <Cancel color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary="High Risk (70+)"
                      secondary="Low income or high leverage (DTI/Coverage ratios), adverse type-specific factors — consider decline or request info"
                    />
                  </ListItemButton>
                </List>

                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>How the Score is Calculated:</Typography>
                  <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                    <Typography variant="body2">
                      The model combines core components with weights by insurance type:
                    </Typography>
                    <ul style={{ marginTop: 8, marginBottom: 0 }}>
                      <li><strong>Coverage-to-Income</strong> (stricter): penalizes coverage far above income</li>
                      <li><strong>Debt-to-Income (DTI)</strong> (stricter): higher leverage raises risk quickly</li>
                      <li><strong>Income Level</strong>: low absolute income increases risk</li>
                      <li><strong>Coverage-to-Asset</strong>: insuring above asset value increases risk</li>
                      <li><strong>Type Factors</strong>: e.g., age/health (health/life), driving/mileage/vehicle age (auto), property type/material (property)</li>
                    </ul>
                    <Typography variant="caption" color="text.secondary" style={{ display: 'block', marginTop: 8 }}>
                      Note: Very low income enforces a risk floor to avoid underestimation.
                    </Typography>
                  </Paper>
                </Box>

                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>Key Risk Factors to Consider:</Typography>
                  <Grid container spacing={1}>
                    {[
                      'Coverage-to-Income',
                      'Debt-to-Income (DTI)',
                      'Income Level',
                      'Coverage-to-Asset',
                      'Age vs Policy Type',
                      'Pre-existing Conditions / Health',
                      'Driving/Mileage/Vehicle Age (Auto)',
                      'Property Type/Material (Property)',
                      'Employment Stability',
                      'Credit Score',
                      'Prior Claims'
                    ].map((factor) => (
                      <Grid item key={factor}>
                        <Chip label={factor} size="small" />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#e8f5e9', mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="success.main">
                  📊 Decision Metrics
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Approval Rate</Typography>
                    <Typography variant="body2" fontWeight="bold">87%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={87} color="success" />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">SLA Compliance</Typography>
                    <Typography variant="body2" fontWeight="bold">95%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={95} color="primary" />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Avg Decision Time</Typography>
                    <Typography variant="body2" fontWeight="bold">18h</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={75} color="warning" />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: '#fff3e0' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="warning.main">
                  ⚠️ SLA Targets
                </Typography>
                <Divider sx={{ my: 2 }} />
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="🎯 Decision Time: 48 hours"
                      secondary="Target for final decision"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="📋 Documentation"
                      secondary="Provide detailed rationale"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="💰 Premium Calculation"
                      secondary="Based on risk assessment"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="✅ Quality Check"
                      secondary="Review all analyst notes"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Decision Dialog */}
      <Dialog 
        open={decisionDialogOpen} 
        onClose={() => setDecisionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Make Decision - {selectedApplication?.id}
        </DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Customer: {selectedApplication.customer_id}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Coverage: {selectedApplication.data?.coverageNeeds || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Insurance Type: {selectedApplication.data?.insuranceType || 'N/A'}
              </Typography>
              {/* Risk Assessment Summary */}
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f9fafb', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1">Risk Assessment</Typography>
                  <Button size="small" onClick={() => fetchRiskAssessment(selectedApplication.id)} startIcon={<Refresh />}>
                    Refresh
                  </Button>
                </Box>
                {riskLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <CircularProgress size={18} />
                    <Typography variant="body2">Calculating risk…</Typography>
                  </Box>
                ) : riskError ? (
                  <Alert severity="error" sx={{ mt: 1 }}>{riskError}</Alert>
                ) : riskAssessment ? (
                  <Box>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
                      <Chip label={`Score: ${riskAssessment.risk_score}`} color={getRiskColor(riskAssessment.risk_score)} size="small" />
                      <Chip label={`Level: ${riskAssessment.risk_level}`} size="small" />
                      <Chip label={`Type: ${riskAssessment.insurance_type}`} size="small" />
                    </Box>
                    {riskAssessment.premium_range && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Recommended premium: ${riskAssessment.premium_range.recommended} (range ${riskAssessment.premium_range.min} - ${riskAssessment.premium_range.max})
                        </Typography>
                      </Box>
                    )}
                    {/* Components */}
                    {riskAssessment.components && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2">Components</Typography>
                        <Grid container spacing={1} sx={{ mt: 0.5 }}>
                          {Object.entries(riskAssessment.components).map(([k, v]) => (
                            <Grid item key={k}>
                              <Chip label={`${k}: ${typeof v === 'number' ? v.toFixed(2) : v}`} size="small" />
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}
                    {/* Drivers */}
                    {riskAssessment.top_drivers && riskAssessment.top_drivers.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2">Top Risk Drivers</Typography>
                        <List dense>
                          {riskAssessment.top_drivers.map((d, idx) => (
                            <ListItem key={idx} sx={{ py: 0 }}>
                              <ListItemText primaryTypographyProps={{ variant: 'body2' }} primary={`• ${d}`} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No risk data</Typography>
                )}
              </Box>
              {/* What-if Simulation */}
              <Box sx={{ mt: 2, p: 2, bgcolor: '#fffaf0', borderRadius: 1 }}>
                <Typography variant="subtitle1">What-if Simulation</Typography>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Deductible ($)"
                      type="number"
                      value={simInput.deductible}
                      onChange={(e) => setSimInput({ ...simInput, deductible: e.target.value })}
                      InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Term (months)"
                      type="number"
                      value={simInput.term}
                      onChange={(e) => setSimInput({ ...simInput, term: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button variant="outlined" onClick={runSimulation} disabled={simLoading}>
                      {simLoading ? <CircularProgress size={18} /> : 'Run Simulation'}
                    </Button>
                  </Grid>
                </Grid>
                {simResult && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">Simulated premium: ${simResult.simulated_premium}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Adj: premium {simResult.premium_adjustment}% • term {simResult.term_adjustment}%
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
          
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Decision</InputLabel>
            <Select
              value={decisionData.decision}
              label="Decision"
              onChange={(e) => setDecisionData({ ...decisionData, decision: e.target.value })}
            >
              <MenuItem value="approve">Approve</MenuItem>
              <MenuItem value="decline">Decline</MenuItem>
              <MenuItem value="pend">Pend for Review</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for Decision"
            value={decisionData.reason}
            onChange={(e) => setDecisionData({ ...decisionData, reason: e.target.value })}
            placeholder="Provide detailed reasoning for your decision..."
            sx={{ mb: 2 }}
            required
          />
          
          {decisionData.decision === 'approve' && (
            <TextField
              fullWidth
              label="Premium Amount ($)"
              type="number"
              value={decisionData.premium_amount}
              onChange={(e) => setDecisionData({ ...decisionData, premium_amount: e.target.value })}
              placeholder="Enter monthly premium amount"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDecisionDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleMakeDecision}
            disabled={!decisionData.decision || !decisionData.reason || makingDecision}
            variant="contained"
            color="primary"
          >
            {makingDecision ? <CircularProgress size={20} /> : 'Make Decision'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UnderwriterHomePage;
