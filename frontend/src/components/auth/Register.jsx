import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  MenuItem,
  Grid,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Error as ErrorIcon } from '@mui/icons-material';

const TIPOS_DOCUMENTO = [
  { 
    id: 1, 
    nombre: 'Tarjeta de identidad', 
    edadMin: 14, 
    edadMax: 17,
    patron: /^\d{10}$/,
    mensaje: 'debe tener 10 dígitos exactos',
    formato: 'XXXXXXXXXX'
  },
  { 
    id: 2, 
    nombre: 'Cédula de Ciudadanía', 
    edadMin: 18, 
    edadMax: null,
    patron: /^\d{6,10}$/,
    mensaje: 'debe tener entre 6 y 10 dígitos',
    formato: 'XXXXXXXXXX'
  },
  { 
    id: 3, 
    nombre: 'Cédula de Extranjería', 
    edadMin: 18, 
    edadMax: null,
    patron: /^\d{6,12}$/,
    mensaje: 'debe tener entre 6 y 12 dígitos',
    formato: 'XXXXXXXXXXXX'
  },
  { 
    id: 4, 
    nombre: 'NIT', 
    edadMin: 18, 
    edadMax: null,
    patron: /^\d{9}-\d{1}$/,
    mensaje: 'debe tener 9 dígitos, guión y dígito de verificación',
    formato: 'XXXXXXXXX-X'
  }
];

