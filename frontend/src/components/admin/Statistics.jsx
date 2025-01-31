import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  MenuItem,
  TextField,
  Alert,
  Paper,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const MODULOS = [
    { id: 1, nombre: 'Satisfacción Laboral' },
    { id: 2, nombre: 'Ambiente de trabajo' },
    { id: 3, nombre: 'Oportunidades de desarrollo y formación' },
    { id: 4, nombre: 'Sugerencias y recomendaciones' }
];

const COLORS = ['#8B4513', '#A0522D', '#D2691E', '#CD853F', '#DEB887', '#F4A460'];

const Statistics = () => {
    const { user } = useAuth();
    const [selectedModule, setSelectedModule] = useState('');
    const [statistics, setStatistics] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const processStatistics = useCallback((data) => {
      const stats = {
        satisfactionScores: [],
        multipleChoice: [],
        participation: {
          total: 0,
          completed: 0,
          pending: 0
        },
        averageSatisfaction: 0
      };
    
      let satisfactionTotal = 0;
      let satisfactionCount = 0;
    
      data.forEach(item => {
        if (item.tipo_respuesta === 'Escala de satisfacción' && item.promedio) {
          satisfactionTotal += item.promedio;
          satisfactionCount++;
          stats.satisfactionScores.push({
            pregunta: item.pregunta,
            promedio: item.promedio
          });
        }
    
        if (item.tipo_respuesta === 'Opción múltiple') {
          const responses = {
            pregunta: item.pregunta,
            si: 0,
            no: 0,
            na: 0
          };
          // Aquí procesarías las respuestas múltiples
          stats.multipleChoice.push(responses);
        }
    
        stats.participation.total += item.total_respuestas;
      });
    
      stats.averageSatisfaction = 
        satisfactionCount > 0 ? (satisfactionTotal / satisfactionCount).toFixed(2) : 0;
    
      setStatistics(stats);
    }, []);

    const fetchStatistics = useCallback (async (moduleId) => {
        setLoading(true);
        try {
            const response = await fetch(
                `http://localhost:8000/respuestas/estadisticas?modulo_id=${moduleId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            
            if (!response.ok) throw new Error('Error al cargar las estadísticas');
            
            const data = await response.json();
            processStatistics(data.estadisticas);
            setError('');
        } catch {
            setError('Error al cargar las estadísticas');
            setStatistics(null);
        } finally {
            setLoading(false);
        }
    }, [processStatistics]);

    useEffect(() => {
      if (selectedModule) {
        fetchStatistics(selectedModule);
      }
    }, [selectedModule, fetchStatistics]);


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
      <Typography variant="h5" component="h2" gutterBottom>
        Estadísticas
      </Typography>

      <TextField
        select
        fullWidth
        label="Seleccione un módulo"
        value={selectedModule}
        onChange={(e) => setSelectedModule(e.target.value)}
        margin="normal"
        sx={{ mb: 4 }}
      >
        {MODULOS.map((modulo) => (
          <MenuItem key={modulo.id} value={modulo.id}>
            {modulo.nombre}
          </MenuItem>
        ))}
      </TextField>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Typography>Cargando estadísticas...</Typography>
      )}

      {statistics && (
        <Grid container spacing={3}>
          {/* Resumen general */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Resumen General
                </Typography>
                <Typography variant="body1">
                  Satisfacción promedio: {statistics.averageSatisfaction}/5
                </Typography>
                <Typography variant="body1">
                  Total de respuestas: {statistics.participation.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Gráfico de satisfacción */}
          {statistics.satisfactionScores.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Niveles de Satisfacción por Pregunta
                </Typography>
                <Box sx={{ width: '100%', height: 400 }}>
                  <ResponsiveContainer>
                    <BarChart data={statistics.satisfactionScores}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="pregunta" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="promedio" 
                        fill="#8B4513" 
                        name="Promedio de satisfacción"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Gráfico de respuestas múltiples */}
          {statistics.multipleChoice.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Distribución de Respuestas
                </Typography>
                <Box sx={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Sí', value: 65 },
                          { name: 'No', value: 25 },
                          { name: 'N/A', value: 10 }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8B4513"
                        dataKey="value"
                        label
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default Statistics;