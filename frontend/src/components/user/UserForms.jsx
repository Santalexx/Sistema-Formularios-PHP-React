// src/components/user/UserForms.jsx
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
      setLoading(true);
      console.log("Obteniendo formularios...");
      
      const { data } = await axios.get('http://localhost:8000/preguntas');
      console.log("Datos obtenidos:", data);
      
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

// Función renderQuestion con depuración adicional
  const renderQuestion = (question) => {
    console.log("Renderizando pregunta:", question);
    console.log("Tipo de opciones:", typeof question.opciones);
    console.log("Contenido de opciones:", question.opciones);
    
    switch (question.tipo_respuesta) {
      case 'Escala de satisfacción': {
        return (
          <FormControl fullWidth margin="normal" required>
            <FormLabel>{question.pregunta}</FormLabel>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Rating
                value={Number(responses[question.id]) || 0}
                onChange={(_, newValue) => {
                  handleResponseChange(question.id, newValue?.toString());
                }}
                max={5}
              />
              <Typography variant="body2" color="text.secondary">
                {responses[question.id] ? `${responses[question.id]}/5` : 'Sin calificar'}
              </Typography>
            </Box>
          </FormControl>
        );
      }

      case 'Opción múltiple': {
        // Verificación más robusta de opciones
        let opcionesMostrar = [];
        
        if (question.opciones) {
          if (Array.isArray(question.opciones) && question.opciones.length > 0) {
            console.log("Usando opciones del array:", question.opciones);
            opcionesMostrar = question.opciones;
          } else if (typeof question.opciones === 'string') {
            try {
              // Intentamos parsear como JSON
              const opcionesParsed = JSON.parse(question.opciones);
              if (Array.isArray(opcionesParsed) && opcionesParsed.length > 0) {
                console.log("Opciones parseadas del string JSON:", opcionesParsed);
                opcionesMostrar = opcionesParsed;
              } else {
                console.log("String JSON no válido como array, usando opciones por defecto");
                opcionesMostrar = ["Si", "No", "No aplica"];
              }
            } catch (e) {
              console.log("Error al parsear opciones:", e);
              opcionesMostrar = ["Si", "No", "No aplica"];
            }
          } else {
            console.log("Formato de opciones no reconocido, usando opciones por defecto");
            opcionesMostrar = ["Si", "No", "No aplica"];
          }
        } else {
          console.log("No hay opciones definidas, usando opciones por defecto");
          opcionesMostrar = ["Si", "No", "No aplica"];
        }
        
        console.log("Opciones finales a mostrar:", opcionesMostrar);
        
        return (
          <FormControl fullWidth margin="normal" required>
            <FormLabel>{question.pregunta}</FormLabel>
            <RadioGroup
              value={responses[question.id] || ''}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}
            >
              {opcionesMostrar.map((opcion, index) => (
                <FormControlLabel 
                  key={`${question.id}-${index}`}
                  value={opcion} 
                  control={<Radio />} 
                  label={opcion} 
                />
              ))}
            </RadioGroup>
          </FormControl>
        );
      }
      
      case 'Respuesta abierta': 
        return (
          <TextField
            fullWidth
            multiline
            rows={3}
            label={question.pregunta}
            value={responses[question.id] || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            margin="normal"
            helperText="Opcional"
          />
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
    <Box>
      <Typography variant="h5" gutterBottom>
        Formularios Disponibles
      </Typography>

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

      {Object.keys(forms).length === 0 ? (
        <Alert severity="info">
          No hay formularios disponibles en este momento
        </Alert>
      ) : (
        Object.entries(forms).map(([moduleName, questions]) => (
          <Card key={moduleName} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                {moduleName}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {questions.map((question) => (
                <Box key={question.id}>
                  {renderQuestion(question)}
                </Box>
              ))}

              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
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