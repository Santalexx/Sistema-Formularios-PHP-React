// src/components/auth/RecoverPassword.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  useMediaQuery,
  useTheme,
  CircularProgress
} from '@mui/material';
// import axios from 'axios';
import EmailIcon from '@mui/icons-material/Email';
import '../../styles/fonts.css';

const RecoverPassword = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Para PRODUCCIÓN (con backend real)
  /*
  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

    try {
      // OPCIÓN PARA PRODUCCIÓN: conexión real al backend
      const response = await axios.post('http://localhost:8000/auth/recuperar-password', { 
        correo: email 
      });
      
      // Verificamos la respuesta
      if (response.data && response.status === 200) {
        setSuccess(true);
      } else {
        setError('Ocurrió un error inesperado. Por favor, intente nuevamente.');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error al enviar solicitud de recuperación:', error);
      setError(error.response?.data?.mensaje || 'Error al enviar el correo. Por favor, intente nuevamente.');
      setLoading(false);
    }
  };
  */

  // Para PRUEBAS (simulacion sin backend)
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
  
    try {
      // OPCIÓN DE SIMULACIÓN: Usamos esto para probar la interfaz sin backend
      console.log("Simulando envío de recuperación para:", email);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(true);
      setLoading(false);
    } catch (error) {
      console.error('Error simulado:', error);
      setError('Error al enviar el correo. Por favor, intente nuevamente.');
      setLoading(false);
    }
  };
  

  if (success) {
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
        <Paper
          elevation={3}
          sx={{
            backgroundColor: '#802629',
            width: isSmallScreen ? '90%' : '450px',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '30px',
            maxWidth: '450px',
          }}
        >
          {/* Logo */}
          <Box sx={{ 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'center',
            mb: 3
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

          <Paper
            elevation={0}
            sx={{
              backgroundColor: '#deb886',
              width: '100%',
              borderRadius: '20px',
              padding: '25px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              mb: 3
            }}>
              <EmailIcon sx={{ fontSize: 60, color: '#802629' }} />
            </Box>
            
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 3,
                fontFamily: 'GeogrotesqueTRIAL-SmBd',
                color: '#802629'
              }}
            >
              Correo Enviado
            </Typography>
            
            <Typography 
              sx={{ 
                mb: 4,
                fontFamily: 'GeogrotesqueTRIAL-Md',
                color: '#4a1d1f'
              }}
            >
              Se ha enviado un correo con instrucciones para restablecer tu contraseña.
              Por favor, revisa tu bandeja de entrada y sigue las instrucciones.
            </Typography>
            
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              sx={{ 
                backgroundColor: '#802629',
                color: 'white',
                fontFamily: 'GeogrotesqueTRIAL-SmBd',
                '&:hover': { backgroundColor: '#6b1f21' },
                py: 1.2,
                px: 3,
                borderRadius: '25px',
              }}
            >
              Volver al inicio de sesión
            </Button>
          </Paper>
        </Paper>
      </Box>
    );
  }

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
      <Paper
        elevation={3}
        sx={{
          backgroundColor: '#802629',
          width: isSmallScreen ? '90%' : '450px',
          borderRadius: '10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '30px',
          maxWidth: '450px',
        }}
      >
        {/* Logo */}
        <Box sx={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'center',
          mb: 3
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
          }}
        >
          {/* Icono de recuperación */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            mb: 2
          }}>
            <EmailIcon sx={{ fontSize: 60, color: '#802629' }} />
          </Box>

          <Typography 
            variant="h6" 
            sx={{ 
              mb: 3,
              fontFamily: 'GeogrotesqueTRIAL-SmBd',
              color: '#802629',
              textAlign: 'center'
            }}
          >
            Recuperar Contraseña
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <Typography 
              sx={{ 
                mb: 2,
                fontFamily: 'GeogrotesqueTRIAL-Md',
                color: '#4a1d1f'
              }}
            >
              Ingresa tu correo electrónico para recibir instrucciones de recuperación de contraseña.
            </Typography>
            
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 0.5,
                fontFamily: 'GeogrotesqueTRIAL-Md',
                color: '#4a1d1f'
              }}
            >
              CORREO ELECTRÓNICO
            </Typography>
            <TextField
              fullWidth
              name="correo"
              type="email"
              placeholder="email@muebleideas.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              variant="outlined"
              required
              size={isSmallScreen ? "small" : "medium"}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  borderRadius: '4px',
                }
              }}
              InputProps={{
                style: { fontFamily: 'GeogrotesqueTRIAL-Md' }
              }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/login')}
                sx={{ 
                  color: '#802629',
                  borderColor: '#802629',
                  fontFamily: 'GeogrotesqueTRIAL-Md',
                  '&:hover': { 
                    borderColor: '#802629', 
                    backgroundColor: 'rgba(128, 38, 41, 0.04)' 
                  },
                  textTransform: 'none',
                  py: 1,
                  borderRadius: '25px',
                }}
              >
                Volver
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ 
                  backgroundColor: '#802629',
                  color: 'white',
                  fontFamily: 'GeogrotesqueTRIAL-SmBd',
                  '&:hover': { backgroundColor: '#6b1f21' },
                  py: 1,
                  px: 3,
                  borderRadius: '25px',
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                    Enviando...
                  </Box>
                ) : 'Enviar correo'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Paper>
    </Box>
  );
};

export default RecoverPassword;