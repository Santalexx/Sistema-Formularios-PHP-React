import { useState, useEffect, useCallback } from 'react';
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
  MenuItem,
  Typography,
  Alert,
  LinearProgress,
  Chip,
  styled,
  Grid
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Category,
  QuestionAnswer,
  FormatListBulleted,
  StarHalf as StarIcon
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
  borderTopLeftRadius: theme.shape.borderRadius,
  borderTopRightRadius: theme.shape.borderRadius,
}));

const TIPOS_RESPUESTA = [
  { id: 1, nombre: 'Escala de satisfacción', icon: <StarIcon /> },
  { id: 2, nombre: 'Respuesta abierta', icon: <QuestionAnswer /> },
  { id: 3, nombre: 'Opción múltiple', icon: <FormatListBulleted /> }
];

const QuestionForm = ({ open, onClose, onSubmit, initialData, modulos }) => {
  const [formData, setFormData] = useState({
    modulo_id: '',
    pregunta: '',
    tipo_respuesta_id: '',
    opciones: [],
    activa: true
  });
  const [error, setError] = useState('');
  const [nuevaOpcion, setNuevaOpcion] = useState('');

  useEffect(() => {
    if (initialData) {
      // Asegurarse de que opciones sea siempre un array
      let opciones = [];
      if (initialData.opciones) {
        if (Array.isArray(initialData.opciones)) {
          opciones = [...initialData.opciones];
        } else if (typeof initialData.opciones === 'string') {
          try {
            // Intentar parsear como JSON si es un string
            const parsedOpciones = JSON.parse(initialData.opciones);
            opciones = Array.isArray(parsedOpciones) ? parsedOpciones : [initialData.opciones];
          } catch {
            opciones = [initialData.opciones];
          }
        }
      }
      
      setFormData({
        modulo_id: initialData.modulo_id,
        pregunta: initialData.pregunta,
        tipo_respuesta_id: initialData.tipo_respuesta_id,
        opciones: opciones,
        activa: initialData.activa
      });
    } else {
      setFormData({
        modulo_id: '',
        pregunta: '',
        tipo_respuesta_id: '',
        opciones: [],
        activa: true
      });
    }
  }, [initialData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddOpcion = () => {
    if (nuevaOpcion.trim()) {
      setFormData(prev => ({
        ...prev,
        opciones: [...prev.opciones, nuevaOpcion.trim()]
      }));
      setNuevaOpcion('');
    }
  };

  const handleRemoveOpcion = (index) => {
    setFormData(prev => ({
      ...prev,
      opciones: prev.opciones.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.modulo_id || !formData.pregunta || !formData.tipo_respuesta_id) {
      setError('Complete todos los campos requeridos');
      return;
    }
    
    if (formData.tipo_respuesta_id === 3 && formData.opciones.length < 2) {
      setError('Debe agregar al menos 2 opciones para preguntas de opción múltiple');
      return;
    }
    
    // Crear una copia del formData para enviar
    const dataToSubmit = { ...formData };
    
    // Asegurarse de que opciones sea un array válido si es tipo opción múltiple
    if (formData.tipo_respuesta_id === 3) {
      if (!Array.isArray(dataToSubmit.opciones) || dataToSubmit.opciones.length === 0) {
        dataToSubmit.opciones = ["Si", "No", "No aplica"];
      }
    } else {
      // Para otros tipos, enviamos null o un array vacío
      dataToSubmit.opciones = [];
    }
    
    console.log("Enviando datos de pregunta:", dataToSubmit);
    onSubmit(dataToSubmit);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <StyledDialogTitle>
        <Typography variant="h6">
          {initialData ? 'Editar Pregunta' : 'Nueva Pregunta'}
        </Typography>
      </StyledDialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Módulo"
                name="modulo_id"
                value={formData.modulo_id}
                onChange={handleChange}
                margin="normal"
                required
                variant="outlined"
                InputProps={{
                  startAdornment: <Category sx={{ mr: 1, color: 'action.active' }} />
                }}
              >
                {modulos.map((modulo) => (
                  <MenuItem key={modulo.id} value={modulo.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {modulo.icon}
                      {modulo.nombre}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Tipo de respuesta"
                name="tipo_respuesta_id"
                value={formData.tipo_respuesta_id}
                onChange={handleChange}
                margin="normal"
                required
                InputProps={{
                  startAdornment: <QuestionAnswer sx={{ mr: 1, color: 'action.active' }} />
                }}
              >
                {TIPOS_RESPUESTA.map((tipo) => (
                  <MenuItem key={tipo.id} value={tipo.id} sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {tipo.icon}
                      {tipo.nombre}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Texto de la pregunta"
                name="pregunta"
                value={formData.pregunta}
                onChange={handleChange}
                margin="normal"
                required
                multiline
                rows={3}
                variant="outlined"
                inputProps={{ maxLength: 255 }}
              />
            </Grid>

            {/* Mostrar opciones solo si el tipo de respuesta es Opción múltiple */}
            {Number(formData.tipo_respuesta_id) === 3 && (
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Opciones de respuesta:
                  </Typography>
                  {formData.opciones.map((opcion, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <TextField
                        fullWidth
                        value={opcion}
                        variant="outlined"
                        size="small"
                        onChange={(e) => {
                          const newOpciones = [...formData.opciones];
                          newOpciones[index] = e.target.value;
                          setFormData(prev => ({ ...prev, opciones: newOpciones }));
                        }}
                      />
                      <IconButton onClick={() => handleRemoveOpcion(index)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <TextField
                      fullWidth
                      value={nuevaOpcion}
                      onChange={(e) => setNuevaOpcion(e.target.value)}
                      label="Nueva opción"
                      variant="outlined"
                      size="small"
                    />
                    <Button
                      variant="outlined"
                      onClick={handleAddOpcion}
                      disabled={!nuevaOpcion.trim()}
                    >
                      Agregar
                    </Button>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 1 }}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            sx={{ borderRadius: 1, px: 3 }}
          >
            {initialData ? 'Guardar cambios' : 'Crear pregunta'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

QuestionForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  modulos: PropTypes.array.isRequired
};

const QuestionManagement = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Mover las funciones dentro del componente
  const generarColorAleatorio = (id) => {
    const colores = ['secondary', 'success', 'warning', 'info', 'primary', 'error'];
    return colores[id % colores.length];
  };
  
  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/preguntas', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.data?.preguntas) {
        throw new Error('Formato de respuesta inválido');
      }
      
      // Procesamiento adicional para asegurar que las opciones sean arrays
      const processedQuestions = response.data.preguntas.map(question => {
        // Asegurarse de que las opciones sean arrays
        if (question.opciones !== null && question.opciones !== undefined) {
          if (!Array.isArray(question.opciones)) {
            try {
              // Intentar parsear si es un string
              const opciones = typeof question.opciones === 'string' 
                ? JSON.parse(question.opciones) 
                : question.opciones;
                
              question.opciones = Array.isArray(opciones) ? opciones : [opciones];
            } catch (e) {
              console.error('Error parseando opciones:', e);
              question.opciones = [question.opciones.toString()];
            }
          }
        } else {
          question.opciones = [];
        }
        
        return question;
      });
      
      console.log("Preguntas procesadas:", processedQuestions);
      setQuestions(processedQuestions);
      setError('');
    } catch (error) {
      console.error('Error detallado:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchModulos = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/modulos', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.data?.modulos) {
        throw new Error('Error al cargar módulos: formato inválido');
      }
      
      const modulosConColor = response.data.modulos.map(modulo => ({
        ...modulo,
        icon: <Category />,
        color: modulo.color || generarColorAleatorio(modulo.id)
      }));
      setModulos(modulosConColor);
    } catch (error) {
      console.error('Error al cargar módulos:', error);
      setError(error.message || 'Error al cargar módulos');
    }
  }, []);

  // Separar el efecto de carga inicial
  useEffect(() => {
    const inicializarDatos = async () => {
      setLoading(true);
      try {
        await fetchModulos();
        await fetchQuestions();
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('Error al cargar los datos: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    inicializarDatos();
  }, [fetchModulos, fetchQuestions]);

  const handleFormSubmit = async (formData) => {
    try {
      const url = editingQuestion 
        ? `http://localhost:8000/preguntas/${editingQuestion.id}`
        : 'http://localhost:8000/preguntas';
      
      const method = editingQuestion ? 'PUT' : 'POST';
      
      // Asegurar que los datos a enviar son correctos
      const dataToSend = {
        ...formData,
        // Asegurarnos de que opciones es un array correcto
        opciones: formData.tipo_respuesta_id === 3 && Array.isArray(formData.opciones) 
          ? formData.opciones 
          : []
      };
      
      console.log("Enviando datos al servidor:", dataToSend);

      const response = await axios({
        method,
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        data: dataToSend,
      });
      
      if (response.status !== 200 && response.status !== 201) {
        throw new Error('Error al guardar la pregunta');
      }
      
      setOpenForm(false);
      setEditingQuestion(null);
      setError('');
      
      // Recargar las preguntas para asegurar que vemos los cambios
      await fetchQuestions();
      
    } catch (error) {
      console.error('Error al guardar pregunta:', error);
      setError(error.response?.data?.mensaje || error.message || 'Error al guardar la pregunta');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Confirmar eliminación?')) return;
    
    try {
      const response = await axios.delete(`http://localhost:8000/preguntas/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.status !== 200) {
        throw new Error('Error al eliminar la pregunta');
      }
      
      // Recargar las preguntas después de eliminar
      await fetchQuestions();
      setError('');
      
    } catch (error) {
      console.error('Error al eliminar pregunta:', error);
      setError(error.response?.data?.mensaje || error.message || 'Error al eliminar la pregunta');
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
        boxShadow: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderLeft: '5px solid',
        borderColor: 'primary.main'
      }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
          Gestión de Preguntas
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
          Nueva Pregunta
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 3 }}>
        {loading && <LinearProgress />}
        
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ 
                  fontWeight: 'bold',
                  fontSize: '1rem',
                }}>Módulo</TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold',
                  fontSize: '1rem',
                }}>Pregunta</TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold',
                  fontSize: '1rem',
                }}>Tipo</TableCell>
                <TableCell sx={{ 
                  fontWeight: 'bold',
                  fontSize: '1rem',
                }}>Opciones</TableCell>
                <TableCell align="center" sx={{ 
                  fontWeight: 'bold',
                  fontSize: '1rem',
                }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            
            <TableBody>
              {questions.map((question) => (
                <StyledTableRow key={question.id}>
                  <TableCell>
                    <Chip
                      label={modulos.find(m => m.id === Number(question.modulo_id))?.nombre || question.modulo}
                      color={modulos.find(m => m.id === Number(question.modulo_id))?.color || 'default'}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1, pb: 1, px: 2 }}>
                    <Typography variant="body1" sx={{ 
                      fontWeight: 500,
                      lineHeight: 1.5,
                      fontSize: '1rem'
                    }}>
                      {question.pregunta}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      bgcolor: 'action.selected',
                      px: 2,
                      py: 1,
                      borderRadius: 5
                    }}>
                      {TIPOS_RESPUESTA.find(t => t.id === Number(question.tipo_respuesta_id))?.icon || <QuestionAnswer />}
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {question.tipo_respuesta}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {Number(question.tipo_respuesta_id) === 3 && Array.isArray(question.opciones) && question.opciones.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {question.opciones.map((opcion, idx) => (
                          <Chip 
                            key={idx} 
                            label={opcion} 
                            size="small" 
                            color="info"
                            sx={{ margin: '2px' }} 
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {Number(question.tipo_respuesta_id) === 1 ? 'Escala 1-5' : '-'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <IconButton 
                        onClick={() => {
                          setEditingQuestion(question);
                          setOpenForm(true);
                        }}
                        sx={{ 
                          color: 'primary.main',
                          '&:hover': { 
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText',
                            size: 'small'
                          },
                          mr: 1
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDelete(question.id)}
                        sx={{
                          color: 'error.main',
                          '&:hover': { 
                            bgcolor: 'error.light',
                            color: 'error.contrastText',
                            size: 'small',
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </StyledTableRow>
              ))}
              
              {!loading && questions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No se encontraron preguntas registradas
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <QuestionForm
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditingQuestion(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingQuestion}
        modulos={modulos}
      />
    </Box>
  );
}

export default QuestionManagement;