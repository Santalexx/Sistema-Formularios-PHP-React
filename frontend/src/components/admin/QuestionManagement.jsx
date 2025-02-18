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
  FormatListBulleted
} from '@mui/icons-material';
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

const MODULOS = [
  { id: 1, nombre: 'Satisfacción Laboral', icon: <Category />, color: 'secondary' },
  { id: 2, nombre: 'Ambiente de trabajo', icon: <Category />, color: 'success' },
  { id: 3, nombre: 'Oportunidades de desarrollo', icon: <Category />, color: 'warning' },
  { id: 4, nombre: 'Sugerencias', icon: <Category />, color: 'info' }
];

const TIPOS_RESPUESTA = [
  { id: 1, nombre: 'Escala de satisfacción', icon: <FormatListBulleted /> },
  { id: 2, nombre: 'Respuesta abierta', icon: <QuestionAnswer /> },
  { id: 3, nombre: 'Opción múltiple', icon: <FormatListBulleted /> }
];

const QuestionForm = ({ open, onClose, onSubmit, initialData }) => {
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
      setFormData({
        modulo_id: initialData.modulo_id,
        pregunta: initialData.pregunta,
        tipo_respuesta_id: initialData.tipo_respuesta_id,
        opciones: initialData.opciones || [],
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
      setError('Debe agregar al menos 2 opciones');
      return;
    }
    
    onSubmit(formData);
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
                {MODULOS.map((modulo) => (
                  <MenuItem key={modulo.id} value={modulo.id} sx={{ py: 1.5 }}>
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

            {formData.tipo_respuesta_id === 3 && (
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
  initialData: PropTypes.object
};

const QuestionManagement = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    fetchQuestions();
  }, [user]);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('http://localhost:8000/preguntas', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) throw new Error('Error al cargar preguntas');
      
      const data = await response.json();
      setQuestions(data.preguntas);
      setError('');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      const url = editingQuestion 
        ? `http://localhost:8000/preguntas/${editingQuestion.id}`
        : 'http://localhost:8000/preguntas';
      
      const method = editingQuestion ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) throw new Error('Error al guardar');
      
      await fetchQuestions();
      setOpenForm(false);
      setEditingQuestion(null);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Confirmar eliminación?')) return;
    
    try {
      const response = await fetch(`http://localhost:8000/preguntas/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) throw new Error('Error al eliminar');
      
      await fetchQuestions();
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Box sx={{ 
      maxWidth: '1200px',
      width: '100%',
      mx: 'auto',
      px: 4,
      pb: 4
    }}>
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
        <Typography variant="h4" sx={{ 
          fontWeight: 'bold',
          color: 'primary.dark',
        }}>
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
            bgcolor: 'brown'
          }}
        >
          Nueva Pregunta
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ 
        borderRadius: 2, 
        overflow: 'hidden',
        boxShadow: 3,
        width: '100%',
        position: 'relative'
      }}>
        {loading && <LinearProgress />}
        
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ width: '25%', fontWeight: 'bold', fontSize: '1rem' }}>
                  Módulo
                </TableCell>
                <TableCell sx={{ width: '45%', fontWeight: 'bold', fontSize: '1rem' }}>
                  Pregunta
                </TableCell>
                <TableCell sx={{ width: '20%', fontWeight: 'bold', fontSize: '1rem' }}>
                  Tipo
                </TableCell>
                <TableCell align="center" sx={{ width: '10%', fontWeight: 'bold', fontSize: '1rem' }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            
            <TableBody>
              {questions.map((question) => (
                <StyledTableRow key={question.id}>
                  <TableCell sx={{ py: 2 }}>
                    <Chip
                      label={MODULOS.find(m => m.id === question.modulo_id)?.nombre}
                      color={MODULOS.find(m => m.id === question.modulo_id)?.color}
                      sx={{ 
                        borderRadius: 1,
                        fontWeight: 500,
                        px: 2
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        overflowWrap: 'break-word',
                        wordWrap: 'break-word',
                        hyphens: 'auto',
                        maxWidth: '100%'
                      }}
                    >
                      {question.pregunta}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      bgcolor: 'action.hover',
                      p: 1,
                      borderRadius: 1
                    }}>
                      {TIPOS_RESPUESTA.find(t => t.id === question.tipo_respuesta_id)?.icon}
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {TIPOS_RESPUESTA.find(t => t.id === question.tipo_respuesta_id)?.nombre}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center" sx={{ py: 2 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center',
                      gap: 1
                    }}>
                      <IconButton 
                        onClick={() => {
                          setEditingQuestion(question);
                          setOpenForm(true);
                        }}
                        sx={{ color: 'primary.main' }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDelete(question.id)}
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </StyledTableRow>
              ))}
              
              {!loading && questions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
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
      />
    </Box>
  );
}

export default QuestionManagement;