import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Description as DocumentIcon,
  Assessment as StatsIcon
} from '@mui/icons-material';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function AdminDashboard({ user }) {
  const [activeTab, setActiveTab] = useState(0);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [knowledgeDocs, setKnowledgeDocs] = useState([]);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadRole, setUploadRole] = useState('general');
  const [uploadDescription, setUploadDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploadDialog, setUploadDialog] = useState(false);

  const roles = [
    { value: 'general', label: 'General (All Users)' },
    { value: 'customer', label: 'Customer' },
    { value: 'analyst', label: 'Analyst' },
    { value: 'underwriter', label: 'Underwriter' },
    { value: 'admin', label: 'Admin' },
    { value: 'auditor', label: 'Auditor' }
  ];

  useEffect(() => {
    fetchDashboardStats();
    fetchKnowledgeDocs();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setMessage({ type: 'error', text: 'Failed to fetch dashboard statistics' });
    }
  };

  const fetchKnowledgeDocs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/admin/knowledge-documents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKnowledgeDocs(response.data.documents);
    } catch (error) {
      console.error('Error fetching knowledge docs:', error);
      setMessage({ type: 'error', text: 'Failed to fetch knowledge documents' });
    }
  };

  const handleFileUpload = async () => {
    if (uploadFiles.length === 0) {
      setMessage({ type: 'error', text: 'Please select files to upload' });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      uploadFiles.forEach(file => {
        formData.append('files', file);
      });
      formData.append('role', uploadRole);
      formData.append('description', uploadDescription);

      const token = localStorage.getItem('token');
      const response = await axios.post('/admin/upload-documents', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage({ type: 'success', text: response.data.message });
      setUploadFiles([]);
      setUploadDescription('');
      setUploadDialog(false);
      fetchKnowledgeDocs(); // Refresh the documents list
    } catch (error) {
      console.error('Error uploading files:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to upload documents' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    setUploadFiles(Array.from(event.target.files));
  };

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={`${color}.main`}>
              {value}
            </Typography>
          </Box>
          <Box color={`${color}.main`}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        <DashboardIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
        Admin Dashboard
      </Typography>

      {message.text && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 3 }}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Dashboard" icon={<StatsIcon />} />
          <Tab label="Knowledge Base" icon={<DocumentIcon />} />
          <Tab label="User Management" icon={<PeopleIcon />} />
        </Tabs>
      </Box>

      {/* Dashboard Tab */}
      <TabPanel value={activeTab} index={0}>
        {dashboardStats && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Total Applications"
                value={dashboardStats.system_stats.total_applications}
                icon={<DocumentIcon sx={{ fontSize: 40 }} />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Total Users"
                value={dashboardStats.system_stats.total_users}
                icon={<PeopleIcon sx={{ fontSize: 40 }} />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Audit Events"
                value={dashboardStats.system_stats.total_audit_events}
                icon={<StatsIcon sx={{ fontSize: 40 }} />}
                color="info"
              />
            </Grid>

            {/* Application Statistics */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Application Statistics
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Pending: <strong>{dashboardStats.application_stats.pending}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Approved: <strong>{dashboardStats.application_stats.approved}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Declined: <strong>{dashboardStats.application_stats.declined}</strong>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* User Statistics */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    User Statistics
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Customers: <strong>{dashboardStats.user_stats.customers}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Analysts: <strong>{dashboardStats.user_stats.analysts}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Underwriters: <strong>{dashboardStats.user_stats.underwriters}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Admins: <strong>{dashboardStats.user_stats.admins}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Auditors: <strong>{dashboardStats.user_stats.auditors}</strong>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Knowledge Base Tab */}
      <TabPanel value={activeTab} index={1}>
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialog(true)}
            sx={{ mb: 2 }}
          >
            Upload Knowledge Documents to Pinecone
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Document ID</TableCell>
                <TableCell>Files</TableCell>
                <TableCell>Role Access</TableCell>
                <TableCell>Uploaded By</TableCell>
                <TableCell>Upload Date</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {knowledgeDocs.map((doc) => (
                <TableRow key={doc.document_id}>
                  <TableCell>{doc.document_id}</TableCell>
                  <TableCell>
                    {doc.file_names?.map((fileName, index) => (
                      <Chip key={index} label={fileName} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={doc.role_access}
                      color="primary"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{doc.admin_username}</TableCell>
                  <TableCell>
                    {new Date(doc.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{doc.description || 'No description'}</TableCell>
                </TableRow>
              ))}
              {knowledgeDocs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No knowledge documents found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* User Management Tab */}
      <TabPanel value={activeTab} index={2}>
        <Typography variant="h6">
          User Management
        </Typography>
        <Typography variant="body2" color="textSecondary">
          User management functionality can be implemented here.
        </Typography>
      </TabPanel>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Upload Knowledge Documents to Pinecone</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              accept=".pdf,.txt,.doc,.docx"
              style={{ marginBottom: '16px', width: '100%' }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Role Access</InputLabel>
              <Select
                value={uploadRole}
                onChange={(e) => setUploadRole(e.target.value)}
                label="Role Access"
              >
                {roles.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description (Optional)"
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              placeholder="Describe the content and purpose of these documents..."
            />

            {uploadFiles.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Selected files:
                </Typography>
                {uploadFiles.map((file, index) => (
                  <Chip
                    key={index}
                    label={file.name}
                    size="small"
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleFileUpload}
            variant="contained"
            disabled={loading || uploadFiles.length === 0}
          >
            {loading ? <CircularProgress size={20} /> : 'Upload to Pinecone'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AdminDashboard;
