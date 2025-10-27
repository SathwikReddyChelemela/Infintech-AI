import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Alert,
  CircularProgress,
  Chip,
  Paper
} from '@mui/material';
import ApplicationStatusStepper from './ApplicationStatusStepper';
import { CloudUpload, Description } from '@mui/icons-material';
import axios from 'axios';

function CustomerApplication({ user, onApplicationUpdate }) {
  // Polling for updates instead of WebSocket
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (onApplicationUpdate) {
        onApplicationUpdate();
      }
    }, 5000); // Poll every 5 seconds for customer updates
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [onApplicationUpdate]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationData, setApplicationData] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  
  const [formData, setFormData] = useState({
    id: `CUST-${user.username.toUpperCase()}-${Date.now().toString().slice(-6)}`,
    age: '',
    insuranceType: '',
    coverageNeeds: '',
    assetValuation: '',
    income: '',
    debt: '',
    requestedDocs: []
  });

  const insuranceTypes = [
    { value: 'health', label: 'Health Insurance' },
    { value: 'auto', label: 'Auto Insurance' },
    { value: 'home', label: 'Home Insurance' },
    { value: 'life', label: 'Life Insurance' }
  ];

  const coverageOptions = [
    { value: '50k', label: '$50,000' },
    { value: '100k', label: '$100,000' },
    { value: '150k', label: '$150,000' }
  ];

  const checkExistingApplication = useCallback(async () => {
    try {
      const response = await axios.get('/customer/dashboard', {
        auth: {
          username: user.username,
          password: user.password
        }
      });
      
      if (response.data.submitted_applications && response.data.submitted_applications.length > 0) {
        const latestApp = response.data.submitted_applications[0];
        setApplicationData(latestApp);
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Error checking existing application:', error);
    }
  }, [user.username, user.password]);

  useEffect(() => {
    // Check if user already has a submitted application
    checkExistingApplication();
  }, [user.username, checkExistingApplication]); // Add checkExistingApplication as dependency

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setFormData(prev => ({
      ...prev,
      requestedDocs: [...prev.requestedDocs, ...files]
    }));
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      requestedDocs: prev.requestedDocs.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('customer_id', user.username);
      submitData.append('data', JSON.stringify({
        id: formData.id,
        age: formData.age,
        insuranceType: formData.insuranceType,
        coverageNeeds: formData.coverageNeeds,
        assetValuation: formData.assetValuation,
        income: formData.income,
        debt: formData.debt
      }));

      // Append files
      formData.requestedDocs.forEach((file, index) => {
        submitData.append(`documents`, file);
      });

      // Create and submit the application in one step
      const response = await axios.post('/customer/applications', submitData, {
        auth: {
          username: user.username,
          password: user.password
        },
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSuccess('Application submitted successfully!');
      setIsSubmitted(true);
      setApplicationData(response.data.application);
      
      if (onApplicationUpdate) {
        onApplicationUpdate();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.age &&
      formData.insuranceType &&
      formData.coverageNeeds &&
      formData.assetValuation &&
      formData.income &&
      formData.debt
    );
  };

  // Always show the application form in "Start Application" tab
  // The status will be shown in the separate "Application Status" tab

  return (
    <Card>
      <CardContent>
        {statusMessage && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Status Update:</strong> {statusMessage}
          </Alert>
        )}
        <Typography variant="h5" gutterBottom>
          Insurance Application Form
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Grid container spacing={3}>
          {/* Application ID - Auto-filled and read-only */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Application ID"
              value={formData.id}
              InputProps={{
                readOnly: true,
              }}
              variant="filled"
              helperText="Auto-generated and cannot be changed"
            />
          </Grid>
          
          {/* Age */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Age"
              type="number"
              value={formData.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
              required
              inputProps={{ min: 18, max: 100 }}
            />
          </Grid>
          
          {/* Insurance Type */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Insurance Type</InputLabel>
              <Select
                value={formData.insuranceType}
                label="Insurance Type"
                onChange={(e) => handleInputChange('insuranceType', e.target.value)}
              >
                {insuranceTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Coverage Needs */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Coverage Needs</InputLabel>
              <Select
                value={formData.coverageNeeds}
                label="Coverage Needs"
                onChange={(e) => handleInputChange('coverageNeeds', e.target.value)}
              >
                {coverageOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Asset Valuation */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Asset Valuation"
              type="number"
              value={formData.assetValuation}
              onChange={(e) => handleInputChange('assetValuation', e.target.value)}
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              inputProps={{ min: 0 }}
            />
          </Grid>
          
          {/* Income */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Annual Income"
              type="number"
              value={formData.income}
              onChange={(e) => handleInputChange('income', e.target.value)}
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              inputProps={{ min: 0 }}
            />
          </Grid>
          
          {/* Debt */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Total Debt"
              type="number"
              value={formData.debt}
              onChange={(e) => handleInputChange('debt', e.target.value)}
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              inputProps={{ min: 0 }}
            />
          </Grid>
          
          {/* File Upload */}
          <Grid item xs={12}>
            <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center' }}>
              <input
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                id="file-upload"
                multiple
                type="file"
                onChange={handleFileUpload}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUpload />}
                  sx={{ mb: 2 }}
                >
                  Upload Requested Documents
                </Button>
              </label>
              <Typography variant="body2" color="text.secondary">
                Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG
              </Typography>
            </Box>
            
            {/* Display uploaded files */}
            {formData.requestedDocs.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Uploaded Files:
                </Typography>
                {formData.requestedDocs.map((file, index) => (
                  <Chip
                    key={index}
                    icon={<Description />}
                    label={file.name}
                    onDelete={() => removeFile(index)}
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !isFormValid()}
            size="large"
          >
            {loading ? <CircularProgress size={24} /> : 'Submit Application'}
          </Button>
        </Box>
        
        {!isFormValid() && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Please complete all required fields before submitting
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default CustomerApplication;
