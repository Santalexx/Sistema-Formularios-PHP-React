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
  Select,
  MenuItem,
  FormControl,
  FormHelperText,
  Grid,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ErrorIcon from '@mui/icons-material/Error';
import '../../styles/fonts.css';

const TIPOS_DOCUMENTO = [
  { 
    id: 1, 
    nombre: 'Tarjeta de identidad', 
    edadMin: 14, 
    edadMax: 17,
    patron: /^\d{10}$/,
    mensaje: 'debe tener 10 dígitos exactos',
    formato: 'XXXXXXXXXX',
    maxLength: 10
  },
  { 
    id: 2, 
    nombre: 'Cédula de Ciudadanía', 
    edadMin: 18, 
    edadMax: null,
    patron: /^\d{6,10}$/,
    mensaje: 'debe tener entre 6 y 10 dígitos',
    formato: 'XXXXXXXXXX',
    maxLength: 10
  },
  { 
    id: 3, 
    nombre: 'Cédula de Extranjería', 
    edadMin: 18, 
    edadMax: null,
    patron: /^\d{6,12}$/,
    mensaje: 'debe tener entre 6 y 12 dígitos',
    formato: 'XXXXXXXXXXXX',
    maxLength: 12
  },
  { 
    id: 4, 
    nombre: 'NIT', 
    edadMin: 18, 
    edadMax: null,
    patron: /^\d{9}-\d{1}$/,
    mensaje: 'debe tener 9 dígitos, guión y dígito de verificación',
    formato: 'XXXXXXXXX-X',
    maxLength: 11
  }
];

const AREAS_TRABAJO = [
  { id: 1, nombre: 'Mantenimiento' },
  { id: 2, nombre: 'Pulida y pintura' },
  { id: 3, nombre: 'Ensamble' },
  { id: 4, nombre: 'Almacén' },
  { id: 5, nombre: 'Empaque' },
  { id: 6, nombre: 'Máquinas' },
  { id: 7, nombre: 'Enchape' },
  { id: 8, nombre: 'Cerrajería' },
  { id: 9, nombre: 'Instalación' },
  { id: 11, nombre: 'Diseño' },
  { id: 12, nombre: 'SST' }
];

