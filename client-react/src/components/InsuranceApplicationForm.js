import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  
} from '@mui/material';
import {
  Close,
  AttachFile,
  CloudUpload,
  CheckCircle
} from '@mui/icons-material';
import axios from 'axios';

const steps = ['Personal Information', 'Policy Details', 'Additional Information', 'Document Upload'];

const maritalStatusOptions = ['Single', 'Married', 'Divorced', 'Widowed'];
const occupationOptions = [
  'Employed - Private Sector',
  'Employed - Government',
  'Self-Employed',
  'Business Owner',
  'Retired',
  'Student',
  'Homemaker',
  'Other'
];

const insuranceTypes = ['Auto', 'Health', 'Life', 'Property'];

const coverageAmounts = {
  Auto: ['$25,000', '$50,000', '$100,000', '$250,000', '$500,000'],
  Health: ['$50,000', '$100,000', '$250,000', '$500,000', '$1,000,000'],
  Life: ['$100,000', '$250,000', '$500,000', '$1,000,000', '$2,000,000', '$5,000,000'],
  Property: ['$100,000', '$250,000', '$500,000', '$1,000,000', '$2,000,000']
};

const policyTerms = {
  Auto: ['6 months', '1 year', '2 years'],
  Health: ['1 year', '2 years', '3 years'],
  Life: ['10 years', '20 years', '30 years', 'Whole Life'],
  Property: ['1 year', '3 years', '5 years']
};

const deductibles = {
  Auto: ['$250', '$500', '$1,000', '$2,500'],
  Health: ['$500', '$1,000', '$2,500', '$5,000', '$10,000'],
  Life: ['None', '$500', '$1,000'],
  Property: ['$500', '$1,000', '$2,500', '$5,000']
};

function InsuranceApplicationForm({ open, onClose, user }) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  // Form data state
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    dateOfBirth: '',
    annualIncome: '',
    maritalStatus: '',
    occupation: '',
    address: '',
    
    // Policy Details
    insuranceType: '',
    coverageAmount: '',
    policyTerm: '',
    deductible: '',
    
    // Auto Insurance specific
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    drivingHistory: '',
    annualMileage: '',
    
    // Health Insurance specific
    medicalHistory: '',
    preExistingConditions: '',
    familyHistory: '',
    
    // Life Insurance specific
    smokingStatus: '',
    healthCondition: '',
    coverageTerm: '',
    
    // Property Insurance specific
    propertyLocation: '',
    propertyType: '',
    constructionMaterial: '',
    propertyValue: ''
  });

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
    setError('');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (300KB = 307200 bytes)
      if (file.size > 307200) {
        setError('File size must not exceed 300KB');
        return;
      }
      
      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only PDF, JPEG, and PNG files are allowed');
        return;
      }
      
      setUploadedFile(file);
      setError('');
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  const validateStep = (step) => {
    switch (step) {
      case 0: // Personal Information
        if (!formData.fullName || !formData.dateOfBirth || !formData.annualIncome ||
            !formData.maritalStatus || !formData.occupation || !formData.address) {
          setError('Please fill in all personal information fields');
          return false;
        }
        break;
      case 1: // Policy Details
        if (!formData.insuranceType || !formData.coverageAmount ||
            !formData.policyTerm || !formData.deductible) {
          setError('Please fill in all policy details');
          return false;
        }
        break;
      case 2: // Additional Information
        if (formData.insuranceType === 'Auto') {
          if (!formData.vehicleMake || !formData.vehicleModel || !formData.vehicleYear ||
              !formData.drivingHistory || !formData.annualMileage) {
            setError('Please fill in all auto insurance fields');
            return false;
          }
        } else if (formData.insuranceType === 'Health') {
          if (!formData.medicalHistory || !formData.preExistingConditions || !formData.familyHistory) {
            setError('Please fill in all health insurance fields');
            return false;
          }
        } else if (formData.insuranceType === 'Life') {
          if (!formData.smokingStatus || !formData.healthCondition || !formData.coverageTerm) {
            setError('Please fill in all life insurance fields');
            return false;
          }
        } else if (formData.insuranceType === 'Property') {
          if (!formData.propertyLocation || !formData.propertyType ||
              !formData.constructionMaterial || !formData.propertyValue) {
            setError('Please fill in all property insurance fields');
            return false;
          }
        }
        break;
      case 3: // Document Upload
        if (!uploadedFile) {
          setError('Please upload a supporting document');
          return false;
        }
        break;
      default:
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
      setError('');
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Generate application ID
      const applicationId = `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Add form data
      submitData.append('applicationId', applicationId);
      submitData.append('customerId', user.username);
      submitData.append('status', 'submitted');
      submitData.append('submittedAt', new Date().toISOString());
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      });
      
      // Add document
      if (uploadedFile) {
        submitData.append('document', uploadedFile);
      }

      // Submit to backend
      // Note: JWT token is automatically added by axios interceptor in index.js
      const response = await axios.post('/customer/application', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Application submitted:', response.data);
      setSuccess(true);
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err) {
      console.error('Error submitting application:', err);
      setError(err.response?.data?.detail || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Reset form
      setFormData({
        fullName: '',
        dateOfBirth: '',
        annualIncome: '',
        maritalStatus: '',
        occupation: '',
        address: '',
        insuranceType: '',
        coverageAmount: '',
        policyTerm: '',
        deductible: '',
        vehicleMake: '',
        vehicleModel: '',
        vehicleYear: '',
        drivingHistory: '',
        annualMileage: '',
        medicalHistory: '',
        preExistingConditions: '',
        familyHistory: '',
        smokingStatus: '',
        healthCondition: '',
        coverageTerm: '',
        propertyLocation: '',
        propertyType: '',
        constructionMaterial: '',
        propertyValue: ''
      });
      setActiveStep(0);
      setError('');
      setSuccess(false);
      setUploadedFile(null);
      onClose();
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Personal Information</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.fullName}
                onChange={handleChange('fullName')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange('dateOfBirth')}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Annual Salary/Income"
                type="number"
                value={formData.annualIncome}
                onChange={handleChange('annualIncome')}
                InputProps={{ startAdornment: '$' }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Marital Status"
                value={formData.maritalStatus}
                onChange={handleChange('maritalStatus')}
                required
              >
                {maritalStatusOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Occupation"
                value={formData.occupation}
                onChange={handleChange('occupation')}
                required
              >
                {occupationOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={handleChange('address')}
                multiline
                rows={2}
                required
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Policy Details</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Insurance Policy Type"
                value={formData.insuranceType}
                onChange={handleChange('insuranceType')}
                required
              >
                {insuranceTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type} Insurance
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Coverage Amount / Sum Insured"
                value={formData.coverageAmount}
                onChange={handleChange('coverageAmount')}
                required
                disabled={!formData.insuranceType}
              >
                {formData.insuranceType && coverageAmounts[formData.insuranceType]?.map((amount) => (
                  <MenuItem key={amount} value={amount}>
                    {amount}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Policy Term / Duration"
                value={formData.policyTerm}
                onChange={handleChange('policyTerm')}
                required
                disabled={!formData.insuranceType}
              >
                {formData.insuranceType && policyTerms[formData.insuranceType]?.map((term) => (
                  <MenuItem key={term} value={term}>
                    {term}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Deductible / Excess"
                value={formData.deductible}
                onChange={handleChange('deductible')}
                required
                disabled={!formData.insuranceType}
              >
                {formData.insuranceType && deductibles[formData.insuranceType]?.map((ded) => (
                  <MenuItem key={ded} value={ded}>
                    {ded}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Additional Information - {formData.insuranceType} Insurance
              </Typography>
            </Grid>
            
            {formData.insuranceType === 'Auto' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Vehicle Make"
                    value={formData.vehicleMake}
                    onChange={handleChange('vehicleMake')}
                    placeholder="e.g., Toyota, Honda, Ford"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Vehicle Model"
                    value={formData.vehicleModel}
                    onChange={handleChange('vehicleModel')}
                    placeholder="e.g., Camry, Accord, F-150"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Vehicle Year"
                    type="number"
                    value={formData.vehicleYear}
                    onChange={handleChange('vehicleYear')}
                    placeholder="e.g., 2020"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Annual Mileage"
                    type="number"
                    value={formData.annualMileage}
                    onChange={handleChange('annualMileage')}
                    placeholder="Miles per year"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    select
                    label="Driving History"
                    value={formData.drivingHistory}
                    onChange={handleChange('drivingHistory')}
                    required
                  >
                    <MenuItem value="Clean">Clean Record</MenuItem>
                    <MenuItem value="Minor Violations">Minor Violations</MenuItem>
                    <MenuItem value="Major Violations">Major Violations</MenuItem>
                    <MenuItem value="Accidents">Previous Accidents</MenuItem>
                  </TextField>
                </Grid>
              </>
            )}

            {formData.insuranceType === 'Health' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Medical History"
                    value={formData.medicalHistory}
                    onChange={handleChange('medicalHistory')}
                    multiline
                    rows={3}
                    placeholder="Please describe your medical history"
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Pre-existing Conditions"
                    value={formData.preExistingConditions}
                    onChange={handleChange('preExistingConditions')}
                    multiline
                    rows={2}
                    placeholder="List any pre-existing conditions (or write 'None')"
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Family Medical History"
                    value={formData.familyHistory}
                    onChange={handleChange('familyHistory')}
                    multiline
                    rows={2}
                    placeholder="Relevant family medical history"
                    required
                  />
                </Grid>
              </>
            )}

            {formData.insuranceType === 'Life' && (
              <>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    select
                    label="Smoking Status"
                    value={formData.smokingStatus}
                    onChange={handleChange('smokingStatus')}
                    required
                  >
                    <MenuItem value="Non-Smoker">Non-Smoker</MenuItem>
                    <MenuItem value="Occasional Smoker">Occasional Smoker</MenuItem>
                    <MenuItem value="Regular Smoker">Regular Smoker</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    select
                    label="Health Condition"
                    value={formData.healthCondition}
                    onChange={handleChange('healthCondition')}
                    required
                  >
                    <MenuItem value="Excellent">Excellent</MenuItem>
                    <MenuItem value="Good">Good</MenuItem>
                    <MenuItem value="Fair">Fair</MenuItem>
                    <MenuItem value="Poor">Poor</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    select
                    label="Coverage Term"
                    value={formData.coverageTerm}
                    onChange={handleChange('coverageTerm')}
                    required
                  >
                    <MenuItem value="10 years">10 years</MenuItem>
                    <MenuItem value="20 years">20 years</MenuItem>
                    <MenuItem value="30 years">30 years</MenuItem>
                    <MenuItem value="Whole Life">Whole Life</MenuItem>
                  </TextField>
                </Grid>
              </>
            )}

            {formData.insuranceType === 'Property' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Property Location"
                    value={formData.propertyLocation}
                    onChange={handleChange('propertyLocation')}
                    placeholder="Full property address"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    select
                    label="Property Type"
                    value={formData.propertyType}
                    onChange={handleChange('propertyType')}
                    required
                  >
                    <MenuItem value="House">House</MenuItem>
                    <MenuItem value="Apartment">Apartment</MenuItem>
                    <MenuItem value="Condo">Condo</MenuItem>
                    <MenuItem value="Townhouse">Townhouse</MenuItem>
                    <MenuItem value="Commercial">Commercial</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    select
                    label="Construction Material"
                    value={formData.constructionMaterial}
                    onChange={handleChange('constructionMaterial')}
                    required
                  >
                    <MenuItem value="Brick">Brick</MenuItem>
                    <MenuItem value="Wood">Wood</MenuItem>
                    <MenuItem value="Concrete">Concrete</MenuItem>
                    <MenuItem value="Steel">Steel</MenuItem>
                    <MenuItem value="Mixed">Mixed</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Property Value"
                    type="number"
                    value={formData.propertyValue}
                    onChange={handleChange('propertyValue')}
                    InputProps={{ startAdornment: '$' }}
                    placeholder="Estimated value"
                    required
                  />
                </Grid>
              </>
            )}
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Document Upload</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Please upload a supporting document (ID proof, income proof, or relevant certificate)
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  textAlign: 'center',
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  borderColor: uploadedFile ? 'success.main' : 'divider',
                  bgcolor: uploadedFile ? 'success.50' : 'background.paper'
                }}
              >
                {uploadedFile ? (
                  <Box>
                    <CheckCircle color="success" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="body1" gutterBottom>
                      {uploadedFile.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Size: {(uploadedFile.size / 1024).toFixed(2)} KB
                    </Typography>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={removeFile}
                      sx={{ mt: 2 }}
                    >
                      Remove File
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" gutterBottom>
                      Drop your file here or click to browse
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Maximum file size: 300KB
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Supported formats: PDF, JPEG, PNG
                    </Typography>
                    <Button
                      variant="contained"
                      component="label"
                      startIcon={<AttachFile />}
                      sx={{ mt: 2 }}
                    >
                      Choose File
                      <input
                        type="file"
                        hidden
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                      />
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Document Requirements:</strong>
                  <br />
                  • File must be less than 300KB
                  <br />
                  • Accepted formats: PDF, JPEG, PNG
                  <br />
                  • Document should clearly verify your provided information
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Apply for Insurance</Typography>
          <IconButton onClick={handleClose} disabled={loading}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {success ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle color="success" sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Application Submitted Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your application has been received and will be reviewed by our analysts.
            </Typography>
          </Box>
        ) : (
          <>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {renderStepContent(activeStep)}
          </>
        )}
      </DialogContent>

      {!success && (
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0 || loading}
          >
            Back
          </Button>
          <Box sx={{ flex: '1 1 auto' }} />
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
            >
              Next
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}

export default InsuranceApplicationForm;
