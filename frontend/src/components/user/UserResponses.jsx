// src/components/user/UserResponses.jsx
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Rating,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import axios from 'axios';

const UserResponses = () => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResponses();
  }, []);

  const fetchResponses = async () => {
    try {
      const { data } = await axios.get('http://localhost:8000/respuestas/mis-respuestas');
      
      // Agrupar respuestas por módulo y fecha
      const groupedResponses = data.respuestas.reduce((acc, response) => {
        const date = new Date(response.fecha_respuesta).toLocaleDateString();
        const key = `${response.modulo}-${date}`;
        
        if (!acc[key]) {
          acc[key] = {
            modulo: response.modulo,
            fecha: date,
            respuestas: []
          };
        }
        
        acc[key].respuestas.push(response);
        return acc;
      }, {});

      setResponses(Object.values(groupedResponses));
      setLoading(false);
      setError('');
    } catch (error) {
      console.error('Error al cargar las respuestas:', error);
      setError('Error al cargar las respuestas');
      setLoading(false);
    }
  };

  const renderResponseValue = (response) => {
    switch (response.tipo_respuesta) {
      case 'Escala de satisfacción':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Rating
              value={Number(response.respuesta)}
              readOnly
              size="small"
            />
            <Typography variant="body2" color="text.secondary">
              ({response.respuesta}/5)
            </Typography>
          </Box>
        );
      
      case 'Opción múltiple':
        return (
          <Chip
            label={response.respuesta}
            color={
              response.respuesta === 'Si' ? 'success' :
              response.respuesta === 'No' ? 'error' :
              'default'
            }
            size="small"
            sx={{ minWidth: '80px' }}
          />
        );
      
      default:
        return (
          <Typography variant="body2" sx={{ 
            whiteSpace: 'pre-wrap',
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {response.respuesta}
          </Typography>
        );
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Historial de Respuestas
      </Typography>

      {responses.length === 0 ? (
        <Alert severity="info">
          Aún no has respondido ningún formulario
        </Alert>
      ) : (
        responses.map((group, index) => (
          <Accordion key={index} sx={{ mb: 2 }}>
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{
                backgroundColor: 'background.default',
                borderBottom: 1,
                borderColor: 'divider'
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                width: '100%', 
                justifyContent: 'space-between'
              }}>
                <Typography variant="subtitle1" color="primary">
                  {group.modulo}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {group.fecha}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: '40%' }}>Pregunta</TableCell>
                      <TableCell sx={{ width: '40%' }}>Respuesta</TableCell>
                      <TableCell align="right">Tipo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {group.respuestas.map((response) => (
                      <TableRow key={response.id}>
                        <TableCell>{response.pregunta}</TableCell>
                        <TableCell>{renderResponseValue(response)}</TableCell>
                        <TableCell align="right">
                          <Typography variant="caption" color="text.secondary">
                            {response.tipo_respuesta}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))
      )}
    </Box>
  );
};

export default UserResponses;