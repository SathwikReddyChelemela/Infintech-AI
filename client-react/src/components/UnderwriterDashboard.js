import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  InputAdornment
} from '@mui/material';
import {
  Visibility,
  CheckCircle,
  HealthAndSafety,
  Description,
  Person,
  Home,
  AccessTime,
  Analytics
} from '@mui/icons-material';
import axios from 'axios';

function UnderwriterDashboard({ user }) {
  // Polling for updates - refresh data every 30 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchApplications();
    }, 30000);
    
    return () => {
      clearInterval(pollInterval);
    };
  }, []);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [riskAssessmentDialogOpen, setRiskAssessmentDialogOpen] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [decisionData, setDecisionData] = useState({
    decision: '',
    reason: '',
    premium_amount: ''
  });
  const [makingDecision, setMakingDecision] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/underwriter/case-queue', {
        auth: {
          username: user.username,
          password: user.password
        }
      });
      setApplications(response.data.case_queue || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  }, [user.username, user.password]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleViewApplication = async (application) => {
    try {
      const response = await axios.get(`/underwriter/applications/${application.id}`, {
        auth: {
          username: user.username,
          password: user.password
        }
      });
      setSelectedApplication(response.data);
      setViewDialogOpen(true);
    } catch (error) {
      console.error('Error fetching application details:', error);
      setError('Failed to fetch application details');
    }
  };

  const handleGetRiskAssessment = async (applicationId) => {
    try {
      const response = await axios.get(`/underwriter/risk-assessment/${applicationId}`, {
        auth: {
          username: user.username,
          password: user.password
        }
      });
      setRiskAssessment(response.data);
      setRiskAssessmentDialogOpen(true);
    } catch (error) {
      console.error('Error fetching risk assessment:', error);
      setError('Failed to fetch risk assessment');
    }
  };

  const handleMakeDecision = async () => {
    if (!decisionData.decision || !decisionData.reason || !selectedApplication) return;
    
    try {
      setMakingDecision(true);
      const payload = {
        decision: decisionData.decision,
        reason: decisionData.reason
      };
      
      if (decisionData.premium_amount) {
        payload.premium_amount = parseFloat(decisionData.premium_amount);
      }
      
      await axios.post(`/underwriter/applications/${selectedApplication.application.id}/decision`, payload, {
        auth: {
          username: user.username,
          password: user.password
        }
      });
      
      setDecisionData({ decision: '', reason: '', premium_amount: '' });
      setDecisionDialogOpen(false);
      fetchApplications(); // Refresh the list
    } catch (error) {
      console.error('Error making decision:', error);
      setError('Failed to make decision');
    } finally {
      setMakingDecision(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'warning';
      case 'approved': return 'success';
      case 'declined': return 'error';
      case 'under_review': return 'info';
      default: return 'default';
    }
  };

  const getInsuranceTypeIcon = (type) => {
    switch (type) {
      case 'health': return <HealthAndSafety />;
      case 'auto': return <Description />;
      case 'home': return <Home />;
      case 'life': return <Person />;
      default: return <Description />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {statusMessage && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Status Update:</strong> {statusMessage}
        </Alert>
      )}
      <Typography variant="h4" gutterBottom>
        Underwriter Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Review and make decisions on customers approved by analysts for underwriter review
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {applications.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Cases
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="warning.main">
                {applications.filter(app => app.status === 'submitted').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ready for Review
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="info.main">
                {applications.filter(app => app.status === 'under_review').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Under Review
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {applications.filter(app => app.status === 'approved').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved Today
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Applications Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Approved Customers - Ready for Underwriter Decision
          </Typography>
          
          {applications.length === 0 ? (
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No customers approved by analysts for underwriter review
              </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Application ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Insurance Type</TableCell>
                    <TableCell>Coverage</TableCell>
                    <TableCell>Age</TableCell>
                    <TableCell>Income</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Analyst Ready</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {app.id}
                        </Typography>
                      </TableCell>
                      <TableCell>{app.customer_id}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getInsuranceTypeIcon(app.data?.insuranceType)}
                          <Typography variant="body2">
                            {app.data?.insuranceType?.charAt(0).toUpperCase() + app.data?.insuranceType?.slice(1) || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {app.data?.coverageNeeds ? `$${app.data.coverageNeeds}` : 'N/A'}
                      </TableCell>
                      <TableCell>{app.data?.age || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(app.data?.income)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={app.status.charAt(0).toUpperCase() + app.status.slice(1)} 
                          color={getStatusColor(app.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={app.input_ready ? "Ready" : "Pending"}
                          color={app.input_ready ? "success" : "warning"}
                          size="small"
                          icon={app.input_ready ? <CheckCircle /> : <Schedule />}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewApplication(app)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Risk Assessment">
                            <IconButton 
                              size="small" 
                              onClick={() => handleGetRiskAssessment(app.id)}
                            >
                              <Assessment />
                            </IconButton>
                          </Tooltip>
                          {app.status === 'submitted' && app.input_ready && (
                            <Tooltip title="Make Decision">
                              <IconButton 
                                size="small" 
                                onClick={() => {
                                  setSelectedApplication({ application: app });
                                  setDecisionDialogOpen(true);
                                }}
                              >
                                <Gavel />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* View Application Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Application Details - {selectedApplication?.application?.id}
        </DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Basic Information</Typography>
                  <Typography variant="body2"><strong>Customer:</strong> {selectedApplication.application.customer_id}</Typography>
                  <Typography variant="body2"><strong>Age:</strong> {selectedApplication.application.data?.age || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Insurance Type:</strong> {selectedApplication.application.data?.insuranceType || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Coverage Needs:</strong> {selectedApplication.application.data?.coverageNeeds ? `$${selectedApplication.application.data.coverageNeeds}` : 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Financial Information</Typography>
                  <Typography variant="body2"><strong>Income:</strong> {formatCurrency(selectedApplication.application.data?.income)}</Typography>
                  <Typography variant="body2"><strong>Asset Valuation:</strong> {formatCurrency(selectedApplication.application.data?.assetValuation)}</Typography>
                  <Typography variant="body2"><strong>Total Debt:</strong> {formatCurrency(selectedApplication.application.data?.debt)}</Typography>
                  <Typography variant="body2"><strong>Status:</strong> {selectedApplication.application.status}</Typography>
                  <Typography variant="body2"><strong>Analyst Ready:</strong> {selectedApplication.application.input_ready ? 'Yes' : 'No'}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Documents */}
              {selectedApplication.documents && selectedApplication.documents.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>Documents</Typography>
                  <Grid container spacing={1}>
                    {selectedApplication.documents.map((doc) => (
                      <Grid item xs={12} sm={6} key={doc.id}>
                        <Chip 
                          icon={<Description />}
                          label={doc.filename}
                          variant="outlined"
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Messages */}
              {selectedApplication.messages && selectedApplication.messages.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>Communication History</Typography>
                  {selectedApplication.messages.map((msg) => (
                    <Card key={msg.id} variant="outlined" sx={{ mb: 1 }}>
                      <CardContent sx={{ py: 1 }}>
                        <Typography variant="body2">
                          <strong>{msg.from_role}:</strong> {msg.body}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(msg.created_at)}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Decision Dialog */}
      <Dialog 
        open={decisionDialogOpen} 
        onClose={() => setDecisionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Make Decision</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
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
          >
            {makingDecision ? <CircularProgress size={20} /> : 'Make Decision'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Risk Assessment Dialog */}
      <Dialog 
        open={riskAssessmentDialogOpen} 
        onClose={() => setRiskAssessmentDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Risk Assessment - {riskAssessment?.application_id}
        </DialogTitle>
        <DialogContent>
          {riskAssessment && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Risk Score</Typography>
                      <Typography variant="h3" color="primary">
                        {riskAssessment.risk_score}
                      </Typography>
                      <Chip 
                        label={riskAssessment.risk_level.toUpperCase()}
                        color={riskAssessment.risk_level === 'low' ? 'success' : 
                               riskAssessment.risk_level === 'medium' ? 'warning' : 'error'}
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Premium Range</Typography>
                      <Typography variant="body2">
                        <strong>Min:</strong> {formatCurrency(riskAssessment.premium_range.min)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Max:</strong> {formatCurrency(riskAssessment.premium_range.max)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Recommended:</strong> {formatCurrency(riskAssessment.premium_range.recommended)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>Risk Calculation Breakdown</Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Age Factor</Typography>
                      <Typography variant="h6">{riskAssessment.calculation_breakdown?.age_factor || 0}%</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Coverage/Income</Typography>
                      <Typography variant="h6">{riskAssessment.calculation_breakdown?.coverage_income_ratio || 0}%</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Coverage/Asset</Typography>
                      <Typography variant="h6">{riskAssessment.calculation_breakdown?.coverage_asset_ratio || 0}%</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Debt/Income</Typography>
                      <Typography variant="h6">{riskAssessment.calculation_breakdown?.debt_income_ratio || 0}%</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>Top Risk Drivers</Typography>
              <Box sx={{ mb: 2 }}>
                {riskAssessment.top_drivers.map((driver, index) => (
                  <Chip 
                    key={index}
                    label={driver}
                    variant="outlined"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>

              <Typography variant="h6" gutterBottom>Policy Rules</Typography>
              <Box>
                {riskAssessment.policy_rules.map((rule, index) => (
                  <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                    • {rule}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRiskAssessmentDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UnderwriterDashboard;
