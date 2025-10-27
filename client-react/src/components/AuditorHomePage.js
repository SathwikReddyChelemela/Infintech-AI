import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Container, Typography, Grid, Card, CardContent, Button, Divider, Chip,
  TextField, InputAdornment, IconButton, List, ListItem, ListItemText, Alert
} from '@mui/material';
import { Search, Refresh, Shield, FactCheck, Assignment, ErrorOutline } from '@mui/icons-material';
import axios from 'axios';
import Navbar from './Navbar';

function AuditorHomePage({ user, onLogout }) {
  const [stats, setStats] = useState({ total_users: 0, total_applications: 0, total_audit_events: 0, missing_trail: 0 });
  const [events, setEvents] = useState([]);
  const [issues, setIssues] = useState([]);
  const [filters, setFilters] = useState({ action: '', actor_role: '', application_id: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/auditor/dashboard');
      setStats({
        total_users: res.data.stats.total_users,
        total_applications: res.data.stats.total_applications,
        total_audit_events: res.data.stats.total_audit_events,
        missing_trail: res.data.stats.applications_missing_audit_trail_sample,
      });
      setEvents(res.data.recent_events || []);
      setIssues([]);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load auditor dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const fetchEvents = async () => {
    setError('');
    try {
      const params = {};
      if (filters.action) params.action = filters.action;
      if (filters.actor_role) params.actor_role = filters.actor_role;
      if (filters.application_id) params.application_id = filters.application_id;
      const res = await axios.get('/auditor/audit-events', { params });
      setEvents(res.data.events || []);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load audit events');
    }
  };

  const runIntegrityCheck = async () => {
    setError('');
    try {
      const res = await axios.get('/auditor/integrity-check');
      setIssues(res.data.issues || []);
    } catch (e) {
      setError(e.response?.data?.detail || 'Integrity check failed');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Navbar onLogout={onLogout} user={user} maxWidth="lg" />
      <Container maxWidth="lg">
        <Box sx={{ my: 2 }}>
          <Typography variant="h6">Welcome, {user.username} 🔎</Typography>
          <Typography variant="body2" color="text.secondary">
            Logs and records accurately reflect system and user actions. Data integrity and compliance are maintained.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">{stats.total_users}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Users</Typography>
                  </Box>
                  <Shield sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">{stats.total_applications}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Applications</Typography>
                  </Box>
                  <Assignment sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">{stats.total_audit_events}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Audit Events</Typography>
                  </Box>
                  <FactCheck sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">{stats.missing_trail}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Missing Trails (sample)</Typography>
                  </Box>
                  <ErrorOutline sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters & Actions */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField size="small" label="Action" value={filters.action} onChange={(e)=>setFilters({...filters, action:e.target.value})} />
              <TextField size="small" label="Actor Role" value={filters.actor_role} onChange={(e)=>setFilters({...filters, actor_role:e.target.value})} />
              <TextField size="small" label="Application ID" value={filters.application_id} onChange={(e)=>setFilters({...filters, application_id:e.target.value})}
                InputProps={{ endAdornment: (<InputAdornment position="end"><Search /></InputAdornment>) }}
              />
              <Button variant="contained" onClick={fetchEvents}>Search</Button>
              <Button startIcon={<Refresh />} onClick={fetchDashboard}>Refresh</Button>
              <Button color="warning" variant="outlined" onClick={runIntegrityCheck}>Run Integrity Check</Button>
            </Box>
          </CardContent>
        </Card>

        {/* Events & Issues */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Recent Audit Events</Typography>
                <Divider sx={{ mb: 2 }} />
                {events.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No events found</Typography>
                ) : (
                  <List sx={{ maxHeight: 600, overflow: 'auto' }}>
                    {events.map((e) => (
                      <ListItem key={e.id || `${e.application_id}-${e.created_at}`} disableGutters>
                        <ListItemText
                          primary={<>
                            <Chip size="small" label={e.action || 'event'} sx={{ mr: 1 }} />
                            <Typography variant="body2" component="span">{e.application_id || e.id}</Typography>
                          </>}
                          secondary={
                            <>
                              <Typography variant="caption" color="text.secondary">
                                Actor: {e.actor_role || e.admin_username || '-'} | Time: {e.created_at}
                              </Typography>
                              {e.details && <Typography variant="caption" display="block">{JSON.stringify(e.details)}</Typography>}
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Compliance Issues</Typography>
                <Divider sx={{ mb: 2 }} />
                {issues.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No issues detected</Typography>
                ) : (
                  <List sx={{ maxHeight: 600, overflow: 'auto' }}>
                    {issues.map((i, idx) => (
                      <ListItem key={idx} disableGutters>
                        <ListItemText
                          primary={`${i.type} ${i.field ? `(${i.field})` : ''}`}
                          secondary={<Typography variant="caption" color="text.secondary">{i.application_id || i.id || '-'}</Typography>}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default AuditorHomePage;
