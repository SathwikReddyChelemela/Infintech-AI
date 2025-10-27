import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Divider,
  IconButton,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  List
} from '@mui/material';
import {
  Close,
  CheckCircle,
  HourglassEmpty,
  Cancel,
  Description,
  Person,
  Gavel,
  ThumbUp,
  Refresh,
  Timeline
} from '@mui/icons-material';
import axios from 'axios';

const statusSteps = [
  {
    label: 'Application Submitted',
    key: 'submitted',
    icon: <Description />,
    description: 'Your application has been received'
  },
  {
    label: 'Analyst Review',
    key: 'analyst_review',
    icon: <Person />,
    description: 'Data verification and document validation in progress'
  },
  {
    label: 'Underwriter Review',
    key: 'underwriter_review',
    icon: <Gavel />,
    description: 'Risk assessment and final decision'
  },
  {
    label: 'Final Decision',
    key: 'completed',
    icon: <ThumbUp />,
    description: 'Application processed'
  }
];

const statusColors = {
  'submitted': 'warning',
  'analyst_review': 'info',
  'analyst_approved': 'success',
  'underwriter_review': 'info',
  'approved': 'success',
  'rejected': 'error',
  'declined': 'error',
  'needs_info': 'warning'
};

const statusLabels = {
  'submitted': 'Submitted',
  'analyst_review': 'Analyst Review',
  'analyst_approved': 'Analyst Approved',
  'underwriter_review': 'Underwriter Review',
  'approved': 'Approved ✅',
  'rejected': 'Rejected ❌',
  'declined': 'Declined ❌',
  'needs_info': 'More Info Needed'
};

