import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  IconButton
} from '@mui/material';
import {
  Close,
  ExpandMore,
  CheckCircle,
  Warning,
  Description,
  Verified,
  Person,
  Policy,
  AttachFile,
  ThumbUp,
  ThumbDown
} from '@mui/icons-material';
import axios from 'axios';

function ApplicationReviewDialog({ open, onClose, applicationId, user }) {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [verificationResults, setVerificationResults] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState('');

  // Debug: Log when dialog props change
  useEffect(() => {
    console.log('📋 ApplicationReviewDialog Props:', {
      open,
      applicationId,
      user: user?.username
    });
  }, [open, applicationId, user]);

  const fetchApplicationDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    // Ensure stale verification state doesn't bleed into a new application
    setVerificationResults(null);
    try {
      console.log('🌐 API Call: GET /analyst/applications/' + applicationId);
      // JWT token is automatically added by axios interceptor
      const response = await axios.get(`/analyst/applications/${applicationId}`);
      console.log('✅ Application data received:', response.data);
  setApplication(response.data.application);
  setDocuments(response.data.documents || []);
      
      // Check if verification already exists
      if (response.data.application.verification_data) {
        setVerificationResults(response.data.application.verification_data.verification_results);
      } else {
        // Explicitly clear if none on this application
        setVerificationResults(null);
      }
    } catch (err) {
      console.error('❌ Error fetching application:', err);
      console.error('Error response:', err.response?.data);
      setError('Failed to load application details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    if (open && applicationId) {
      console.log('🔄 Fetching application details for:', applicationId);
      fetchApplicationDetails();
    }
  }, [open, applicationId, fetchApplicationDetails]);

  // When dialog closes or applicationId changes, proactively reset transient state
  useEffect(() => {
    if (!open) {
      setApplication(null);
      setDocuments([]);
      setVerificationResults(null);
      setRejectReason('');
      setError('');
    }
  }, [open]);

  const handleVerifyDocument = async () => {
    setVerifying(true);
    setError('');
    try {
      if (!documents || documents.length === 0) {
        setError('No supporting documents uploaded for this application');
        return;
      }
      // JWT token is automatically added by axios interceptor
      const response = await axios.post(
        `/analyst/applications/${applicationId}/verify-document`,
        {}
      );
      
      if (response.data.success) {
        setVerificationResults(response.data.verification_results);
        await fetchApplicationDetails(); // Refresh to get updated data
      } else {
        setError(response.data.message || 'Verification failed');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to verify document');
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  const handleApprove = async () => {
    setProcessing(true);
    setError('');
    try {
      // JWT token is automatically added by axios interceptor
      const response = await axios.post(
        `/analyst/applications/${applicationId}/approve`,
        {}
      );
      
      if (response.data.success) {
        alert('Application approved and sent to underwriter!');
        onClose(true); // Pass true to indicate refresh needed
      } else {
        setError(response.data.message || 'Approval failed');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to approve application');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    
    setProcessing(true);
    setError('');
    try {
      // JWT token is automatically added by axios interceptor
      const response = await axios.post(
        `/analyst/applications/${applicationId}/reject?reason=${encodeURIComponent(rejectReason)}`,
        {}
      );
      
      if (response.data.success) {
        alert('Application rejected');
        onClose(true);
      } else {
        setError(response.data.message || 'Rejection failed');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reject application');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} maxWidth="md" fullWidth>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
        </DialogContent>
      </Dialog>
    );
  }

  if (!application) {
    return null;
  }

  const appData = application.data || {};
  const isVerified = !!verificationResults;
  const verificationStatus = verificationResults?.overall_status || 'not_verified';

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Application Review - {applicationId}</Typography>
          <IconButton onClick={() => onClose(false)}>
            <Close />
          </IconButton>
        </Box>
        <Box sx={{ mt: 1 }}>
          <Chip 
            label={application.status} 
            color={application.status === 'submitted' ? 'warning' : 'default'}
            size="small"
            sx={{ mr: 1 }}
          />
          {isVerified && (
            <Chip 
              icon={<Verified />}
              label={`Verified: ${verificationStatus}`}
              color={verificationStatus === 'verified' ? 'success' : 'warning'}
              size="small"
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Application Overview */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Description sx={{ mr: 1 }} />
            <Typography variant="h6">Application Overview</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Application ID</Typography>
                <Typography variant="body1">{application.id || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Customer ID</Typography>
                <Typography variant="body1">{application.customer_id || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Typography variant="body1">{application.status || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Created At</Typography>
                <Typography variant="body1">
                  {application.created_at ? new Date(application.created_at).toLocaleString() : 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Personal Information */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Person sx={{ mr: 1 }} />
            <Typography variant="h6">Personal Information</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Full Name</Typography>
                <Typography variant="body1">{appData.fullName || appData.name || application.customer_id || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Date of Birth</Typography>
                <Typography variant="body1">{appData.dateOfBirth || 'N/A'}</Typography>
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
                <Typography variant="caption" color="text.secondary">Marital Status</Typography>
                <Typography variant="body1">{appData.maritalStatus || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Occupation</Typography>
                <Typography variant="body1">{appData.occupation || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Address</Typography>
                <Typography variant="body1">{appData.address || 'N/A'}</Typography>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Policy Details */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Policy sx={{ mr: 1 }} />
            <Typography variant="h6">Policy Details</Typography>
          </AccordionSummary>
          <AccordionDetails>
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
                <Typography variant="caption" color="text.secondary">Deductible</Typography>
                <Typography variant="body1">{appData.deductible || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Asset Valuation</Typography>
                <Typography variant="body1">${appData.assetValuation || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Total Debt</Typography>
                <Typography variant="body1">${appData.debt || 'N/A'}</Typography>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Insurance Type Specific Details */}
        {appData.insuranceType && (
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Description sx={{ mr: 1 }} />
              <Typography variant="h6">{appData.insuranceType} Insurance Details</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {appData.insuranceType === 'Auto' && (
                  <>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Vehicle Make</Typography>
                      <Typography variant="body1">{appData.vehicleMake || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Vehicle Model</Typography>
                      <Typography variant="body1">{appData.vehicleModel || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Vehicle Year</Typography>
                      <Typography variant="body1">{appData.vehicleYear || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Driving History</Typography>
                      <Typography variant="body1">{appData.drivingHistory || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Annual Mileage</Typography>
                      <Typography variant="body1">{appData.annualMileage || 'N/A'}</Typography>
                    </Grid>
                  </>
                )}
                {appData.insuranceType === 'Health' && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Medical History</Typography>
                      <Typography variant="body1">{appData.medicalHistory || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Pre-existing Conditions</Typography>
                      <Typography variant="body1">{appData.preExistingConditions || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Family History</Typography>
                      <Typography variant="body1">{appData.familyHistory || 'N/A'}</Typography>
                    </Grid>
                  </>
                )}
                {appData.insuranceType === 'Life' && (
                  <>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Smoking Status</Typography>
                      <Typography variant="body1">{appData.smokingStatus || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Health Condition</Typography>
                      <Typography variant="body1">{appData.healthCondition || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Coverage Term</Typography>
                      <Typography variant="body1">{appData.coverageTerm || 'N/A'}</Typography>
                    </Grid>
                  </>
                )}
                {appData.insuranceType === 'Property' && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Property Location</Typography>
                      <Typography variant="body1">{appData.propertyLocation || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Property Type</Typography>
                      <Typography variant="body1">{appData.propertyType || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Construction Material</Typography>
                      <Typography variant="body1">{appData.constructionMaterial || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Property Value</Typography>
                      <Typography variant="body1">${appData.propertyValue || 'N/A'}</Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Document Verification */}
        <Accordion defaultExpanded={!isVerified}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <AttachFile sx={{ mr: 1 }} />
            <Typography variant="h6">Document Verification</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {!isVerified ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                {documents.length === 0 ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    No supporting documents found for this application. Ask the customer to upload a document before verification.
                  </Alert>
                ) : (
                  <>
                    <Typography variant="body1" gutterBottom>
                      Document verification has not been performed yet
                    </Typography>
                    <List dense sx={{ maxWidth: 480, mx: 'auto', textAlign: 'left', mb: 2 }}>
                      {documents.map((doc, idx) => (
                        <ListItem key={idx}>
                          <ListItemText
                            primary={doc.filename || 'Document'}
                            secondary={`Type: ${doc.type || 'supporting_document'}${doc.file_size ? ` • Size: ${doc.file_size} bytes` : ''}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={verifying ? <CircularProgress size={20} /> : <Verified />}
                  onClick={handleVerifyDocument}
                  disabled={verifying || documents.length === 0}
                  sx={{ mt: 2 }}
                >
                  {verifying ? 'Verifying...' : 'Verify Document with LLM'}
                </Button>

                {documents.length === 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Reject Application
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Provide a reason for rejection. The customer will be notified.
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Rejection Reason"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="E.g., Missing required documents. Please upload a valid ID proof."
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<ThumbDown />}
                        onClick={handleReject}
                        disabled={processing || !rejectReason.trim()}
                        sx={{ mt: 2 }}
                      >
                        Reject
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            ) : (
              <Box>
                <Alert 
                  severity={verificationStatus === 'verified' ? 'success' : 'warning'}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="body2">
                    <strong>Verification Status:</strong> {verificationStatus.toUpperCase()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Confidence Score:</strong> {(verificationResults.confidence_score * 100).toFixed(1)}%
                  </Typography>
                </Alert>

                {verificationResults.matches && verificationResults.matches.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      <CheckCircle color="success" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Verified Fields
                    </Typography>
                    <List dense>
                      {verificationResults.matches.map((match, idx) => (
                        <ListItem key={idx}>
                          <ListItemText
                            primary={match.field}
                            secondary={`Application: ${match.application_value} | Document: ${match.document_value}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {verificationResults.mismatches && verificationResults.mismatches.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      <Warning color="error" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Mismatches Found
                    </Typography>
                    <List dense>
                      {verificationResults.mismatches.map((mismatch, idx) => (
                        <ListItem key={idx}>
                          <ListItemText
                            primary={
                              <Box>
                                <Chip label={mismatch.severity} size="small" color="error" sx={{ mr: 1 }} />
                                {mismatch.field}
                              </Box>
                            }
                            secondary={
                              <>
                                <Typography variant="caption" display="block">
                                  {mismatch.message}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Application: {mismatch.application_value}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Document: {mismatch.document_value}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Verified />}
                  onClick={handleVerifyDocument}
                  disabled={verifying}
                  sx={{ mt: 2 }}
                >
                  Re-verify Document
                </Button>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Rejection Reason (if rejecting) */}
        {processing && (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Rejection Reason (Required)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Provide detailed reason for rejection..."
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 1 }}>
        <Button onClick={() => onClose(false)} disabled={processing}>
          Close
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {(documents.length === 0 || isVerified) && (
            <TextField
              size="small"
              label="Rejection Reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Provide reason for rejection"
              sx={{ minWidth: 320 }}
            />
          )}
          <Button
            variant="outlined"
            color="error"
            startIcon={<ThumbDown />}
            onClick={handleReject}
            disabled={
              processing ||
              // Block rejection if there ARE documents but not verified yet
              (!isVerified && documents.length > 0) ||
              // Always require a reason when rejecting
              !rejectReason.trim()
            }
            sx={{ mr: 1 }}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<ThumbUp />}
            onClick={handleApprove}
            disabled={processing || !isVerified || verificationStatus !== 'verified'}
          >
            Approve & Send to Underwriter
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

export default ApplicationReviewDialog;
