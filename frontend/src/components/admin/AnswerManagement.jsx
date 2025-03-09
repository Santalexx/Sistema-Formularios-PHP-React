import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Rating,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  WorkOutline as WorkIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import axios from 'axios';

const AnswerManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [responses, setResponses] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [areas, setAreas] = useState([]);  
  // Estados para filtros
  const [selectedModulo, setSelectedModulo] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
        try {
          setLoading(true);
          
          // Cargar módulos
          const modulosRes = await axios.get('http://localhost:8000/modulos');
          setModulos(modulosRes.data.modulos);
          
          // Cargar áreas de trabajo
          try {
            const areasRes = await axios.get('http://localhost:8000/areas');
            setAreas(areasRes.data.areas || []);
          } catch (error) {
            console.error("Error al cargar áreas:", error);
            setAreas([]);
          }
          
          // Cargar todas las respuestas 
          try {
            const responsesRes = await axios.get('http://localhost:8000/respuestas/todas');
            const processedResponses = processResponses(responsesRes.data.respuestas || []);
            setResponses(processedResponses);
          } catch (error) {
            console.error("Error al cargar respuestas:", error);
            setError('Error al cargar las respuestas: ' + error.message);
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Error al cargar datos:', error);
          setError('Error al cargar la información: ' + error.message);
          setLoading(false);
        }
      };
    
    fetchData();
  }, []);

  // Función para procesar y agrupar respuestas
  const processResponses = (rawResponses) => {
    // Agrupar por usuario y fecha
    const grouped = {};
    
    rawResponses.forEach(response => {
      const key = `${response.usuario_id}-${response.fecha_respuesta.split(' ')[0]}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          usuario_id: response.usuario_id,
          nombre_usuario: response.nombre_usuario || 'Usuario',
          area_trabajo_id: response.area_trabajo_id,
          area_trabajo: response.area_trabajo || 'Sin área',
          fecha: response.fecha_respuesta.split(' ')[0],
          respuestas: []
        };
      }
      
      grouped[key].respuestas.push(response);
    });
    
    return Object.values(grouped);
  };

  // Filtrar respuestas según selecciones
  const filteredResponses = responses.filter(group => {
    return (
      (!selectedModulo || group.respuestas.some(r => r.modulo_id === selectedModulo)) &&
      (!selectedArea || group.area_trabajo_id === selectedArea) &&
      (!searchText || 
        group.nombre_usuario.toLowerCase().includes(searchText.toLowerCase()) ||
        group.respuestas.some(r => 
          r.pregunta.toLowerCase().includes(searchText.toLowerCase()) ||
          r.respuesta.toLowerCase().includes(searchText.toLowerCase())
        )
      )
    );
  });

  // Paginación
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Renderizado condicional basado en tipo de respuesta
  const renderResponseValue = (response) => {
    switch (response.tipo_respuesta) {
      case 'Escala de satisfacción':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Rating 
              value={parseFloat(response.respuesta)} 
              readOnly 
              size="small" 
            />
            <Typography variant="body2" sx={{ ml: 1 }}>
              ({response.respuesta}/5)
            </Typography>
          </Box>
        );
      
      case 'Opción múltiple':
        return (
          <Chip 
            label={response.respuesta} 
            size="small" 
            color={
              response.respuesta === 'Si' ? 'success' :
              response.respuesta === 'No' ? 'error' :
              'default'
            }
          />
        );
      
      default:
        return (
          <Typography variant="body2">
            {response.respuesta}
          </Typography>
        );
    }
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
        Gestión de Respuestas
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Filtrar por Módulo</InputLabel>
                <Select
                  value={selectedModulo}
                  label="Filtrar por Módulo"
                  onChange={(e) => setSelectedModulo(e.target.value)}
                >
                  <MenuItem value="">Todos los módulos</MenuItem>
                  {modulos.map((modulo) => (
                    <MenuItem key={modulo.id} value={modulo.id}>
                      {modulo.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Filtrar por Área</InputLabel>
                <Select
                  value={selectedArea}
                  label="Filtrar por Área"
                  onChange={(e) => setSelectedArea(e.target.value)}
                >
                  <MenuItem value="">Todas las áreas</MenuItem>
                  {areas.map((area) => (
                    <MenuItem key={area.id} value={area.id}>
                      {area.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por nombre, pregunta o respuesta..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <IconButton size="small" edge="start">
                      <SearchIcon />
                    </IconButton>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lista de Respuestas */}
      {filteredResponses.length === 0 ? (
        <Alert severity="info">
          No se encontraron respuestas con los filtros seleccionados
        </Alert>
      ) : (
        <>
          {filteredResponses
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((group, index) => (
              <Accordion key={index} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="subtitle1">
                          {group.nombre_usuario}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <WorkIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2">
                          {group.area_trabajo}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2">
                          {new Date(group.fecha).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6} md={2}>
                      <Chip 
                        label={`${group.respuestas.length} respuestas`}
                        size="small"
                        color="primary"
                      />
                    </Grid>
                  </Grid>
                </AccordionSummary>
                
                <AccordionDetails>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell width="40%">Pregunta</TableCell>
                          <TableCell width="40%">Respuesta</TableCell>
                          <TableCell width="20%">Módulo</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {group.respuestas.map((response) => (
                          <TableRow key={response.id}>
                            <TableCell>{response.pregunta}</TableCell>
                            <TableCell>{renderResponseValue(response)}</TableCell>
                            <TableCell>
                              {modulos.find(m => m.id === response.modulo_id)?.nombre || 'Desconocido'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))}

          <TablePagination
            component="div"
            count={filteredResponses.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} de ${count}`
            }
          />
        </>
      )}
    </Box>
  );
};

export default AnswerManagement;