import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Badge, Container, Box, Button, Stack } from '@mui/material';
import { Notifications, ContactSupport, Settings } from '@mui/icons-material';

/**
 * Navbar component
 * Props:
 * - notificationsCount?: number
 * - onNotificationsClick?: (event: any) => void
 * - onSupportClick?: () => void
 * - onSettingsClick?: () => void
 * - onLogout?: () => void
 * - showSettings?: boolean
 * - showActions?: boolean (default true)
 * - maxWidth?: 'lg' | 'xl' | 'md' | etc. (default 'lg')
 */
export default function Navbar({
  notificationsCount = 0,
  onNotificationsClick,
  onSupportClick,
  onSettingsClick,
  onLogout,
  showSettings = false,
  showActions = true,
  maxWidth = 'lg'
}) {
  return (
    <AppBar position="static" elevation={0} sx={{
      mb: 4,
      color: 'common.white',
      background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
      boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
    }}>
      <Container maxWidth={maxWidth}>
        <Toolbar disableGutters sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <Box sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: 'success.main',
              boxShadow: '0 0 0 3px rgba(34,197,94,0.35)'
            }} />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                letterSpacing: 0.3,
                background: 'linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,0.85) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Infintech AI
            </Typography>
          </Box>

          {showActions && (
            <Stack direction="row" spacing={1} alignItems="center">
              {onSupportClick && (
                <IconButton color="inherit" onClick={onSupportClick} aria-label="Support" sx={{ '&:hover': { transform: 'translateY(-1px)' }, transition: 'transform 0.15s ease' }}>
                  <ContactSupport />
                </IconButton>
              )}
              {onNotificationsClick && (
                <IconButton color="inherit" onClick={onNotificationsClick} aria-label="Notifications" sx={{ '&:hover': { transform: 'translateY(-1px)' }, transition: 'transform 0.15s ease' }}>
                  <Badge badgeContent={notificationsCount} color="error">
                    <Notifications />
                  </Badge>
                </IconButton>
              )}
              {showSettings && (
                <IconButton color="inherit" onClick={onSettingsClick} aria-label="Settings" sx={{ '&:hover': { transform: 'translateY(-1px)' }, transition: 'transform 0.15s ease' }}>
                  <Settings />
                </IconButton>
              )}
              {onLogout && (
                <Button variant="outlined" color="inherit" onClick={onLogout} sx={{
                  borderColor: 'rgba(255,255,255,0.7)',
                  '&:hover': { borderColor: 'common.white', backgroundColor: 'rgba(255,255,255,0.08)' }
                }}>
                  Logout
                </Button>
              )}
            </Stack>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
