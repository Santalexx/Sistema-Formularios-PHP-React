// src/components/auth/ResetPassword.jsx
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  CircularProgress
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockResetIcon from '@mui/icons-material/LockReset';
// import axios from 'axios';
import '../../styles/fonts.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [formData, setFormData] = useState({
    contrasena_nueva: '',
    confirmar_contrasena: ''
  });
  const [showPassword, setShowPassword] = useState({
    new: false,
    confirm: false
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validatePassword = (password) => {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasLength = password.length >= 8;
    
    if (!hasLength) return "La contraseña debe tener al menos 8 caracteres";
    if (!hasLower) return "La contraseña debe incluir al menos una letra minúscula";
    if (!hasUpper) return "La contraseña debe incluir al menos una letra mayúscula";
    if (!hasNumber) return "La contraseña debe incluir al menos un número";
    if (!hasSpecial) return "La contraseña debe incluir al menos un carácter especial";
    
    return null;
  };
  
  // Para PRODUCCIÓN (con backend real)
  /*
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validaciones...
    if (formData.contrasena_nueva !== formData.confirmar_contrasena) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    const passwordError = validatePassword(formData.contrasena_nueva);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    
    setLoading(true);
  
    try {
      // OPCIÓN PARA PRODUCCIÓN: conexión real al backend
      const response = await axios.post('http://localhost:8000/auth/resetear-password', {
        token, // Usamos el token de la URL
        contrasena_nueva: formData.contrasena_nueva
      });
      
      // Verificamos la respuesta
      if (response.data && response.status === 200) {
        setSuccess(true);
      } else {
        setError('Ocurrió un error inesperado. Por favor, intente nuevamente.');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error al resetear contraseña:', error);
      setError(error.response?.data?.mensaje || 'Error al restablecer la contraseña. Por favor, intente nuevamente.');
      setLoading(false);
    }
  };
  */

  // Para PRUEBAS (sin backend real)
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validar que las contraseñas coincidan
    if (formData.contrasena_nueva !== formData.confirmar_contrasena) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    // Validar requisitos de la contraseña
    const passwordError = validatePassword(formData.contrasena_nueva);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    
    setLoading(true);
  
    try {
      // OPCIÓN DE SIMULACIÓN: Usamos esto para probar la interfaz sin backend
      console.log("Simulando restablecimiento de contraseña con token:", token);
      console.log("Nueva contraseña (solo para pruebas):", formData.contrasena_nueva);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(true);
      setLoading(false);
    } catch (error) {
      console.error('Error simulado:', error);
      setError('Error al restablecer la contraseña. Por favor, intente nuevamente.');
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
              <LockResetIcon sx={{ fontSize: 60, color: '#802629' }} />
            </Box>
            
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 3,
                fontFamily: 'GeogrotesqueTRIAL-SmBd',
                color: '#802629'
              }}
            >
              Contraseña Restablecida
            </Typography>
            
            <Typography 
              sx={{ 
                mb: 4,
                fontFamily: 'GeogrotesqueTRIAL-Md',
                color: '#4a1d1f'
              }}
            >
              Tu contraseña ha sido restablecida exitosamente.
              Ahora puedes iniciar sesión con tu nueva contraseña.
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
              Ir al inicio de sesión
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
          {/* Icono */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            mb: 2
          }}>
            <LockResetIcon sx={{ fontSize: 60, color: '#802629' }} />
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
            Establecer Nueva Contraseña
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
              Por favor ingresa y confirma tu nueva contraseña.
            </Typography>
            
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 0.5,
                fontFamily: 'GeogrotesqueTRIAL-Md',
                color: '#4a1d1f'
              }}
            >
              NUEVA CONTRASEÑA
            </Typography>
            <TextField
              fullWidth
              name="contrasena_nueva"
              type={showPassword.new ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={formData.contrasena_nueva}
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
                style: { fontFamily: 'GeogrotesqueTRIAL-Md' },
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                      tabIndex={-1}
                      sx={{ minWidth: '40px', padding: 0 }}
                    >
                      {showPassword.new ? 
                        <VisibilityOffIcon sx={{ color: 'gray', fontSize: isSmallScreen ? '18px' : '24px' }} /> : 
                        <VisibilityIcon sx={{ color: 'gray', fontSize: isSmallScreen ? '18px' : '24px' }} />
                      }
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
            
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 0.5,
                fontFamily: 'GeogrotesqueTRIAL-Md',
                color: '#4a1d1f'
              }}
            >
              CONFIRMAR CONTRASEÑA
            </Typography>
            <TextField
              fullWidth
              name="confirmar_contrasena"
              type={showPassword.confirm ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={formData.confirmar_contrasena}
              onChange={handleChange}
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
                style: { fontFamily: 'GeogrotesqueTRIAL-Md' },
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                      tabIndex={-1}
                      sx={{ minWidth: '40px', padding: 0 }}
                    >
                      {showPassword.confirm ? 
                        <VisibilityOffIcon sx={{ color: 'gray', fontSize: isSmallScreen ? '18px' : '24px' }} /> : 
                        <VisibilityIcon sx={{ color: 'gray', fontSize: isSmallScreen ? '18px' : '24px' }} />
                      }
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
            
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block',
                mb: 3,
                fontFamily: 'GeogrotesqueTRIAL-Md',
                color: '#4a1d1f'
              }}
            >
              La contraseña debe contener al menos 8 caracteres, incluir minúsculas, 
              mayúsculas, números y caracteres especiales.
            </Typography>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ 
                backgroundColor: '#802629',
                color: 'white',
                fontFamily: 'GeogrotesqueTRIAL-SmBd',
                '&:hover': { backgroundColor: '#6b1f21' },
                py: 1.2,
                borderRadius: '25px',
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  Procesando...
                </Box>
              ) : 'Guardar nueva contraseña'}
            </Button>
          </form>
        </Paper>
      </Paper>
    </Box>
  );
};

export default ResetPassword;