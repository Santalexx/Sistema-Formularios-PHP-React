// src/components/auth/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  Paper,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import '../../styles/fonts.css';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [formData, setFormData] = useState({
    correo: '',
    contrasena: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch {
      setError('Error al iniciar sesión. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Navegación a la página de recuperación de contraseña
    navigate('/recuperar-password');
  };

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff8dc',
        backgroundImage: 'url("/assets/images/Banner.jpeg")',
        backgroundSize: 'cover',
        backgroundPosition: 'left',
        backgroundRepeat: 'no-repeat',
        overflow: 'hidden',
      }}
    >
      {/* Panel principal rojo con margen de 10px */}
      <Paper
        elevation={3}
        sx={{
          backgroundColor: '#802629',
          width: isSmallScreen ? '90%' : '450px', // Ancho fijo
          height: 'auto', // Altura automática basada en contenido
          borderRadius: '10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '30px 30px 40px 30px',
          margin: 0, // Sin margen externo
          maxWidth: '450px', // Límite máximo de ancho 
        }}
      >
        {/* Logo en la parte superior */}
        <Box sx={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'center',
          mb: 3 // Margen inferior fijo
        }}>
          <img 
            src="/assets/images/logo-muebleideas.png" 
            alt="Logo Muebleideas"
            style={{ 
              width: '180px',
              height: 'auto' 
            }}
          />
        </Box>

        {/* Panel interno marrón */}
        <Paper
        elevation={0}
        sx={{
          backgroundColor: '#deb886',
          width: '100%',
          borderRadius: '20px',
          padding: '25px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px', // Espacio fijo entre elementos
        }}
      >
          {/* Icono de usuario */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            mb: 2 // Margen inferior fijo
          }}>
            <img 
              src="/assets/images/user-icon.png" 
              alt="User Icon" 
              style={{ 
                width: '60px',
                height: '60px'
              }} 
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 0.5,
                fontFamily: 'GeogrotesqueTRIAL-Md',
              }}
            >
              CORREO ELECTRÓNICO
            </Typography>
            <TextField
              fullWidth
              name="correo"
              type="email"
              placeholder="email@muebleideas.com"
              value={formData.correo}
              onChange={handleChange}
              variant="outlined"
              required
              size={isSmallScreen ? "small" : "medium"}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  borderRadius: '4px',
                }
              }}
              InputProps={{
                style: { fontFamily: 'GeogrotesqueTRIAL-Md' }
              }}
            />

            <Typography 
              variant="body2" 
              sx={{ 
                mb: 0.5,
                fontFamily: 'GeogrotesqueTRIAL-Md',
              }}
            >
              CONTRASEÑA
            </Typography>
            <TextField
              fullWidth
              name="contrasena"
              type={showPassword ? 'text' : 'password'}
              placeholder="•••••••••••••••"
              value={formData.contrasena}
              onChange={handleChange}
              variant="outlined"
              required
              size={isSmallScreen ? "small" : "medium"}
              sx={{
                mb: 1,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  borderRadius: '4px',
                }
              }}
              InputProps={{
                style: { fontFamily: 'GeogrotesqueTRIAL-Md' },
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      sx={{ minWidth: '40px', padding: 0 }}
                    >
                      {showPassword ? 
                        <VisibilityOffIcon sx={{ color: 'gray', fontSize: isSmallScreen ? '18px' : '24px' }} /> : 
                        <VisibilityIcon sx={{ color: 'gray', fontSize: isSmallScreen ? '18px' : '24px' }} />
                      }
                    </Button>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ textAlign: 'left', mb: isSmallScreen ? 2 : 3 }}>
              <Button
                variant="text"
                onClick={handleForgotPassword}
                sx={{ 
                  p: 0,
                  textTransform: 'none',
                  color: '#802629',
                  fontFamily: 'GeogrotesqueTRIAL-Md',
                  fontSize: isSmallScreen ? '1rem' : '1rem'
                }}
              >
                ¿Olvidaste tu contraseña?
              </Button>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ 
                mt: 1, 
                backgroundColor: '#802629',
                '&:hover': {
                  backgroundColor: '#6b1f21', // Un poco más oscuro al hover
                },
                py: isSmallScreen ? 1 : 1.5,
                borderRadius: '25px',
                fontFamily: 'GeogrotesqueTRIAL-SmBd',
                fontSize: isSmallScreen ? '1rem' : '1rem',
              }}
            >
              {loading ? 'Iniciando sesión...' : 'INICIAR SESIÓN'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: isSmallScreen ? 2 : 3 }}>
              <Typography 
                variant="body2" 
                component="span"
                sx={{ 
                  fontFamily: 'GeogrotesqueTRIAL-Md',
                  fontSize: isSmallScreen ? '1rem' : '1rem',
                }}
              >
                ¿No tienes una cuenta? 
              </Typography>
              <Button
                variant="text"
                onClick={() => navigate('/registro')}
                sx={{ 
                  p: 0,
                  ml: 1,
                  textTransform: 'none',
                  color: '#802629',
                  fontFamily: 'GeogrotesqueTRIAL-SmBd',
                  fontSize: isSmallScreen ? '1rem' : '1rem',
                }}
              >
                Regístrate
              </Button>
            </Box>
          </form>
        </Paper>
      </Paper>
    </Box>
  );
};

export default Login;