import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility,
  VisibilityOff,
  Save as SaveIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

const passwordValidation = (password) => {
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    isValid: minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
    requirements: {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
    },
  };
};

const AdminProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    contrasena_actual: '',
    contrasena_nueva: '',
    confirmar_contrasena: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await axios.get('http://localhost:8000/auth/perfil');
      setProfile(data.usuario);
      setEditedProfile(data.usuario);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar el perfil:', error);
      setError('Error al cargar el perfil');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (!user || user.rol_id !== 1) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tiene permisos para acceder a esta sección
        </Alert>
      </Box>
    );
  }

  const handleEditToggle = () => {
    if (editing) {
      setEditedProfile(profile);
    }
    setEditing(!editing);
    setError('');
    setSuccess('');
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateProfileChanges = () => {
    if (!editedProfile.nombre_completo?.trim()) {
      setError('El nombre completo es requerido');
      return false;
    }
    if (!editedProfile.fecha_nacimiento) {
      setError('La fecha de nacimiento es requerida');
      return false;
    }
    return true;
  };

  const handleSaveProfile = async () => {
    try {
      if (!validateProfileChanges()) return;

      setError('');
      setSuccess('');
      
      await axios.put('http://localhost:8000/auth/actualizar-perfil', editedProfile);
      
      setProfile(editedProfile);
      setSuccess('Perfil actualizado correctamente');
      setEditing(false);
      await fetchProfile();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al actualizar el perfil');
    }
  };

  const validatePasswordForm = () => {
    if (!passwordForm.contrasena_actual) {
      setError('La contraseña actual es requerida');
      return false;
    }

    if (passwordForm.contrasena_nueva !== passwordForm.confirmar_contrasena) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    const validation = passwordValidation(passwordForm.contrasena_nueva);
    if (!validation.isValid) {
      setError('La nueva contraseña no cumple con los requisitos de seguridad');
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    try {
      setError('');
      if (!validatePasswordForm()) return;

      await axios.put('http://localhost:8000/auth/cambiar-contrasena', {
        contrasena_actual: passwordForm.contrasena_actual,
        contrasena_nueva: passwordForm.contrasena_nueva,
      });

      setSuccess('Contraseña actualizada correctamente');
      setOpenPasswordDialog(false);
      setPasswordForm({
        contrasena_actual: '',
        contrasena_nueva: '',
        confirmar_contrasena: '',
      });
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al cambiar la contraseña');
    }
  };

  const handleClosePasswordDialog = () => {
    setOpenPasswordDialog(false);
    setPasswordForm({
      contrasena_actual: '',
      contrasena_nueva: '',
      confirmar_contrasena: '',
    });
    setError('');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">
              Información Personal
            </Typography>
            <Box>
              <Button
                startIcon={editing ? <SaveIcon /> : <EditIcon />}
                variant="contained"
                color={editing ? "success" : "primary"}
                onClick={editing ? handleSaveProfile : handleEditToggle}
                sx={{ mr: 1 }}
              >
                {editing ? 'Guardar' : 'Editar'}
              </Button>
              {!editing && (
                <Button
                  startIcon={<LockIcon />}
                  variant="outlined"
                  onClick={() => setOpenPasswordDialog(true)}
                >
                  Cambiar Contraseña
                </Button>
              )}
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre Completo"
                name="nombre_completo"
                value={editing ? editedProfile.nombre_completo : profile.nombre_completo}
                onChange={handleProfileChange}
                disabled={!editing}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Correo Electrónico"
                value={profile.correo}
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha de Nacimiento"
                name="fecha_nacimiento"
                type="date"
                value={editing ? editedProfile.fecha_nacimiento : profile.fecha_nacimiento}
                onChange={handleProfileChange}
                disabled={!editing}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono"
                name="telefono"
                value={editing ? editedProfile.telefono || '' : profile.telefono || ''}
                onChange={handleProfileChange}
                disabled={!editing}
                helperText="Opcional"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tipo de Documento"
                value={profile.tipo_documento}
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número de Documento"
                value={profile.numero_documento}
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Área de Trabajo"
                value={profile.area_trabajo}
                disabled
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Dialog 
        open={openPasswordDialog} 
        onClose={handleClosePasswordDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Cambiar Contraseña
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, 
            minúsculas, números y caracteres especiales.
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Contraseña Actual"
              name="contrasena_actual"
              type={showPasswords.current ? 'text' : 'password'}
              value={passwordForm.contrasena_actual}
              onChange={handlePasswordChange}
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      edge="end"
                    >
                      {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Nueva Contraseña"
              name="contrasena_nueva"
              type={showPasswords.new ? 'text' : 'password'}
              value={passwordForm.contrasena_nueva}
              onChange={handlePasswordChange}
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      edge="end"
                    >
                      {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Confirmar Nueva Contraseña"
              name="confirmar_contrasena"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={passwordForm.confirmar_contrasena}
              onChange={handlePasswordChange}
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      edge="end"
                    >
                      {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog}>
            Cancelar
          </Button>
          <Button 
            onClick={handleChangePassword}
            variant="contained" 
            color="primary"
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminProfile;