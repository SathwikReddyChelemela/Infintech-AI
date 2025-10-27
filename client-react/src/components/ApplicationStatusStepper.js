import React from 'react';
import { Box, Typography, Stepper, Step, StepLabel, StepContent, Chip } from '@mui/material';

/**
 * ApplicationStatusStepper
 * Props:
 *   - auditEvents: array of audit event objects (with .action and .created_at)
 *   - status: current application status string
 */
function ApplicationStatusStepper({ auditEvents = [], status, applicationId, lastUpdate }) {
  const steps = [
    { 
      label: 'Application Created', 
      action: 'created', 
      description: 'Application has been created and saved',
      statusMatch: ['draft'] 
    },
    { 
      label: 'Submitted for Review', 
      action: 'submitted', 
      description: 'Application submitted to analyst for initial review',
      statusMatch: ['submitted'] 
    },
    { 
      label: 'Analyst Review', 
      action: 'mark_ready', 
      description: 'Application approved by analyst and sent to underwriter',
      statusMatch: ['submitted'] // When analyst approves, app moves to underwriter
    },
    { 
      label: 'Underwriter Review', 
      action: 'under_review', 
      description: 'Application is being assessed by underwriter',
      statusMatch: ['under_review'] 
    },
    { 
      label: 'Final Decision', 
      action: ['approved', 'declined'], 
      description: 'Final decision has been made on the application',
      statusMatch: ['approved', 'declined'] 
    }
  ];

  const getStepTimestamp = (action) => {
    if (!Array.isArray(auditEvents) || !auditEvents.length) return null;
    if (Array.isArray(action)) {
      const found = auditEvents.find(ev => action.includes(ev.action));
      return found ? new Date(found.created_at).toLocaleString() : null;
    }
    const found = auditEvents.find(ev => ev.action === action);
    return found ? new Date(found.created_at).toLocaleString() : null;
  };

  // Determine active step based on current status and audit events
  let activeStep = 0;
  const currentStatus = (status || '').toLowerCase();
  
  // Check for each audit event
  const hasCreated = getStepTimestamp('created');
  const hasSubmitted = getStepTimestamp('submitted');  
  const hasMarkReady = getStepTimestamp('mark_ready'); // Analyst approved
  const hasApproved = getStepTimestamp('approved');    // Underwriter approved
  const hasDeclined = getStepTimestamp('declined');    // Underwriter declined
  
  // Determine current step based on what has happened
  if (hasApproved || hasDeclined) {
    activeStep = 4; // Final Decision - completed
  } else if (hasMarkReady || currentStatus === 'under_review') {
    activeStep = 3; // Underwriter Review - analyst completed, now with underwriter
  } else if (hasSubmitted) {
    activeStep = 1; // Submitted for Review - with analyst, not yet approved
  } else if (hasCreated) {
    activeStep = 0; // Application Created
  }

  const getStatusColor = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'approved') return 'success';
    if (statusLower === 'declined') return 'error';
    if (statusLower === 'under_review') return 'info';
    return 'warning';
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  return (
    <Box sx={{ my: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Current Status: <Chip label={formatStatus(status)} color={getStatusColor(status)} size="medium" />
      </Typography>
      
      {applicationId && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Application ID: {applicationId}
        </Typography>
      )}
      
      {lastUpdate && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Last Updated: {new Date(lastUpdate).toLocaleString()}
        </Typography>
      )}

      <Typography variant="subtitle1" gutterBottom>
        Application Progress:
      </Typography>
      
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, idx) => {
          const timestamp = getStepTimestamp(step.action);
          
          // Determine if this step is completed
          let isCompleted = false;
          if (idx === 0) isCompleted = !!getStepTimestamp('created'); // Created
          else if (idx === 1) isCompleted = !!getStepTimestamp('submitted'); // Submitted
          else if (idx === 2) isCompleted = !!getStepTimestamp('mark_ready'); // Analyst approved
          else if (idx === 3) isCompleted = !!getStepTimestamp('approved') || !!getStepTimestamp('declined'); // Underwriter completed review
          else if (idx === 4) isCompleted = !!getStepTimestamp('approved') || !!getStepTimestamp('declined'); // Final decision
          
          const isActive = idx === activeStep;
          
          return (
            <Step key={step.label} completed={isCompleted}>
              <StepLabel>
                <Box>
                  <Typography variant="body1" fontWeight={isActive ? 'bold' : 'normal'} color={isActive ? 'primary' : 'inherit'}>
                    {step.label}
                    {isActive && (
                      <Typography component="span" variant="body2" color="primary" sx={{ ml: 1, fontWeight: 'normal' }}>
                        (Current)
                      </Typography>
                    )}
                  </Typography>
                  {timestamp && (
                    <Typography variant="caption" color="text.secondary">
                      Completed: {timestamp}
                    </Typography>
                  )}
                  {isActive && !isCompleted && (
                    <Typography variant="caption" color="primary">
                      In Progress...
                    </Typography>
                  )}
                </Box>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
              </StepContent>
            </Step>
          );
        })}
      </Stepper>
      
      {auditEvents.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
          Status tracking will be updated as your application progresses through the review process.
        </Typography>
      )}
    </Box>
  );
}

export default ApplicationStatusStepper;