function ApplicationStatusDialog({ open, onClose, user, onAddPayment }) {
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [payMsg, setPayMsg] = useState('');
  const [receipt, setReceipt] = useState(null);

  // Refs to prevent re-render loops on refresh
  const selectedIdRef = useRef(null);
  const selectedUpdatedAtRef = useRef(null);

  const fetchApplications = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError('');

    try {
      // JWT token is automatically added by axios interceptor
      const response = await axios.get('/customer/dashboard');

      const submittedApps = response.data.submitted_applications || [];
      setApplications(submittedApps);

      // If an app is selected, update it only when changed (avoid loops)
      const selId = selectedIdRef.current;
      if (selId) {
        const updatedApp = submittedApps.find(app => app.id === selId);
        if (updatedApp) {
          const prevUpdatedAt = selectedUpdatedAtRef.current;
          const nextUpdatedAt = updatedApp.updated_at || updatedApp.updatedAt;
          // Update only when actually changed
          if (prevUpdatedAt !== nextUpdatedAt) {
            setSelectedApp(updatedApp);
            selectedUpdatedAtRef.current = nextUpdatedAt;
          }
        }
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load and auto-refresh every 10s while open
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      if (!cancelled) await fetchApplications(false);
    })();
    const timer = setInterval(() => fetchApplications(true), 10000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [open, fetchApplications]);

  const getActiveStep = (application) => {
    const status = application.status;
    const state = application.state;
    
  // Final Decision is the 4th item (index 3)
  if (status === 'approved' || status === 'rejected' || status === 'declined') return 3;
    if (state === 'underwriter_review' || status === 'underwriter_review') return 2;
    if (state === 'analyst_review' || status === 'analyst_approved') return 1;
    if (status === 'submitted') return 0;
    return 0;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle color="success" />;
  case 'rejected': return <Cancel color="error" />;
  case 'declined': return <Cancel color="error" />;
      case 'analyst_approved': return <CheckCircle color="success" />;
      default: return <HourglassEmpty color="warning" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderApplicationDetails = () => {
    if (!selectedApp) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Select an application to view details
          </Typography>
        </Box>
      );
    }

    const activeStep = getActiveStep(selectedApp);
    const appData = selectedApp.data || {};

    return (
      <Box>
        {/* Status Header */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Typography variant="h6" gutterBottom>
                Application: {selectedApp.id}
              </Typography>
              <Chip 
                label={statusLabels[selectedApp.status] || selectedApp.status}
                color={statusColors[selectedApp.status] || 'default'}
                icon={getStatusIcon(selectedApp.status)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block">
                Submitted
              </Typography>
              <Typography variant="body2">
                {formatDate(selectedApp.created_at)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Last Updated
              </Typography>
              <Typography variant="body2">
                {formatDate(selectedApp.updated_at)}
              </Typography>
            </Grid>
          </Grid>
          {selectedApp.status === 'rejected' && selectedApp.rejection_reason && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <strong>Rejection Reason:</strong> {selectedApp.rejection_reason}
            </Alert>
          )}
          {selectedApp.status === 'declined' && selectedApp.decision_reason && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <strong>Decline Reason:</strong> {selectedApp.decision_reason}
            </Alert>
          )}
          {selectedApp.status === 'approved' && (selectedApp.decision_reason || selectedApp.premium_range) && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {selectedApp.decision_reason && (
                <>
                  <strong>Approval Notes:</strong> {selectedApp.decision_reason}
                </>
              )}
              {selectedApp.premium_range && (
                <Typography variant="body2" component="div" sx={{ mt: selectedApp.decision_reason ? 1 : 0 }}>
                  <strong>Premium Range:</strong> ${selectedApp.premium_range.min} - ${selectedApp.premium_range.max}
                </Typography>
              )}
            </Alert>
          )}
          {selectedApp.status === 'approved' && (
            <Box sx={{ mt: 2 }}>
              {selectedApp.payment_status === 'paid' ? (
                <Box>
                  <Alert severity="success">
                    Payment received on {selectedApp.paid_at ? new Date(selectedApp.paid_at).toLocaleString() : '—'}. Receipt: {selectedApp.payment_receipt_id || '—'}
                    {selectedApp.policy_number && (
                      <Typography variant="body2" component="div"><strong>Policy Number:</strong> {selectedApp.policy_number}</Typography>
                    )}
                  </Alert>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button size="small" variant="outlined" onClick={async () => {
                      try {
                        const resp = await axios.get(`/customer/applications/${selectedApp.id}/payment`);
                        setReceipt(resp.data?.receipt || null);
                      } catch (e) {
                        setReceipt(null);
                      }
                    }}>View Receipt</Button>
                    {receipt && (
                      <Typography variant="caption" color="text.secondary">
                        {receipt.status} • {receipt.currency} {receipt.amount} • **** {receipt.method_last4} • {receipt.created_at ? new Date(receipt.created_at).toLocaleString() : ''}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={paying}
                    onClick={async () => {
                      try {
                        setPaying(true);
                        setPayMsg('');
                        const resp = await axios.post(`/customer/applications/${selectedApp.id}/pay`);
                        setPayMsg(resp.data?.message || 'Payment completed');
                        // Refresh selected app from latest list
                        await fetchApplications(true);
                      } catch (e) {
                        const raw = e.response?.data?.detail || 'Payment failed';
                        const msg = /maintain|maintance|maintenance|disabled/i.test(raw) ? 'payment is disabled' : raw;
                        setPayMsg(msg);
                      } finally {
                        setPaying(false);
                      }
                    }}
                  >
                    {paying ? <CircularProgress size={20} /> : 'Pay Now'}
                  </Button>
                  {payMsg && payMsg.includes('No saved payment method') && (
                    <Typography variant="caption" color="text.secondary">
                      Payment is disabled
                    </Typography>
                  )}
                  {payMsg && <Typography variant="body2" color="text.secondary">{payMsg}</Typography>}
                </Box>
              )}
            </Box>
          )}
        </Paper>

        {/* Progress Stepper */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Timeline sx={{ mr: 1 }} />
            <Typography variant="h6">Application Progress</Typography>
          </Box>
          <Stepper activeStep={activeStep} orientation="vertical">
            {statusSteps.map((step, index) => (
              <Step key={step.key} completed={index < activeStep}>
                <StepLabel
                  icon={step.icon}
                  optional={
                    index === activeStep && (
                      <Chip 
                        label="In Progress" 
                        size="small" 
                        color="primary" 
                      />
                    )
                  }
                >
                  {step.label}
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                  
                  {/* Additional info for each step */}
                  {index === 1 && selectedApp.analyst_id && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      Reviewed by: {selectedApp.analyst_id}
                      {selectedApp.analyst_approved_at && (
                        <Typography variant="caption" display="block">
                          Approved: {formatDate(selectedApp.analyst_approved_at)}
                        </Typography>
                      )}
                    </Alert>
                  )}
                  
                  {index === 2 && selectedApp.underwriter_id && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      Assigned to: {selectedApp.underwriter_id}
                    </Alert>
                  )}
                  
                  {selectedApp.status === 'rejected' && selectedApp.rejection_reason && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      <strong>Rejection Reason:</strong> {selectedApp.rejection_reason}
                    </Alert>
                  )}
                  
                  {selectedApp.status === 'approved' && (
                    <>
                      {selectedApp.approval_details && (
                        <Alert severity="success" sx={{ mt: 1 }}>
                          <strong>Premium:</strong> ${selectedApp.approval_details.premium}/month
                          <br />
                          <strong>Policy Number:</strong> {selectedApp.approval_details.policy_number}
                        </Alert>
                      )}
                      {(selectedApp.decision_reason || selectedApp.premium_range) && (
                        <Alert severity="success" sx={{ mt: 1 }}>
                          {selectedApp.decision_reason && (
                            <Typography variant="body2"><strong>Approval Notes:</strong> {selectedApp.decision_reason}</Typography>
                          )}
                          {selectedApp.premium_range && (
                            <Typography variant="body2"><strong>Premium Range:</strong> ${selectedApp.premium_range.min} - ${selectedApp.premium_range.max}</Typography>
                          )}
                        </Alert>
                      )}
                    </>
                  )}
                  {selectedApp.status === 'declined' && selectedApp.decision_reason && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      <strong>Decline Reason:</strong> {selectedApp.decision_reason}
                    </Alert>
                  )}
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Application Summary */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Application Summary</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">Insurance Type</Typography>
              <Typography variant="body1">{appData.insuranceType || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">Coverage Amount</Typography>
              <Typography variant="body1">{appData.coverageAmount || appData.coverageNeeds || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">Policy Term</Typography>
              <Typography variant="body1">{appData.policyTerm || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">Applicant Name</Typography>
              <Typography variant="body1">{appData.fullName || appData.name || selectedApp.customer_id || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">Age</Typography>
              <Typography variant="body1">{appData.age || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">Annual Income</Typography>
              <Typography variant="body1">${appData.annualIncome || appData.income || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">Asset Valuation</Typography>
              <Typography variant="body1">${appData.assetValuation || appData.propertyValue || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">Total Debt</Typography>
              <Typography variant="body1">${appData.debt || appData.totalDebt || 'N/A'}</Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Verification Status */}
        {selectedApp.verification_data && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Document Verification</Typography>
            <Divider sx={{ mb: 2 }} />
            {selectedApp.verification_data.verification_results && (
              <Box>
                <Chip 
                  label={`Status: ${selectedApp.verification_data.verification_results.overall_status}`}
                  color={selectedApp.verification_data.verification_results.overall_status === 'verified' ? 'success' : 'warning'}
                  sx={{ mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Confidence Score: {(selectedApp.verification_data.verification_results.confidence_score * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Verified by: {selectedApp.verification_data.verified_by}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Verified at: {formatDate(selectedApp.verification_data.verified_at)}
                </Typography>
              </Box>
            )}
          </Paper>
        )}
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">My Applications</Typography>
          <Box>
            <IconButton 
              onClick={() => fetchApplications()} 
              disabled={loading || refreshing}
              sx={{ mr: 1 }}
            >
              {refreshing ? <CircularProgress size={24} /> : <Refresh />}
            </IconButton>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>
        {refreshing && (
          <Typography variant="caption" color="primary">
            Auto-refreshing...
          </Typography>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : applications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Description sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No applications found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Submit your first insurance application to get started
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Applications List */}
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Your Applications ({applications.length})
              </Typography>
              <List sx={{ maxHeight: 600, overflow: 'auto' }}>
                {applications.map((app) => (
                  <Card 
                    key={app.id}
                    sx={{ 
                      mb: 2,
                      cursor: 'pointer',
                      border: selectedApp?.id === app.id ? 2 : 0,
                      borderColor: 'primary.main',
                      '&:hover': { boxShadow: 3 }
                    }}
                    onClick={() => {
                      setSelectedApp(app);
                      selectedIdRef.current = app.id;
                      selectedUpdatedAtRef.current = app.updated_at || app.updatedAt;
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                        <Typography variant="subtitle2" noWrap>
                          {app.id}
                        </Typography>
                        {getStatusIcon(app.status)}
                      </Box>
                      <Chip 
                        label={statusLabels[app.status] || app.status}
                        color={statusColors[app.status] || 'default'}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {app.data?.insuranceType || 'Insurance'} - {app.data?.coverageAmount || app.data?.coverageNeeds || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Submitted: {new Date(app.created_at).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </List>
            </Grid>

            {/* Application Details */}
            <Grid item xs={12} md={8}>
              {renderApplicationDetails()}
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>
          Auto-refreshes every 10 seconds
        </Typography>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}


const Footer = () => (
  <Box sx={{ mt: 8, py: 2, bgcolor: 'background.paper', textAlign: 'center', color: 'text.secondary', fontSize: 14 }}>
    All rights reserved to Sathwik Reddy Chelemela
  </Box>
);

// At the end of the file, after the main component export, export Footer for use in parent or render it after the Dialog if needed.

export default ApplicationStatusDialog;
