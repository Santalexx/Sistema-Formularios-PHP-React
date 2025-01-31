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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

const MODULOS = [
  { id: 1, nombre: 'Satisfacción Laboral' },
  { id: 2, nombre: 'Ambiente de trabajo' },
  { id: 3, nombre: 'Oportunidades de desarrollo y formación' },
  { id: 4, nombre: 'Sugerencias y recomendaciones' }
];

const TIPOS_RESPUESTA = [
  { id: 1, nombre: 'Escala de satisfacción' },
  { id: 2, nombre: 'Respuesta abierta' },
  { id: 3, nombre: 'Opción múltiple' }
];

const QuestionForm = ({ open, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    modulo_id: '',
    pregunta: '',
    tipo_respuesta_id: '',
    activa: true
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        modulo_id: '',
        pregunta: '',
        tipo_respuesta_id: '',
        activa: true
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.modulo_id || !formData.pregunta || !formData.tipo_respuesta_id) {
      setError('Por favor complete todos los campos');
      return;
    }
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialData ? 'Editar Pregunta' : 'Nueva Pregunta'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            select
            fullWidth
            label="Módulo"
            name="modulo_id"
            value={formData.modulo_id}
            onChange={handleChange}
            margin="normal"
            required
          >
            {MODULOS.map((modulo) => (
              <MenuItem key={modulo.id} value={modulo.id}>
                {modulo.nombre}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Pregunta"
            name="pregunta"
            value={formData.pregunta}
            onChange={handleChange}
            margin="normal"
            required
            multiline
            rows={3}
          />

          <TextField
            select
            fullWidth
            label="Tipo de Respuesta"
            name="tipo_respuesta_id"
            value={formData.tipo_respuesta_id}
            onChange={handleChange}
            margin="normal"
            required
          >
            {TIPOS_RESPUESTA.map((tipo) => (
              <MenuItem key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" color="primary">
            {initialData ? 'Actualizar' : 'Crear'}
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
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('http://localhost:8000/preguntas', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Error al cargar las preguntas');
      const data = await response.json();
      setQuestions(data.preguntas);
      setError('');
    } catch {
      setError('Error al cargar las preguntas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async (formData) => {
    try {
      const response = await fetch('http://localhost:8000/preguntas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) throw new Error('Error al crear la pregunta');
      
      await fetchQuestions();
      setOpenForm(false);
      setError('');
    } catch {
      setError('Error al crear la pregunta');
    }
  };

  const handleUpdateQuestion = async (formData) => {
    try {
      const response = await fetch(`http://localhost:8000/preguntas/${editingQuestion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) throw new Error('Error al actualizar la pregunta');
      
      await fetchQuestions();
      setOpenForm(false);
      setEditingQuestion(null);
      setError('');
    } catch {
      setError('Error al actualizar la pregunta');
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta pregunta?')) return;

    try {
      const response = await fetch(`http://localhost:8000/preguntas/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Error al eliminar la pregunta');
      
      await fetchQuestions();
      setError('');
    } catch {
      setError('Error al eliminar la pregunta');
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setOpenForm(true);
  };

  if (!user || user.rol_id !== 1) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tiene permisos para acceder a esta sección
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          Gestión de Preguntas
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingQuestion(null);
            setOpenForm(true);
          }}
        >
          Nueva Pregunta
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Módulo</TableCell>
              <TableCell>Pregunta</TableCell>
              <TableCell>Tipo de Respuesta</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {questions.map((question) => (
              <TableRow key={question.id}>
                <TableCell>
                  {MODULOS.find(m => m.id === question.modulo_id)?.nombre}
                </TableCell>
                <TableCell>{question.pregunta}</TableCell>
                <TableCell>
                  {TIPOS_RESPUESTA.find(t => t.id === question.tipo_respuesta_id)?.nombre}
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(question)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteQuestion(question.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {questions.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No hay preguntas registradas
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <QuestionForm
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditingQuestion(null);
        }}
        onSubmit={editingQuestion ? handleUpdateQuestion : handleCreateQuestion}
        initialData={editingQuestion}
      />
    </Box>
  );
};
export default QuestionManagement;