const formatearNIT = (valor) => {
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

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'numero_documento') {
      if (Number(formData.tipo_documento_id) === 4) {
        const valorFormateado = formatearNIT(value);
        setFormData(prev => ({
          ...prev,
          [name]: valorFormateado
        }));
    
        const tipoDoc = TIPOS_DOCUMENTO.find(tipo => tipo.id === 4);
        if (!tipoDoc.patron.test(valorFormateado) && valorFormateado.length > 0) {
          setFieldErrors(prev => ({
            ...prev,
            [name]: tipoDoc.mensaje
          }));
        }
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
    
        const tipoDoc = TIPOS_DOCUMENTO.find(tipo => 
          tipo.id === Number(formData.tipo_documento_id)
        );
        if (tipoDoc && !tipoDoc.patron.test(value) && value.length > 0) {
          setFieldErrors(prev => ({
            ...prev,
            [name]: tipoDoc.mensaje
          }));
        }
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    setFieldErrors(prev => ({
      ...prev,
      [name]: ''
    }));

    if (name === 'fecha_nacimiento' || name === 'tipo_documento_id') {
      const fechaNac = name === 'fecha_nacimiento' ? value : formData.fecha_nacimiento;
      const tipoDoc = name === 'tipo_documento_id' ? value : formData.tipo_documento_id;
      
      const errorEdad = validarEdadSegunDocumento(fechaNac, tipoDoc);
      if (errorEdad) {
        setFieldErrors(prev => ({
          ...prev,
          fecha_nacimiento: errorEdad
        }));
      }
    }

    if (name === 'telefono' && value) {
      const telefonoRegex = /^3\d{9}$/;
      if (!telefonoRegex.test(value)) {
        setFieldErrors(prev => ({
          ...prev,
          telefono: 'El número debe empezar con 3 y tener 10 dígitos'
        }));
      }
    }

    if (name === 'correo') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setFieldErrors(prev => ({
          ...prev,
          correo: 'Ingrese un correo electrónico válido'
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.fecha_nacimiento && formData.tipo_documento_id) {
      const tipoDoc = TIPOS_DOCUMENTO.find(tipo => tipo.id === Number(formData.tipo_documento_id));
      const edad = calcularEdad(formData.fecha_nacimiento);
      
      if (tipoDoc) {
        if (edad < tipoDoc.edadMin || (tipoDoc.edadMax && edad > tipoDoc.edadMax)) {
          newErrors.fecha_nacimiento = `Para ${tipoDoc.nombre} debe tener ${
            tipoDoc.edadMax ? 
              `entre ${tipoDoc.edadMin} y ${tipoDoc.edadMax}` : 
              `mínimo ${tipoDoc.edadMin}`
          } años`;
        }
      }
    }
  
    if (!formData.correo) {
      newErrors.correo = 'Por favor ingresa tu correo electrónico';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      newErrors.correo = 'El formato del correo electrónico no es válido';
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

  const renderTextField = (name, label, options = {}) => {
    const {
      type = 'text',
      required = true,
      select = false,
      items = [],
      multiline = false,
      rows = 1,
      inputProps = {},
      placeholder,
      helperText,
      InputLabelProps = {}
    } = options;

    return (
      <TextField
        fullWidth
        label={label}
        name={name}
        type={type}
        value={formData[name]}
        onChange={handleChange}
        required={required}
        select={select}
        multiline={multiline}
        rows={rows}
        error={Boolean(fieldErrors[name])}
        helperText={helperText || fieldErrors[name]}
        placeholder={placeholder}
        InputLabelProps={{
          shrink: true,
          ...InputLabelProps
        }}
        inputProps={{
          ...(type === 'date' ? { placeholder: 'dd/mm/aaaa' } : {}),
          ...inputProps
        }}
        InputProps={{
          endAdornment: fieldErrors[name] ? (
            <InputAdornment position="end">
              <ErrorIcon color="error" />
            </InputAdornment>
          ) : null
        }}
      >
        {select && items.map(item => (
          <MenuItem key={item.id} value={item.id}>
            {item.nombre}
          </MenuItem>
        ))}
      </TextField>
    );
  };

  const renderDocumentoInput = () => {
    const tipoDoc = TIPOS_DOCUMENTO.find(
      tipo => tipo.id === Number(formData.tipo_documento_id)
    );

    return renderTextField('numero_documento', 'Número de Documento', {
      placeholder: tipoDoc ? `Ejemplo: ${tipoDoc.formato}` : 'XXXXXXXXXX',
      inputProps: {
        maxLength: tipoDoc?.id === 4 ? 11 : 12,
        pattern: tipoDoc?.id === 4 ? '\\d{9}-\\d{1}' : undefined,
      },
      helperText: tipoDoc?.mensaje || '',
    });
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(45deg, #F5DEB3 30%, #DEB887 90%)',
      padding: 3
    }}>
      <Card sx={{ maxWidth: 800, width: '100%' }}>
        <CardContent sx={{ padding: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h5" component="h1" gutterBottom>
              Registro de Usuario
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Complete el formulario para crear su cuenta
            </Typography>
          </Box>

          {generalError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {generalError}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                {renderTextField('nombre_completo', 'Nombre Completo')}
              </Grid>

              <Grid item xs={12} sm={6}>
                {renderTextField('correo', 'Correo Electrónico', { type: 'email' })}
              </Grid>

              <Grid item xs={12} sm={6}>
                {renderTextField('fecha_nacimiento', 'Fecha de Nacimiento', {
                  type: 'date',
                  InputLabelProps: { 
                    shrink: true,
                    style: { transform: 'translate(14px, -9px) scale(0.75)' }
                  }
                })}
              </Grid>

              <Grid item xs={12} sm={6}>
                {renderTextField('tipo_documento_id', 'Tipo de Documento', {
                  select: true,
                  items: TIPOS_DOCUMENTO
                })}
              </Grid>
              <Grid item xs={12} sm={6}>
                {renderDocumentoInput()}
                {Number(formData.tipo_documento_id) === 4 && (
                  <Typography 
                    variant="caption" 
                    color="textSecondary" 
                    sx={{ mt: 1, display: 'block' }}
                  >
                    El NIT debe tener 9 dígitos seguidos de un guión y el dígito de verificación
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} sm={6}>
                {renderTextField('area_trabajo_id', 'Área de Trabajo', {
                  select: true,
                  items: AREAS_TRABAJO
                })}
              </Grid>

              <Grid item xs={12} sm={6}>
                {renderTextField('telefono', 'Teléfono', {
                  required: false,
                  inputProps: {
                    pattern: '^3\\d{9}$',
                    placeholder: 'XXXXXXXXXX'
                  }
                })}
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contraseña"
                  name="contrasena"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.contrasena}
                  onChange={handleChange}
                  required
                  error={Boolean(fieldErrors.contrasena)}
                  helperText={fieldErrors.contrasena}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirmar Contraseña"
                  name="confirmar_contrasena"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmar_contrasena}
                  onChange={handleChange}
                  required
                  error={Boolean(fieldErrors.confirmar_contrasena)}
                  helperText={fieldErrors.confirmar_contrasena}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
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
              color="primary"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/login')}
                sx={{ textDecoration: 'none' }}
              >
                ¿Ya tienes cuenta? Inicia sesión
              </Link>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register;