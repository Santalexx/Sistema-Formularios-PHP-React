// src/theme/theme.js
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#8B4513', // Marrón oscuro
      light: '#A0522D', // Marrón siena
      dark: '#654321', // Marrón oscuro profundo
    },
    secondary: {
      main: '#DEB887', // Marrón claro
      light: '#F5DEB3', // Beige
      dark: '#D2691E', // Marrón chocolate
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2C1810', // Marrón muy oscuro para texto
      secondary: '#5C4033', // Marrón medio para texto secundario
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
      color: '#2C1810',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
      color: '#2C1810',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
      color: '#2C1810',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 24px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0,0,0,0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 4px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});