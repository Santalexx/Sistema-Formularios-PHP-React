import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert,
  Chip,
  LinearProgress,
  CircularProgress,  // Añadimos CircularProgress para el indicador de carga
  styled
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

// Componentes estilizados
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td, &:last-child th': { border: 0 },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  padding: theme.spacing(3),
}));

// Componente de formulario para módulos
const ModuleForm = ({ open, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    activo: true
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre,
        descripcion: initialData.descripcion || '',
        activo: initialData.activo
      });
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        activo: true
      });
    }
  }, [initialData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.nombre.trim()) {
      setError('El nombre del módulo es requerido');
      return;
    }

    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <StyledDialogTitle>
        {initialData ? 'Editar Módulo' : 'Nuevo Módulo'}
      </StyledDialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <TextField
            fullWidth
            label="Nombre del módulo"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            margin="normal"
            required
            inputProps={{ maxLength: 100 }}
          />
          
          <TextField
            fullWidth
            label="Descripción"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={3}
            inputProps={{ maxLength: 500 }}
          />
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" color="primary">
            {initialData ? 'Guardar cambios' : 'Crear módulo'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

ModuleForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialData: PropTypes.shape({
    nombre: PropTypes.string,
    descripcion: PropTypes.string,
    activo: PropTypes.bool
  })
};

const ModuleManagement = () => {
  const { user } = useAuth();
  const [modules, setModules] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios({
        method: 'GET',
        url: 'http://localhost:8000/modulos',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setModules(response.data.modulos);
      setError('');
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar módulos:', error);
      setError('Error al cargar los módulos');
      setLoading(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      const url = editingModule 
        ? `http://localhost:8000/modulos/${editingModule.id}`
        : 'http://localhost:8000/modulos';
      
      const method = editingModule ? 'PUT' : 'POST';
      
      await axios({
        method,
        url,
        data: formData
      });

      await fetchModules();
      setOpenForm(false);
      setEditingModule(null);
      setError('');
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al guardar el módulo');
    }
  };

  const handleActivate = async (id) => {
    if (!window.confirm('¿Está seguro de activar este módulo?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios({
        method: 'PUT',
        url: `http://localhost:8000/modulos/${id}/activar`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: { activo: true }
      });
      await fetchModules();
      setError('');
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al activar el módulo');
    }
  };
  
  const handleDeactivate = async (id) => {
    if (!window.confirm('¿Está seguro de desactivar este módulo?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios({
        method: 'PUT',
        url: `http://localhost:8000/modulos/${id}/activar`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: { activo: false }
      });
      await fetchModules();
      setError('');
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al desactivar el módulo');
    }
  };
  
  // Función simplificada para eliminar módulos directamente
  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este módulo? Esta acción no se puede deshacer.')) {
      return;
    }
    
    setEliminandoId(id);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No se encontró token de autenticación');
        setEliminandoId(null);
        return;
      }
      
      // Eliminación directa usando método DELETE
      await axios({
        method: 'DELETE',
        url: `http://localhost:8000/modulos/${id}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Recargar módulos después de eliminar
      await fetchModules();
      
      // Mostrar mensaje de éxito
      setSuccess('Módulo eliminado exitosamente');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error al eliminar módulo:', error);
      
      if (error.response) {
        // Mostrar mensaje específico si lo hay
        setError(error.response.data?.mensaje || `Error ${error.response.status}: No se pudo eliminar el módulo`);
      } else {
        setError('Error al eliminar el módulo');
      }
    } finally {
      setEliminandoId(null);
    }
  };

  if (!user || user.rol_id !== 1) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        No tiene permisos para acceder a esta sección
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '95%', maxWidth: '1200px', mx: 'auto', px: 4, pb: 4 }}>
      <Box sx={{ 
        mb: 5,
        p: 3,
        borderRadius: 2,
        bgcolor: 'background.paper',
        boxShadow: 5,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderLeft: '5px solid',
        borderColor: 'primary.main'
      }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
          Gestión de Módulos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenForm(true)}
          sx={{ 
            borderRadius: 2,
            px: 4,
            py: 1,
            bgcolor: 'brown',
            '&:hover': {
              bgcolor: 'brown',
              opacity: 0.9
            }
          }}
        >
          Nuevo Módulo
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 3 }}>
        {loading && <LinearProgress />}
        
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                  Nombre
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                  Descripción
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                  Preguntas
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                  Estado
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            
            <TableBody>
              {modules.map((module) => (
                <StyledTableRow key={module.id}>
                  <TableCell>{module.nombre}</TableCell>
                  <TableCell>{module.descripcion || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={`${module.total_preguntas} preguntas`}
                      color={module.total_preguntas > 0 ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={module.activo ? 'Activo' : 'Inactivo'}
                      color={module.activo ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      {module.activo ? (
                        <IconButton 
                          onClick={() => handleDeactivate(module.id)}
                          color="warning"
                          title="Desactivar módulo"
                          size="small"
                        >
                          <CancelIcon />
                        </IconButton>
                      ) : (
                        <IconButton 
                          onClick={() => handleActivate(module.id)}
                          color="success"
                          title="Activar módulo"
                          size="small"
                        >
                          <CheckIcon />
                        </IconButton>
                      )}
                      <IconButton 
                        onClick={() => {
                          setEditingModule(module);
                          setOpenForm(true);
                        }}
                        color="info"
                        title="Editar módulo"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDelete(module.id)}
                        color="error"
                        title="Eliminar permanentemente"
                        size="small"
                        disabled={module.total_preguntas > 0 || eliminandoId === module.id}
                      >
                        {eliminandoId === module.id ? 
                          <CircularProgress size={20} color="error" /> : 
                          <DeleteIcon />
                        }
                      </IconButton>
                    </Box>
                  </TableCell>
                </StyledTableRow>
              ))}
              
              {!loading && modules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No se encontraron módulos registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <ModuleForm
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditingModule(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingModule}
      />
    </Box>
  );
};

export default ModuleManagement;