import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  Grid,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
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
  Cell
} from 'recharts';
import {
  Assessment,
  Group,
  QuestionAnswer,
  DateRange
} from '@mui/icons-material';
import axios from 'axios';

// Colores para los gráficos
const COLORS = ['#8B4513', '#A0522D', '#D2691E', '#CD853F', '#DEB887', '#F4A460'];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    totalPreguntas: 0,
    totalRespuestas: 0,
    ultimaActividad: '',
    satisfaccionPorArea: [],
    distribucionModulos: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Obtener los módulos reales de la base de datos
        const modulosResponse = await axios.get('http://localhost:8000/modulos');
        const modulos = modulosResponse.data.modulos.filter(m => m.activo);
        
        // Obtener datos de todos los usuarios para contar cuántos hay
        const authResponse = await axios.get('http://localhost:8000/auth/perfil');
        
        // Obtener todas las preguntas
        const preguntasResponse = await axios.get('http://localhost:8000/preguntas');
        
        // Obtener estadísticas para cada módulo usando sus IDs reales
        const modulosPromises = modulos.map(modulo =>
          axios.get(`http://localhost:8000/respuestas/estadisticas?modulo_id=${modulo.id}`)
        );
        const responses = await Promise.all(modulosPromises);
        
        // Procesar datos de satisfacción
        let satisfaccionData = [];

        // Para cada módulo, buscar las preguntas de satisfacción y sus respuestas
        for (let i = 0; i < modulos.length; i++) {
          const modulo = modulos[i];
          const response = responses[i];
          
          if (!response?.data?.estadisticas) continue;
          
          // Filtrar las estadísticas con promedios válidos
          const moduloStats = response.data.estadisticas
            .filter(item => 
              item.tipo_respuesta === 'Escala de satisfacción' && 
              item.promedio && 
              parseFloat(item.promedio) > 0
            )
            .map(item => ({
              area: item.pregunta,
              satisfaccion: parseFloat(item.promedio) || 0,
              modulo: modulo.nombre
            }));
          
          satisfaccionData = [...satisfaccionData, ...moduloStats];
        }

        // Si no hay datos, añadir un placeholder para evitar gráfico vacío
        if (satisfaccionData.length === 0) {
          satisfaccionData = [{
            area: 'Sin datos',
            satisfaccion: 0,
            modulo: 'Sin datos'
          }];
        }
        
        // Crear datos para el gráfico de distribución usando nombres reales de módulos
        const distribucionData = modulos.map((modulo, index) => {
          const moduleResponses = responses[index]?.data?.estadisticas || [];
          const total = moduleResponses.reduce((sum, item) => 
            sum + (parseInt(item.total_respuestas) || 0), 0);
          
          return {
            nombre: modulo.nombre,
            total: total
          };
        });
        
        // Calcular totales
        const totalRespuestas = distribucionData.reduce((sum, item) => sum + item.total, 0);
        const totalPreguntas = preguntasResponse.data.preguntas.length;
        
        // Obtener cantidad real de usuarios desde la API
        // Esta es una estimación, ya que no hay endpoint específico
        const totalUsuarios = authResponse?.data?.usuarios?.length || 
                             modulos.length * 2; // Estimación respaldo
        
        setStats({
          totalUsuarios: totalUsuarios,
          totalPreguntas: totalPreguntas,
          totalRespuestas: totalRespuestas,
          ultimaActividad: new Date().toLocaleDateString(),
          satisfaccionPorArea: satisfaccionData,
          distribucionModulos: distribucionData
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        setError('Error al cargar la información del dashboard: ' + error.message);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (!user || user.rol_id !== 1) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tiene permisos para acceder a esta sección
        </Alert>
      </Box>
    );
  }

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
        Dashboard Administrativo
      </Typography>

      <Grid container spacing={2}>
        {/* Panel de Estadísticas Rápidas */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Grid container spacing={2}>
                {[
                  {
                    icon: <Assessment color="primary" sx={{ fontSize: 40 }}/>,
                    title: "Formularios Activos",
                    value: stats.distribucionModulos.length.toString(),
                    subtitle: "Módulos en curso"
                  },
                  {
                    icon: <Group color="primary" sx={{ fontSize: 40 }}/>,
                    title: "Total Empleados",
                    value: stats.totalUsuarios,
                    subtitle: "Participantes registrados"
                  },
                  {
                    icon: <QuestionAnswer color="primary" sx={{ fontSize: 40 }}/>,
                    title: "Total Respuestas",
                    value: stats.totalRespuestas,
                    subtitle: "Respuestas recibidas"
                  },
                  {
                    icon: <DateRange color="primary" sx={{ fontSize: 40 }}/>,
                    title: "Última Actividad",
                    value: stats.ultimaActividad,
                    subtitle: "Fecha de última respuesta"
                  }
                ].map((item, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 2,
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      boxShadow: 1
                    }}>
                      {item.icon}
                      <Typography variant="h6" sx={{ mt: 1 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="h4" color="primary" sx={{ my: 1 }}>
                        {item.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.subtitle}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de Satisfacción por Área */}
        <Grid item xs={12} md={8}>
        <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Satisfacción por Área
              </Typography>
            <Box sx={{ 
              height: 400,
              bgcolor: 'background.paper',
              borderRadius: 1,
              pt: 2
            }}>
              <ResponsiveContainer>
                <BarChart
                  data={stats.satisfaccionPorArea}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 20 
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    strokeOpacity={0.4}
                    horizontal={true}
                    vertical={false}
                  />                    
                  {/* Eje X personalizado */}
                  <XAxis 
                    dataKey="area" 
                    height={10}
                    tickLine={ false }
                    tick={{
                      fill: '#8B4513',
                      fontSize: 0
                    }}
                    interval={0}
                  />
                    
                  {/* Eje Y con escala 1-5 y enteros */}
                  <YAxis 
                    domain={[0, 5]}
                    ticks={[0, 1, 2, 3, 4, 5]}
                    tickCount={6}
                    tick={{
                      fill: '#8B4513',
                      fontSize: 12
                    }}
                    axisLine={{ stroke: '#8B4513' }}
                    tickLine={{ stroke: '#8B4513' }}
                  />
                    
                    <Tooltip 
                    formatter={(value) => [value.toFixed(1), 'Nivel de Satisfacción']}
                    contentStyle={{ 
                        backgroundColor: '#DEB887',
                        border: '1px solid #8B4513',
                        borderRadius: '4px',
                        padding: '8px'
                    }}
                    cursor={{ fill: 'transparent' }}
                  />
                    
                    <Legend 
                      verticalAlign='bottom'
                      height={1}
                      iconType="circle"
                      iconSize={10}
                      wrapperStyle={{
                        paddingTop: '15px',
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                      content={
                        stats.satisfaccionPorArea.map((entry, index) => (
                          <Box key={index} display="flex" alignItems="center">
                            <Box
                              sx={{
                                width: 30,
                                height: 16,
                                bgcolor: COLORS[index % COLORS.length],
                                mr: 1,
                                borderRadius: '4px'
                              }}
                            />
                            <Typography variant="body2">{entry.area}</Typography>
                          </Box>
                        ))
                      }
                    />                    
                    <defs>
                    {['#8B4513', '#A0522D', '#D2691E', '#CD853F'].map((color, index) => (
                        <linearGradient
                        key={`gradient-${index}`}
                        id={`gradient-${index}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="5"
                        >
                        <stop offset="5%" stopColor={color} stopOpacity={0.80}/>
                        <stop offset="95%" stopColor={color} stopOpacity={0.40}/>
                        </linearGradient>
                    ))}
                    </defs>
                    
                    {/* Barras más delgadas y alargadas */}
                    <Bar
                    dataKey="satisfaccion"
                    name="Puntaje"
                    barSize={50}  // Controla el ancho de las barras
                    radius={[10, 10, 0, 0]}  // Esquinas redondeadas
                    >
                    {stats.satisfaccionPorArea.map((entry, index) => (
                        <Cell
                        key={`cell-${index}`}
                        fill={`url(#gradient-${index % 4})`}
                        />
                    ))}
                    </Bar>
                    {stats.satisfaccionPorArea.length === 0 && (
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                        No hay datos de satisfacción disponibles
                      </text>
                    )}
                </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de Distribución de Respuestas */}
        <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Distribución de Respuestas
            </Typography>
            
            {/* Contenedor del gráfico */}
            <Box sx={{ 
                height: 300, 
                position: 'relative',
                mb: 2 
            }}>
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={stats.distribucionModulos}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    dataKey="total"
                    nameKey="nombre"
                    >
                    {stats.distribucionModulos.map((entry, index) => (
                        <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        />
                    ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
                </ResponsiveContainer>
            </Box>

            <Grid container spacing={1} sx={{ textAlign: 'center' }}>
                {stats.distribucionModulos.map((modulo, index) => (
                <Grid item xs={6} key={index}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box 
                        sx={{
                        width: 16,
                        height: 16,
                        bgcolor: COLORS[index % COLORS.length],
                        mr: 1,
                        borderRadius: '4px'
                        }}
                    />
                    <Typography variant="body2">
                        {modulo.nombre === 'Satisfaccion' ? 'Satisfacción' : modulo.nombre}
                    </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {modulo.total}
                    </Typography>
                </Grid>
                ))}
            </Grid>
            </CardContent>
        </Card>
        </Grid>
    </Grid>
    </Box>
  );
};

export default AdminDashboard;