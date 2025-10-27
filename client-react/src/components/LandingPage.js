import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Security,
  Assessment,
  AccountBalance,
  AdminPanelSettings,
  Visibility,
  Person,
  BusinessCenter,
  GavelRounded,
  CheckCircle,
  TrendingUp,
  Shield,
  Speed,
  Group,
  Login
} from '@mui/icons-material';

function LandingPage({ onNavigateToLogin }) {
  const features = [
    {
      icon: <Security color="primary" />,
      title: "Role-Based Access Control",
      description: "Secure system with customer, analyst, underwriter, admin, and auditor roles"
    },
    {
      icon: <Assessment color="secondary" />,
      title: "Real-Time Application Tracking",
      description: "Track insurance applications from submission to final decision"
    },
    {
      icon: <AccountBalance color="success" />,
      title: "Financial Analysis",
      description: "Advanced risk assessment and premium calculation tools"
    },
    {
      icon: <AdminPanelSettings color="warning" />,
      title: "Admin Dashboard",
      description: "Complete system management and user administration"
    }
  ];

  const userRoles = [
    {
      role: "Customer",
      icon: <Person color="success" />,
      description: "Submit applications, track status, upload documents",
      features: ["Submit Insurance Applications", "Real-time Status Tracking", "Document Upload", "Application History"]
    },
    {
      role: "Analyst",
      icon: <TrendingUp color="primary" />,
      description: "Review applications, perform initial analysis",
      features: ["Application Review", "Data Quality Assessment", "Risk Evaluation", "Approval/Request Info"]
    },
    {
      role: "Underwriter",
      icon: <GavelRounded color="warning" />,
      description: "Make final decisions, assess risk, set premiums",
      features: ["Final Decision Making", "Risk Assessment", "Premium Calculation", "Policy Approval"]
    },
    {
      role: "Admin",
      icon: <AdminPanelSettings color="error" />,
      description: "System administration and user management",
      features: ["User Management", "System Configuration", "Database Management", "Audit Oversight"]
    },
    {
      role: "Auditor",
      icon: <Visibility color="secondary" />,
      description: "Monitor compliance and review audit trails",
      features: ["Compliance Monitoring", "Audit Trail Review", "Report Generation", "Risk Analysis"]
    }
  ];

  const systemBenefits = [
    "Streamlined Application Process",
    "Automated Workflow Management", 
    "Comprehensive Audit Trails",
    "Real-time Status Updates",
    "Role-based Security",
    "Document Management",
    "Risk Assessment Tools",
    "Compliance Monitoring"
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Paper sx={{ mb: 4, bgcolor: 'primary.main', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
                Financial RBAC System
              </Typography>
              <Typography variant="h5" sx={{ mb: 3, opacity: 0.9 }}>
                Role-Based Access Control for Insurance Application Management
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, fontSize: '1.1rem', opacity: 0.8 }}>
                A comprehensive platform for managing insurance applications with advanced role-based security,
                real-time tracking, and intelligent workflow automation.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={onNavigateToLogin}
                sx={{ 
                  bgcolor: 'white', 
                  color: 'primary.main',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  '&:hover': {
                    bgcolor: 'grey.100'
                  }
                }}
                startIcon={<Login />}
              >
                Get Started - Login
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <BusinessCenter sx={{ fontSize: 120, opacity: 0.7 }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Paper>

      <Container maxWidth="lg" sx={{ pb: 6 }}>
        {/* Key Features */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" component="h2" gutterBottom textAlign="center" fontWeight="bold">
            Key Features
          </Typography>
          <Typography variant="body1" textAlign="center" sx={{ mb: 4, color: 'text.secondary', fontSize: '1.1rem' }}>
            Discover the powerful capabilities of our financial management system
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ height: '100%', textAlign: 'center', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* User Roles */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" component="h2" gutterBottom textAlign="center" fontWeight="bold">
            User Roles & Capabilities
          </Typography>
          <Typography variant="body1" textAlign="center" sx={{ mb: 4, color: 'text.secondary', fontSize: '1.1rem' }}>
            Each role has specific permissions and access levels designed for optimal workflow
          </Typography>
          <Grid container spacing={3}>
            {userRoles.map((role, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {role.icon}
                      <Typography variant="h5" sx={{ ml: 1, fontWeight: 'bold' }}>
                        {role.role}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {role.description}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="subtitle2" gutterBottom color="primary">
                      Key Features:
                    </Typography>
                    <List dense>
                      {role.features.map((feature, idx) => (
                        <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircle color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={feature} 
                            primaryTypographyProps={{ fontSize: '0.9rem' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* System Benefits */}
        <Box sx={{ mb: 6 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" component="h2" gutterBottom fontWeight="bold">
                System Benefits
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary', fontSize: '1.1rem' }}>
                Experience enhanced efficiency and security with our comprehensive solution
              </Typography>
              <Grid container spacing={2}>
                {systemBenefits.map((benefit, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircle color="success" sx={{ mr: 1 }} />
                      <Typography variant="body1">{benefit}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 4, bgcolor: 'primary.light', color: 'white', textAlign: 'center' }}>
                <Shield sx={{ fontSize: 80, mb: 2, opacity: 0.8 }} />
                <Typography variant="h4" gutterBottom fontWeight="bold">
                  Secure & Reliable
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Built with enterprise-grade security and reliability standards
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 3 }}>
                  <Box>
                    <Speed sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="body2">Fast Processing</Typography>
                  </Box>
                  <Box>
                    <Group sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="body2">Multi-Role Support</Typography>
                  </Box>
                  <Box>
                    <Security sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="body2">Advanced Security</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Call to Action */}
        <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Ready to Get Started?
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary', fontSize: '1.1rem' }}>
            Access your role-specific dashboard and start managing insurance applications efficiently
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Chip label="customer1 / customer1" color="success" variant="outlined" />
            <Chip label="analyst1 / analyst1" color="primary" variant="outlined" />
            <Chip label="underwriter1 / underwriter1" color="warning" variant="outlined" />
            <Chip label="admin1 / admin1" color="error" variant="outlined" />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
            Use these demo credentials to explore different role capabilities
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={onNavigateToLogin}
            sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
            startIcon={<Login />}
          >
            Access Login Page
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}

export default LandingPage;
