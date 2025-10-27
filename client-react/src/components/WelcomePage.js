
import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Grid, Card, CardContent, CardActions, Box, useTheme, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { DirectionsCar, Favorite, LocalHospital, Home } from '@mui/icons-material';

const products = [
  { key: 'auto', name: 'Auto Insurance', icon: <DirectionsCar sx={{ fontSize: 42, color: '#90caf9' }} />, range: '$50–$120 / mo', blurb: 'Comprehensive and third-party coverages for your vehicle.' },
  { key: 'life', name: 'Life Insurance', icon: <Favorite sx={{ fontSize: 42, color: '#f48fb1' }} />, range: '$30–$200 / mo', blurb: 'Term and whole-life options that protect your family.' },
  { key: 'health', name: 'Health Insurance', icon: <LocalHospital sx={{ fontSize: 42, color: '#80cbc4' }} />, range: '$80–$300 / mo', blurb: 'Affordable plans with broad provider networks.' },
  { key: 'property', name: 'Property Insurance', icon: <Home sx={{ fontSize: 42, color: '#ffe082' }} />, range: '$40–$160 / mo', blurb: 'Homeowners and renters coverage for your assets.' },
];

function WelcomePage({ onLoginClick }) {
  const theme = useTheme();
  const [readMoreOpen, setReadMoreOpen] = useState(false);
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#111', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Minimal navbar with only Login */}
      <AppBar position="static" sx={{ bgcolor: 'rgba(0,0,0,0.95)', boxShadow: 'none', borderBottom: '1px solid #222' }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography sx={{
              color: '#90caf9',
              fontWeight: 900,
              fontSize: 28,
              letterSpacing: 4,
              textShadow: '0 2px 16px #000a',
              fontFamily: 'Inter, sans-serif',
              textTransform: 'uppercase',
              lineHeight: 1
            }}>
              infintech AI
            </Typography>
          </Box>
          <Button variant="contained" color="primary" onClick={onLoginClick} sx={{ fontWeight: 700, borderRadius: 2, px: 3 }}>Login</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 8, flex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 7, mt: 4 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 1.5,
                color: '#fff',
                letterSpacing: 2,
                textShadow: '0 2px 12px #000a',
                fontFamily: 'Inter, sans-serif',
                fontSize: { xs: 22, sm: 32, md: 38 },
                lineHeight: 1.15,
                textAlign: 'center',
                textTransform: 'uppercase',
                borderRadius: 2
              }}
            >
              Welcome
            </Typography>
            <Typography
              sx={{
                color: '#b0b0b0',
                fontWeight: 500,
                fontSize: { xs: 16, sm: 22 },
                mt: 1,
                mb: 3,
                maxWidth: 520,
                textAlign: 'center',
                fontFamily: 'Inter, sans-serif',
                letterSpacing: 0.5,
                lineHeight: 1.3,
                px: { xs: 1, sm: 2 }
              }}
            >
              Your intelligent assistant for insurance and financial technology.
            </Typography>
            <Button
              variant="outlined"
              sx={{ mt: 1, color: '#90caf9', borderColor: '#90caf9', fontWeight: 700, fontSize: 18, px: 4, py: 1, borderRadius: 3, letterSpacing: 1 }}
              onClick={() => setReadMoreOpen(true)}
            >
              Read More
            </Button>
          </Box>

          <Dialog open={readMoreOpen} onClose={() => setReadMoreOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ background: '#181818', color: '#90caf9', fontWeight: 700 }}>
              About infintech AI
            </DialogTitle>
            <DialogContent sx={{ background: '#181818', color: '#b0b0b0', fontSize: 18 }}>
              <span style={{ fontWeight: 600, color: '#fff' }}>Your intelligent assistant for insurance and financial technology.</span><br />
              <span style={{ color: '#90caf9', fontWeight: 600 }}>infintech AI</span> helps you:
              <ul style={{
                textAlign: 'left',
                margin: '12px auto 0',
                maxWidth: 500,
                color: '#b0b0b0',
                fontSize: 17,
                lineHeight: 1.7,
                paddingLeft: 24
              }}>
                <li>Manage, compare, and understand insurance products — auto, health, life, property, and more</li>
                <li>Use advanced AI to simplify your financial decisions</li>
                <li>Get clear, step-by-step support at every stage</li>
              </ul>
              <div style={{ color: '#90caf9', fontWeight: 600, marginTop: 18 }}>We are currently in phase one.</div>
            </DialogContent>
            <DialogActions sx={{ background: '#181818' }}>
              <Button onClick={() => setReadMoreOpen(false)} sx={{ color: '#90caf9' }}>Close</Button>
            </DialogActions>
          </Dialog>
          <Typography sx={{ color: '#b0b0b0', fontSize: 20 }}>Choose an insurance product to get started</Typography>
        </Box>

        <Grid container spacing={4} justifyContent="center">
          {products.map(p => (
            <Grid key={p.key} item xs={12} sm={6} md={3}>
              <Card sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'rgba(30,30,30,0.95)',
                color: '#fff',
                borderRadius: 4,
                boxShadow: '0 4px 32px #000a',
                border: '1px solid #222',
                backdropFilter: 'blur(2px)',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-8px) scale(1.03)', boxShadow: '0 8px 40px #000c' }
              }}>
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>{p.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>{p.name}</Typography>
                  <Typography variant="body2" sx={{ mt: 1, color: '#b0b0b0' }}>{p.blurb}</Typography>
                  <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 700, color: '#90caf9' }}>{p.range}</Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button size="medium" variant="contained" color="primary" onClick={onLoginClick} sx={{ fontWeight: 700, borderRadius: 2, px: 3 }}>Buy</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
      {/* Footer */}
      <Box sx={{ mt: 8, py: 2, bgcolor: 'rgba(20,20,20,0.98)', textAlign: 'center', color: '#b0b0b0', fontSize: 14, borderTop: '1px solid #222' }}>
        All rights reserved to Sathwik Reddy Chelemela
      </Box>
    </Box>
  );
}

export default WelcomePage;
