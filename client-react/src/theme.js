import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#111111',
      paper: '#1A1A1A',
    },
    primary: {
      main: '#4169e1', // Royal Blue
      contrastText: '#fff',
    },
    secondary: {
      main: '#FFD700', // Gold
      contrastText: '#111',
    },
    success: {
      main: '#50C878', // Emerald
      contrastText: '#fff',
    },
    text: {
      primary: '#fff',
      secondary: '#CCCCCC',
      disabled: '#888',
    },
    divider: 'rgba(255,255,255,0.08)',
  },
  typography: {
    fontFamily: [
      'Inter',
      'Lato',
      'Playfair Display',
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    fontWeightRegular: 500,
    fontWeightMedium: 600,
    fontWeightBold: 700,
    h1: { fontWeight: 700, color: '#fff' },
    h2: { fontWeight: 700, color: '#fff' },
    h3: { fontWeight: 700, color: '#fff' },
    h4: { fontWeight: 600, color: '#fff' },
    h5: { fontWeight: 600, color: '#fff' },
    h6: { fontWeight: 600, color: '#fff' },
    body1: { color: '#CCCCCC' },
    body2: { color: '#CCCCCC' },
  },
  shape: {
    borderRadius: 16, // 1rem
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #181818 60%, #232323 100%)',
          boxShadow: '0 4px 32px 0 rgba(255,255,255,0.05)',
          borderRadius: '1rem',
          border: '1px solid rgba(255,255,255,0.08)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'scale(1.025)',
            boxShadow: '0 0 0 2px #4169e1, 0 8px 32px 0 rgba(65,105,225,0.10)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '2rem',
          fontWeight: 700,
          textTransform: 'none',
          boxShadow: 'none',
          transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
          '&:hover': {
            boxShadow: '0 0 0 2px #FFD700, 0 4px 16px 0 rgba(255,215,0,0.10)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(90deg, #4169e1 60%, #27408b 100%)',
          color: '#fff',
        },
        containedSecondary: {
          background: 'linear-gradient(90deg, #FFD700 60%, #bfa100 100%)',
          color: '#111',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: '#1A1A1A',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(10,10,10,0.98)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          boxShadow: 'none',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          background: '#181818',
          color: '#fff',
          borderRadius: 8,
        },
        input: {
          color: '#fff',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          borderColor: 'rgba(255,255,255,0.12)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          background: 'linear-gradient(90deg, #4169e1, #FFD700, #50C878)',
        },
      },
    },
  },
});

export default theme;
