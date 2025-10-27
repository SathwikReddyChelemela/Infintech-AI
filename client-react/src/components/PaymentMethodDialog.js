import React from 'react';
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Slide,
  Box,
  Grid,
  
} from '@mui/material';
import { Close } from '@mui/icons-material';
import PaymentMethodCard from './PaymentMethodCard';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function PaymentMethodDialog({ open, onClose }) {

  return (
    <Dialog fullScreen open={open} onClose={onClose} TransitionComponent={Transition}>
      <AppBar sx={{ position: 'relative' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
            <Close />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            Add Payment Method
          </Typography>
        </Toolbar>
      </AppBar>

  <Box sx={{ p: 3 }}>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <PaymentMethodCard />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle1" gutterBottom>Why we ask for this</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                We only store the last 4 digits, name, and expiration to identify your card. We never store the full card number or CVV.
              </Typography>
              <Typography variant="subtitle1" gutterBottom>Tips</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Use a card you plan to keep active during your policy term. Ensure the expiration date is valid and in the future.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Dialog>
  );
}