// Función para formatear NIT
const formatearNIT = (valor) => {
  // Eliminar cualquier carácter que no sea número o guión
  const soloNumeros = valor.replace(/[^\d-]/g, '');
  
  if (soloNumeros.length <= 9) {
    return soloNumeros;
  }
  
  const base = soloNumeros.slice(0, 9);
  const verificacion = soloNumeros.slice(9).replace(/-/g, '');
  
  if (verificacion.length > 0) {
    return `${base}-${verificacion.slice(0, 1)}`;
  }
  
  return base;
};

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.down('md'));
  
  const [formData, setFormData] = useState({
    nombre_completo: '',
    correo: '',
    fecha_nacimiento: '',
    tipo_documento_id: '',
    numero_documento: '',
    area_trabajo_id: '',
    telefono: '',
    contrasena: '',
    confirmar_contrasena: ''
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Función para calcular la edad
  const calcularEdad = (fechaNacimiento) => {
    const hoy = new Date();
    const fechaNac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }
    return edad;
  };

  // Validar edad según tipo de documento
  const validarEdadSegunDocumento = (fechaNacimiento, tipoDocumentoId) => {
    if (!fechaNacimiento || !tipoDocumentoId) return true;
    
    const tipoDocumento = TIPOS_DOCUMENTO.find(tipo => tipo.id === Number(tipoDocumentoId));
    if (!tipoDocumento) return true;

    const edad = calcularEdad(fechaNacimiento);
    const { edadMin, edadMax } = tipoDocumento;

    if (edad < edadMin) {
      return `La edad mínima para ${tipoDocumento.nombre} es ${edadMin} años`;
    }

    if (edadMax && edad > edadMax) {
      return `La edad máxima para ${tipoDocumento.nombre} es ${edadMax} años`;
    }

    return null;
  };

  // Función para manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Manejar caso específico del número de documento
    if (name === 'numero_documento') {
      // Obtener el tipo de documento seleccionado
      const tipoDocumentoId = Number(formData.tipo_documento_id);
      const tipoDoc = TIPOS_DOCUMENTO.find(tipo => tipo.id === tipoDocumentoId);
      
      if (!tipoDoc) {
        setFormData(prev => ({ ...prev, [name]: value }));
        return;
      }

      let valorFormateado = value;
      
      // Verificar que solo sean números (excepto para NIT que permite un guion)
      if (tipoDocumentoId === 4) {
        // Caso especial para NIT (permite guion)
        valorFormateado = formatearNIT(value);
      } else {
        // Para los demás tipos, solo permitir números
        valorFormateado = value.replace(/\D/g, '');
        
        // Limitar la longitud según el tipo de documento
        if (valorFormateado.length > tipoDoc.maxLength) {
          valorFormateado = valorFormateado.slice(0, tipoDoc.maxLength);
        }
      }
      
      setFormData(prev => ({ ...prev, [name]: valorFormateado }));
      
      // Validar el formato según el patrón del tipo de documento
      if (valorFormateado && !tipoDoc.patron.test(valorFormateado)) {
        setFieldErrors(prev => ({
          ...prev,
          [name]: tipoDoc.mensaje
        }));
      } else {
        setFieldErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
      
      return;
    }
    
    // Manejar caso específico del teléfono
    if (name === 'telefono') {
      // Solo permitir números y limitar a 10 dígitos
      const valorFormateado = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: valorFormateado }));
      
      // Validar que comience con 3 y tenga 10 dígitos
      if (valorFormateado && !/^3\d{9}$/.test(valorFormateado) && valorFormateado.length === 10) {
        setFieldErrors(prev => ({
          ...prev,
          [name]: 'El número debe empezar con 3 y tener 10 dígitos'
        }));
      } else {
        setFieldErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
      
      return;
    }
    
    // Para los demás campos, actualizar normalmente
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar el error del campo que se está modificando
    setFieldErrors(prev => ({
      ...prev,
      [name]: ''
    }));

    // Validaciones adicionales
    if (name === 'fecha_nacimiento' || name === 'tipo_documento_id') {
      const fechaNac = name === 'fecha_nacimiento' ? value : formData.fecha_nacimiento;
      const tipoDoc = name === 'tipo_documento_id' ? value : formData.tipo_documento_id;
      
      const errorEdad = validarEdadSegunDocumento(fechaNac, tipoDoc);
      if (errorEdad) {
        setFieldErrors(prev => ({
          ...prev,
          fecha_nacimiento: errorEdad
        }));
      } else {
        setFieldErrors(prev => ({
          ...prev,
          fecha_nacimiento: ''
        }));
      }
    }

    if (name === 'correo') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value) && value.length > 0) {
        setFieldErrors(prev => ({
          ...prev,
          correo: 'Ingrese un correo electrónico válido'
        }));
      }
    }
  };

  // Validación completa del formulario
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre_completo.trim()) {
      newErrors.nombre_completo = 'El nombre completo es requerido';
    }
    
    if (!formData.correo) {
      newErrors.correo = 'Por favor ingresa tu correo electrónico';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      newErrors.correo = 'El formato del correo electrónico no es válido';
    }
    
    if (!formData.fecha_nacimiento) {
      newErrors.fecha_nacimiento = 'La fecha de nacimiento es requerida';
    }

    if (!formData.tipo_documento_id) {
      newErrors.tipo_documento_id = 'Seleccione un tipo de documento';
    }

    if (!formData.numero_documento) {
      newErrors.numero_documento = 'El número de documento es requerido';
    } else {
      const tipoDoc = TIPOS_DOCUMENTO.find(tipo => tipo.id === Number(formData.tipo_documento_id));
      if (tipoDoc && !tipoDoc.patron.test(formData.numero_documento)) {
        newErrors.numero_documento = tipoDoc.mensaje;
      }
    }

    if (!formData.area_trabajo_id) {
      newErrors.area_trabajo_id = 'Seleccione un área de trabajo';
    }
    
    if (formData.fecha_nacimiento && formData.tipo_documento_id) {
      const errorEdad = validarEdadSegunDocumento(
        formData.fecha_nacimiento, 
        formData.tipo_documento_id
      );
      
      if (errorEdad) {
        newErrors.fecha_nacimiento = errorEdad;
      }
    }
  
    if (formData.telefono && !/^3\d{9}$/.test(formData.telefono)) {
      newErrors.telefono = 'El número debe empezar con 3 y tener 10 dígitos';
    }
  
    if (!formData.contrasena) {
      newErrors.contrasena = 'Por favor ingresa una contraseña';
    } else {
      const tieneMinuscula = /[a-z]/.test(formData.contrasena);
      const tieneMayuscula = /[A-Z]/.test(formData.contrasena);
      const tieneNumero = /[0-9]/.test(formData.contrasena);
      const tieneEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.contrasena);
      const longitudValida = formData.contrasena.length >= 8;
  
      if (!longitudValida || !tieneMinuscula || !tieneMayuscula || !tieneNumero || !tieneEspecial) {
        newErrors.contrasena = 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial';
      }
    }
  
    if (formData.contrasena !== formData.confirmar_contrasena) {
      newErrors.confirmar_contrasena = 'Las contraseñas no coinciden';
    }
  
    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Función para enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setGeneralError('');
    setLoading(true);

    try {
      const dataToSend = Object.fromEntries(
        Object.entries(formData).filter(([key]) => key !== 'confirmar_contrasena')
      );
      
      const result = await register(dataToSend);
      
      if (result.success) {
        navigate('/login', { 
          state: { message: 'Registro exitoso. Por favor inicie sesión.' } 
        });
      } else {
        setGeneralError(result.error);
      }
    } catch {
      setGeneralError('Error al registrar usuario. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Configuración uniforme para todas las resoluciones
  const calculateSize = () => {
    if (isSmallScreen) {
      return {
        width: '95%',
        maxWidth: '480px',
        maxHeight: '85vh',
        padding: '15px',
        overflowY: 'auto'
      };
    } else if (isMediumScreen) {
      return {
        width: '85%', 
        maxWidth: '680px',
        maxHeight: '85vh',
        padding: '20px',
        overflowY: 'auto'
      };
    } else {
      return {
        width: '680px',
        maxWidth: '680px',
        maxHeight: '85vh',
        padding: '25px 25px 25px 25px',
        overflowY: 'auto'
      };
    }
  };

  const outerBoxStyles = calculateSize();

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
      }}
    >
      {/* Panel principal rojo */}
      <Paper
        elevation={3}
        sx={{
          backgroundColor: '#802629',
          borderRadius: '10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          margin: 0,
          ...outerBoxStyles
        }}
      >
        {/* Logo en la parte superior */}
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
              width: isSmallScreen ? '140px' : '160px',
              height: 'auto',
              marginTop: '0px' 
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
            padding: isSmallScreen ? '12px' : isMediumScreen ? '15px' : '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
          }}
        >
          {/* Icono de usuario */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            mb: 2
          }}>
            <img 
              src="/assets/images/user-icon.png" 
              alt="User Icon" 
              style={{ 
                width: isSmallScreen ? '40px' : '45px',
                height: isSmallScreen ? '40px' : '45px'
              }} 
            />
            <Typography 
              variant="h6" 
              sx={{ 
                mt: 0.5,
                fontSize: isSmallScreen ? '0.9rem' : '1.1rem',
                fontFamily: 'GeogrotesqueTRIAL-SmBd',
                color: '#802629',
              }}
            >
              Registro de Usuario
            </Typography>
          </Box>

          {generalError && (
            <Alert severity="error" sx={{ mb: 0.5 }}>
              {generalError}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={isSmallScreen ? 0.5 : isMediumScreen ? 1 : 1.5}>
              <Grid item xs={12}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 0.2,
                    fontFamily: 'GeogrotesqueTRIAL-Md',
                    fontSize: isSmallScreen ? '0.7rem' : isMediumScreen ? '0.75rem' : '0.8rem',
                  }}
                >
                  NOMBRE COMPLETO
                </Typography>
                <TextField
                  fullWidth
                  name="nombre_completo"
                  placeholder="Ingrese su nombre completo"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.nombre_completo)}
                  helperText={fieldErrors.nombre_completo}
                  variant="outlined"
                  required
                  size="small"
                  sx={{
                    mb: 0.3,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      borderRadius: '4px',
                    },
                    '& .MuiFormHelperText-root': {
                      margin: 0,
                      marginTop: '1px',
                      fontSize: '0.65rem'
                    }
                  }}
                  InputProps={{
                    style: { 
                      fontFamily: 'GeogrotesqueTRIAL-Md', 
                      fontSize: isSmallScreen ? '0.75rem' : isMediumScreen ? '0.8rem' : '0.85rem',
                      padding: isSmallScreen ? '6px 8px' : isMediumScreen ? '7px 9px' : '8px 10px'
                    },
                    endAdornment: fieldErrors.nombre_completo ? (
                      <InputAdornment position="end">
                        <ErrorIcon color="error" fontSize="small" />
                      </InputAdornment>
                    ) : null,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 0.5,
                    fontFamily: 'GeogrotesqueTRIAL-Md',
                    fontSize: isSmallScreen ? '0.8rem' : '0.875rem',
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
                  error={Boolean(fieldErrors.correo)}
                  helperText={fieldErrors.correo}
                  variant="outlined"
                  required
                  size="small"
                  sx={{
                    mb: 0.5,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      borderRadius: '4px',
                    },
                    '& .MuiFormHelperText-root': {
                      margin: 0,
                      marginTop: '2px',
                    }
                  }}
                  InputProps={{
                    style: { 
                      fontFamily: 'GeogrotesqueTRIAL-Md', 
                      fontSize: isSmallScreen ? '0.85rem' : '0.9rem',
                      padding: isSmallScreen ? '8px 10px' : '10px 12px'
                    },
                    endAdornment: fieldErrors.correo ? (
                      <InputAdornment position="end">
                        <ErrorIcon color="error" fontSize="small" />
                      </InputAdornment>
                    ) : null,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 0.5,
                    fontFamily: 'GeogrotesqueTRIAL-Md',
                    fontSize: isSmallScreen ? '0.8rem' : '0.875rem',
                  }}
                >
                  FECHA DE NACIMIENTO
                </Typography>
                <TextField
                  fullWidth
                  name="fecha_nacimiento"
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.fecha_nacimiento)}
                  helperText={fieldErrors.fecha_nacimiento}
                  variant="outlined"
                  required
                  size="small"
                  sx={{
                    mb: 0.5,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      borderRadius: '4px',
                    },
                    '& .MuiFormHelperText-root': {
                      margin: 0,
                      marginTop: '2px',
                    }
                  }}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    style: { 
                      fontFamily: 'GeogrotesqueTRIAL-Md', 
                      fontSize: isSmallScreen ? '0.85rem' : '0.9rem',
                      padding: isSmallScreen ? '8px 10px' : '10px 12px'
                    },
                    endAdornment: fieldErrors.fecha_nacimiento ? (
                      <InputAdornment position="end">
                        <ErrorIcon color="error" fontSize="small" />
                      </InputAdornment>
                    ) : null,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 0.5,
                    fontFamily: 'GeogrotesqueTRIAL-Md',
                    fontSize: isSmallScreen ? '0.8rem' : '0.875rem',
                  }}
                >
                  TIPO DE DOCUMENTO
                </Typography>
                <FormControl 
                  fullWidth
                  error={Boolean(fieldErrors.tipo_documento_id)}
                  size="small"
                  sx={{
                    mb: 0.5,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      borderRadius: '4px',
                    },
                    '& .MuiFormHelperText-root': {
                      margin: 0,
                      marginTop: '2px',
                    }
                  }}
                >
                  <Select
                    name="tipo_documento_id"
                    value={formData.tipo_documento_id}
                    onChange={handleChange}
                    displayEmpty
                    required
                    inputProps={{ 
                      style: { 
                        fontFamily: 'GeogrotesqueTRIAL-Md',
                        fontSize: isSmallScreen ? '0.75rem' : isMediumScreen ? '0.8rem' : '0.85rem',
                        padding: isSmallScreen ? '6px 8px' : isMediumScreen ? '7px 9px' : '8px 10px'
                      } 
                    }}
                  >
                    <MenuItem value="" disabled>
                      <em>Seleccione tipo de documento</em>
                    </MenuItem>
                    {TIPOS_DOCUMENTO.map((tipo) => (
                      <MenuItem 
                        key={tipo.id} 
                        value={tipo.id}
                        sx={{
                          fontSize: isSmallScreen ? '0.85rem' : '0.9rem',
                          fontFamily: 'GeogrotesqueTRIAL-Md',
                        }}
                      >
                        {tipo.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                  {fieldErrors.tipo_documento_id && (
                    <FormHelperText>{fieldErrors.tipo_documento_id}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 0.5,
                    fontFamily: 'GeogrotesqueTRIAL-Md',
                    fontSize: isSmallScreen ? '0.8rem' : '0.875rem',
                  }}
                >
                  NÚMERO DE DOCUMENTO
                </Typography>
                <TextField
                  fullWidth
                  name="numero_documento"
                  placeholder={formData.tipo_documento_id ? 
                    `Ej: ${TIPOS_DOCUMENTO.find(t => t.id === Number(formData.tipo_documento_id))?.formato || 'XXXXXXXXXX'}` : 
                    'XXXXXXXXXX'
                  }
                  value={formData.numero_documento}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.numero_documento)}
                  helperText={fieldErrors.numero_documento}
                  variant="outlined"
                  required
                  size="small"
                  sx={{
                    mb: 0.5,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      borderRadius: '4px',
                    },
                    '& .MuiFormHelperText-root': {
                      margin: 0,
                      marginTop: '2px',
                    }
                  }}
                  InputProps={{
                    style: { 
                      fontFamily: 'GeogrotesqueTRIAL-Md', 
                      fontSize: isSmallScreen ? '0.85rem' : '0.9rem',
                      padding: isSmallScreen ? '8px 10px' : '10px 12px'
                    },
                    endAdornment: fieldErrors.numero_documento ? (
                      <InputAdornment position="end">
                        <ErrorIcon color="error" fontSize="small" />
                      </InputAdornment>
                    ) : null,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 0.5,
                    fontFamily: 'GeogrotesqueTRIAL-Md',
                    fontSize: isSmallScreen ? '0.8rem' : '0.875rem',
                  }}
                >
                  ÁREA DE TRABAJO
                </Typography>
                <FormControl 
                  fullWidth
                  error={Boolean(fieldErrors.area_trabajo_id)}
                  size="small"
                  sx={{
                    mb: 0.5,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      borderRadius: '4px',
                    },
                    '& .MuiFormHelperText-root': {
                      margin: 0,
                      marginTop: '2px',
                    }
                  }}
                >
                  <Select
                    name="area_trabajo_id"
                    value={formData.area_trabajo_id}
                    onChange={handleChange}
                    displayEmpty
                    required
                    inputProps={{ 
                      style: { 
                        fontFamily: 'GeogrotesqueTRIAL-Md',
                        fontSize: isSmallScreen ? '0.85rem' : '0.9rem',
                        padding: isSmallScreen ? '8px 10px' : '10px 12px'
                      } 
                    }}
                  >
                    <MenuItem value="" disabled>
                      <em>Seleccione área de trabajo</em>
                    </MenuItem>
                    {AREAS_TRABAJO.map((area) => (
                      <MenuItem 
                        key={area.id} 
                        value={area.id}
                        sx={{
                          fontSize: isSmallScreen ? '0.85rem' : '0.9rem',
                          fontFamily: 'GeogrotesqueTRIAL-Md',
                        }}
                      >
                        {area.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                  {fieldErrors.area_trabajo_id && (
                    <FormHelperText>{fieldErrors.area_trabajo_id}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 0.5,
                    fontFamily: 'GeogrotesqueTRIAL-Md',
                    fontSize: isSmallScreen ? '0.8rem' : '0.875rem',
                  }}
                >
                  TELÉFONO (OPCIONAL)
                </Typography>
                <TextField
                  fullWidth
                  name="telefono"
                  placeholder="3XXXXXXXXX"
                  value={formData.telefono}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.telefono)}
                  helperText={fieldErrors.telefono}
                  variant="outlined"
                  size="small"
                  sx={{
                    mb: 0.5,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      borderRadius: '4px',
                    },
                    '& .MuiFormHelperText-root': {
                      margin: 0,
                      marginTop: '2px',
                    }
                  }}
                  InputProps={{
                    style: { 
                      fontFamily: 'GeogrotesqueTRIAL-Md', 
                      fontSize: isSmallScreen ? '0.85rem' : '0.9rem',
                      padding: isSmallScreen ? '8px 10px' : '10px 12px'
                    },
                    endAdornment: fieldErrors.telefono ? (
                      <InputAdornment position="end">
                        <ErrorIcon color="error" fontSize="small" />
                      </InputAdornment>
                    ) : null,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 0.5,
                    fontFamily: 'GeogrotesqueTRIAL-Md',
                    fontSize: isSmallScreen ? '0.8rem' : '0.875rem',
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
                  error={Boolean(fieldErrors.contrasena)}
                  helperText={fieldErrors.contrasena}
                  variant="outlined"
                  required
                  size="small"
                  sx={{
                    mb: 0.5,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      borderRadius: '4px',
                    },
                    '& .MuiFormHelperText-root': {
                      margin: 0,
                      marginTop: '2px',
                    }
                  }}
                  InputProps={{
                    style: { 
                      fontFamily: 'GeogrotesqueTRIAL-Md', 
                      fontSize: isSmallScreen ? '0.85rem' : '0.9rem',
                      padding: isSmallScreen ? '8px 10px' : '10px 12px'
                    },
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                          sx={{ minWidth: '36px', padding: 0 }}
                        >
                          {showPassword ? 
                            <VisibilityOffIcon sx={{ color: fieldErrors.contrasena ? 'error' : 'gray', fontSize: isSmallScreen ? '18px' : '20px' }} /> : 
                            <VisibilityIcon sx={{ color: fieldErrors.contrasena ? 'error' : 'gray', fontSize: isSmallScreen ? '18px' : '20px' }} />
                          }
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 0.5,
                    fontFamily: 'GeogrotesqueTRIAL-Md',
                    fontSize: isSmallScreen ? '0.8rem' : '0.875rem',
                  }}
                >
                  CONFIRMAR CONTRASEÑA
                </Typography>
                <TextField
                  fullWidth
                  name="confirmar_contrasena"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="•••••••••••••••"
                  value={formData.confirmar_contrasena}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.confirmar_contrasena)}
                  helperText={fieldErrors.confirmar_contrasena}
                  variant="outlined"
                  required
                  size="small"
                  sx={{
                    mb: 0.5,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      borderRadius: '4px',
                    },
                    '& .MuiFormHelperText-root': {
                      margin: 0,
                      marginTop: '2px',
                    }
                  }}
                  InputProps={{
                    style: { 
                      fontFamily: 'GeogrotesqueTRIAL-Md', 
                      fontSize: isSmallScreen ? '0.85rem' : '0.9rem',
                      padding: isSmallScreen ? '8px 10px' : '10px 12px'
                    },
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          tabIndex={-1}
                          sx={{ minWidth: '36px', padding: 0 }}
                        >
                          {showConfirmPassword ? 
                            <VisibilityOffIcon sx={{ color: fieldErrors.confirmar_contrasena ? 'error' : 'gray', fontSize: isSmallScreen ? '18px' : '20px' }} /> : 
                            <VisibilityIcon sx={{ color: fieldErrors.confirmar_contrasena ? 'error' : 'gray', fontSize: isSmallScreen ? '18px' : '20px' }} />
                          }
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ 
                mt: 2.5, 
                mb: 0.5,
                backgroundColor: '#802629',
                '&:hover': {
                  backgroundColor: '#6b1f21',
                },
                py: isSmallScreen ? 0.5 : 0.8,
                borderRadius: '25px',
                fontFamily: 'GeogrotesqueTRIAL-SmBd',
                fontSize: isSmallScreen ? '1rem' : '1rem',
              }}
            >
              {loading ? 'REGISTRANDO...' : 'REGISTRARSE'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2, mb: 1 }}>
              <Typography 
                variant="body2" 
                component="span"
                sx={{ 
                  fontFamily: 'GeogrotesqueTRIAL-Md',
                  fontSize: isSmallScreen ? '1rem' : '1rem',
                }}
              >
                ¿Ya tienes una cuenta? 
              </Typography>
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                sx={{ 
                  p: 0,
                  ml: 0.5,
                  textTransform: 'none',
                  color: '#802629',
                  fontFamily: 'GeogrotesqueTRIAL-SmBd',
                  fontSize: isSmallScreen ? '1rem' : '1rem',
                }}
              >
                Inicia sesión
              </Button>
            </Box>
          </form>
        </Paper>
      </Paper>
    </Box>
  );
};

export default Register;