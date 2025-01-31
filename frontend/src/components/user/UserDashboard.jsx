// src/components/user/UserDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import PropTypes from 'prop-types';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Assessment,
  History,
  Person,
  Assignment,
} from '@mui/icons-material';
import axios from 'axios';

const DashboardCard = ({ title, value, icon, subtitle, action, onClick }) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardContent sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon}
        <Typography variant="h6" sx={{ ml: 1 }}>
          {title}
        </Typography>
      </Box>
      {value && (
        <Typography variant="h4" color="primary" gutterBottom>
          {value}
        </Typography>
      )}
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
    {action && (
      <CardActions>
        <Button size="small" onClick={onClick}>
          {action} 
        </Button>
      </CardActions>
    )}
  </Card>
);

// Definición de PropTypes para DashboardCard
DashboardCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),
  icon: PropTypes.node.isRequired,
  subtitle: PropTypes.string,
  action: PropTypes.string,
  onClick: PropTypes.func
};

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingForms, setPendingForms] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [responsesData, formsData] = await Promise.all([
          axios.get('http://localhost:8000/respuestas/mis-respuestas'),
          axios.get('http://localhost:8000/preguntas')
        ]);

        // Calcular estadísticas
        const totalResponses = responsesData.data.respuestas.length;
        const totalForms = new Set(formsData.data.preguntas.map(q => q.modulo_id)).size;
        const answeredForms = new Set(responsesData.data.respuestas.map(r => r.modulo_id)).size;
        
        setPendingForms(totalForms - answeredForms);
        setStats({
          totalResponses,
          answeredForms,
          lastResponse: responsesData.data.respuestas[0]?.fecha_respuesta
        });

        setLoading(false);
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        setError('Error al cargar la información del dashboard');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
        Bienvenido, {user?.nombre_completo}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Tarjeta de Formularios Pendientes */}
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Formularios Pendientes"
            value={pendingForms}
            icon={<Assignment color="primary" fontSize="large" />}
            subtitle="Formularios por responder"
            action="Responder ahora"
            onClick={() => navigate('/formularios')}
          />
        </Grid>

        {/* Tarjeta de Respuestas Totales */}
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Respuestas Totales"
            value={stats?.totalResponses || 0}
            icon={<Assessment color="primary" fontSize="large" />}
            subtitle="Total de preguntas respondidas"
            action="Ver historial"
            onClick={() => navigate('/mis-respuestas')}
          />
        </Grid>

        {/* Tarjeta de Módulos Completados */}
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Módulos Completados"
            value={stats?.answeredForms || 0}
            icon={<History color="primary" fontSize="large" />}
            subtitle="Formularios completados"
          />
        </Grid>

        {/* Tarjeta de Perfil */}
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Mi Perfil"
            icon={<Person color="primary" fontSize="large" />}
            subtitle="Actualiza tu información personal"
            action="Editar perfil"
            onClick={() => navigate('/perfil')}
          />
        </Grid>
      </Grid>

      {/* Sección de Actividad Reciente */}
      <Paper sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Actividad Reciente
        </Typography>
        {stats?.lastResponse ? (
          <Typography variant="body2">
            Última respuesta: {new Date(stats.lastResponse).toLocaleDateString()}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No hay actividad reciente:
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default UserDashboard;