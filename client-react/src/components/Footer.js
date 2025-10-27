import React from 'react';
import { Box, Typography } from '@mui/material';

function Footer() {
  return (
    <Box sx={{ width: '100%', py: 2, textAlign: 'center', bgcolor: 'background.paper', mt: 6, borderTop: '1px solid #eee' }}>
      <Typography variant="body2" color="text.secondary">
        © {new Date().getFullYear()} Sathwik Reddy Chelemela. All rights reserved.
      </Typography>
    </Box>
  );
}

export default Footer;