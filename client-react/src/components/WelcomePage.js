
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Grid, Card, CardContent, CardActions, Box, useTheme } from '@mui/material';
import { DirectionsCar, Favorite, LocalHospital, Home } from '@mui/icons-material';

const products = [
  { key: 'auto', name: 'Auto Insurance', icon: <DirectionsCar sx={{ fontSize: 42, color: '#90caf9' }} />, range: '$50–$120 / mo', blurb: 'Comprehensive and third-party coverages for your vehicle.' },
  { key: 'life', name: 'Life Insurance', icon: <Favorite sx={{ fontSize: 42, color: '#f48fb1' }} />, range: '$30–$200 / mo', blurb: 'Term and whole-life options that protect your family.' },
  { key: 'health', name: 'Health Insurance', icon: <LocalHospital sx={{ fontSize: 42, color: '#80cbc4' }} />, range: '$80–$300 / mo', blurb: 'Affordable plans with broad provider networks.' },
  { key: 'property', name: 'Property Insurance', icon: <Home sx={{ fontSize: 42, color: '#ffe082' }} />, range: '$40–$160 / mo', blurb: 'Homeowners and renters coverage for your assets.' },
];

function WelcomePage({ onLoginClick }) {
  const theme = useTheme();
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#111', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Minimal navbar with only Login */}
      <AppBar position="static" sx={{ bgcolor: 'rgba(0,0,0,0.95)', boxShadow: 'none', borderBottom: '1px solid #222' }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 1, color: '#fff', lineHeight: 1 }}>infintech AI</Typography>
            <Typography variant="caption" sx={{ color: '#90caf9', fontWeight: 500, letterSpacing: 0.5 }}>
              Insurance & Financial Tech AI
            </Typography>
          </Box>
          <Button variant="contained" color="primary" onClick={onLoginClick} sx={{ fontWeight: 700, borderRadius: 2, px: 3 }}>Login</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 8, flex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" sx={{ fontWeight: 900, mb: 1, color: '#fff', letterSpacing: 2, textShadow: '0 2px 16px #000a' }}>Welcome</Typography>
          <Typography sx={{ color: '#90caf9', fontWeight: 700, fontSize: 22, mb: 1 }}>
            infintech AI
          </Typography>
          <Typography sx={{ color: '#b0b0b0', fontSize: 18, maxWidth: 600, mx: 'auto', mb: 1 }}>
            Your intelligent assistant for insurance and financial technology. infintech AI helps you manage, compare, and understand insurance products—auto, health, life, property, and more—using advanced AI to simplify your financial decisions and support you every step of the way.
          </Typography>
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
