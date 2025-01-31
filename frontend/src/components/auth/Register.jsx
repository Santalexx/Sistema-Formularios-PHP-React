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
import { Visibility, VisibilityOff } from '@mui/icons-material';

// Datos estáticos
const TIPOS_DOCUMENTO = [
  { id: 1, nombre: 'Tarjeta de identidad' },
  { id: 2, nombre: 'Cédula de Ciudadanía' },
  { id: 3, nombre: 'Cédula de Extranjería' },
  { id: 4, nombre: 'NIT' },
  { id: 5, nombre: 'Pasaporte' }
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
  { id: 10, nombre: 'Administración' },
  { id: 11, nombre: 'Diseño' },
  { id: 12, nombre: 'SST' },
  { id: 13, nombre: 'Gestión humana' }
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

  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (formData.contrasena !== formData.confirmar_contrasena) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    const requiredFields = [
      'nombre_completo',
      'correo',
      'fecha_nacimiento',
      'tipo_documento_id',
      'numero_documento',
      'area_trabajo_id',
      'contrasena'
    ];

    const emptyFields = requiredFields.filter(field => !formData[field]);
    if (emptyFields.length > 0) {
      setError('Por favor complete todos los campos obligatorios');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setError('');
    setLoading(true);

    try {
      // Excluimos confirmar_contrasena usando destructuring
      const dataToSend = Object.fromEntries(
        Object.entries(formData).filter(([key]) => key !== 'confirmar_contrasena')
      );
      
      const result = await register(dataToSend);
      
      if (result.success) {
        navigate('/login', { 
          state: { message: 'Registro exitoso. Por favor inicie sesión.' } 
        });
      } else {
        setError(result.error);
      }
    } catch {
      setError('Error al registrar usuario. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(45deg, #F5DEB3 30%, #DEB887 90%)',
        padding: 3
      }}
    >
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

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre Completo"
                  name="nombre_completo"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Correo Electrónico"
                  name="correo"
                  type="email"
                  value={formData.correo}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fecha de Nacimiento"
                  name="fecha_nacimiento"
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={handleChange}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Tipo de Documento"
                  name="tipo_documento_id"
                  value={formData.tipo_documento_id}
                  onChange={handleChange}
                  required
                >
                  {TIPOS_DOCUMENTO.map((tipo) => (
                    <MenuItem key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Número de Documento"
                  name="numero_documento"
                  value={formData.numero_documento}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Área de Trabajo"
                  name="area_trabajo_id"
                  value={formData.area_trabajo_id}
                  onChange={handleChange}
                  required
                >
                  {AREAS_TRABAJO.map((area) => (
                    <MenuItem key={area.id} value={area.id}>
                      {area.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Teléfono (Opcional)"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                />
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