import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Button,
  Alert,
  Divider,
  Rating,
  CircularProgress,
  Paper
} from '@mui/material';
import axios from 'axios';

const UserForms = () => {
  const [forms, setForms] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const { data } = await axios.get('http://localhost:8000/preguntas');
      const groupedForms = data.preguntas.reduce((acc, pregunta) => {
        if (!acc[pregunta.modulo]) {
          acc[pregunta.modulo] = [];
        }
        acc[pregunta.modulo].push(pregunta);
        return acc;
      }, {});
      setForms(groupedForms);
      setLoading(false);
      setError(''); // Limpiar errores previos si la petición es exitosa
    } catch (error) {
      console.error('Error al cargar los formularios:', error);
      setError('Error al cargar los formularios');
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const validateResponses = (moduleQuestions) => {
    const unansweredRequired = moduleQuestions.some(question => 
      !responses[question.id] && question.tipo_respuesta !== 'Respuesta abierta'
    );

    if (unansweredRequired) {
      setError('Por favor responda todas las preguntas obligatorias');
      return false;
    }
    return true;
  };

  const handleSubmit = async (moduleId) => {
    try {
      setError('');
      setSuccess('');
      
      const moduleQuestions = forms[moduleId];
      
      if (!validateResponses(moduleQuestions)) return;

      const moduleResponses = moduleQuestions.map(question => ({
        pregunta_id: question.id,
        respuesta: responses[question.id] || ''
      })).filter(response => response.respuesta !== '');

      if (moduleResponses.length === 0) {
        setError('Por favor responda al menos una pregunta');
        return;
      }

      await Promise.all(
        moduleResponses.map(response =>
          axios.post('http://localhost:8000/respuestas', response)
        )
      );

      setSuccess('Respuestas enviadas correctamente');
      setResponses({}); // Limpiar respuestas después del envío exitoso
    } catch (error) {
      console.error('Error al enviar las respuestas:', error);
      setError(error.response?.data?.mensaje || 'Error al enviar las respuestas');
    }
  };

  const renderQuestion = (question) => {
    switch (question.tipo_respuesta) {
      case 'Escala de satisfacción':
        return (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              mb: 2,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1
            }}
          >
            <FormControl fullWidth required>
              <FormLabel 
                sx={{ 
                  mb: 2,
                  fontSize: '1rem',
                  color: 'text.primary',
                  '&.Mui-focused': { color: 'text.primary' }
                }}
              >
                {question.pregunta}
              </FormLabel>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Rating
                  value={Number(responses[question.id]) || 0}
                  onChange={(_, newValue) => {
                    handleResponseChange(question.id, newValue?.toString());
                  }}
                  max={5}
                  sx={{ fontSize: '2rem' }}
                />
                <Typography variant="body2" color="text.secondary">
                  {responses[question.id] ? `${responses[question.id]}/5` : 'Sin calificar'}
                </Typography>
              </Box>
            </FormControl>
          </Paper>
        );
      
      case 'Opción múltiple':
        return (
          <FormControl fullWidth margin="normal" required>
            <FormLabel>{question.pregunta}</FormLabel>
            <RadioGroup
              value={responses[question.id] || ''}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}
            >
              {/* Si hay opciones personalizadas, usarlas */}
              {question.opciones ? (
                question.opciones.map((opcion) => (
                  <FormControlLabel 
                    key={opcion} 
                    value={opcion} 
                    control={<Radio />} 
                    label={opcion} 
                  />
                ))
              ) : (
                // Opciones por defecto si no hay personalizadas
                <>
                  <FormControlLabel value="Si" control={<Radio />} label="Sí" />
                  <FormControlLabel value="No" control={<Radio />} label="No" />
                  <FormControlLabel value="No aplica" control={<Radio />} label="No aplica" />
                </>
              )}
            </RadioGroup>
          </FormControl>
        );
      
      case 'Respuesta abierta':
        return (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              mb: 2,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1
            }}
          >
            <FormControl fullWidth>
              <FormLabel 
                sx={{ 
                  mb: 2,
                  fontSize: '1rem',
                  color: 'text.primary',
                  '&.Mui-focused': { color: 'text.primary' }
                }}
              >
                {question.pregunta}
              </FormLabel>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={responses[question.id] || ''}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                placeholder="Escribe tu respuesta aquí..."
                variant="outlined"
                helperText="Opcional"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#fff'
                  }
                }}
              />
            </FormControl>
          </Paper>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 'lg', mx: 'auto', p: 3 }}>
      <Typography 
        variant="h5" 
        gutterBottom 
        sx={{ 
          mb: 4,
          color: 'primary.main',
          fontWeight: 500
        }}
      >
        Formularios Disponibles
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {Object.keys(forms).length === 0 ? (
        <Alert severity="info">
          No hay formularios disponibles en este momento
        </Alert>
      ) : (
        Object.entries(forms).map(([moduleName, questions]) => (
          <Card 
            key={moduleName} 
            sx={{ 
              mb: 4,
              borderRadius: 2,
              boxShadow: 2
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'primary.main',
                  fontWeight: 600,
                  mb: 3
                }}
              >
                {moduleName}
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              {questions.map((question) => (
                <Box key={question.id}>
                  {renderQuestion(question)}
                </Box>
              ))}

              <Button
                variant="contained"
                color="primary"
                sx={{ 
                  mt: 3,
                  px: 4,
                  py: 1,
                  borderRadius: 2,
                  boxShadow: 2,
                  bgcolor: 'brown',
                  '&:hover': {
                    bgcolor: 'brown',
                    opacity: 0.9
                  }
                }}
                onClick={() => handleSubmit(moduleName)}
              >
                Enviar Respuestas
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
};

export default UserForms;