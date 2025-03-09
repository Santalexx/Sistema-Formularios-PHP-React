// src/components/admin/AdminLayout.jsx
import { useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  CssBaseline,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Divider,
  Button,
  Paper,
} from '@mui/material';
import {
  Menu as MenuIcon,
  QuestionAnswer,
  Category,
  ExitToApp,
  Dashboard as DashboardIcon,
  Person,
  Assessment,
} from '@mui/icons-material';


const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/login');
    setShowLogoutDialog(false);
  };

  const handleCloseLogoutDialog = () => {
    setShowLogoutDialog(false);
  };

  // Definición de elementos del menú
  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon sx={{ color: '#802629', fontSize: 30 }} />, 
      path: '/admin'
    },
    { 
      text: 'Gestionar Módulos', 
      icon: <Category sx={{ color: '#802629', fontSize: 30 }} />, 
      path: '/admin/modulos'
    },
    { 
      text: 'Gestionar Preguntas', 
      icon: <QuestionAnswer sx={{ color: '#802629', fontSize: 30 }} />, 
      path: '/admin/preguntas'
    },
    { 
      text: 'Ver Respuestas', 
      icon: <Assessment sx={{ color: '#802629', fontSize: 30 }} />, 
      path: '/admin/respuestas'
    }
  ];

  return (
    <Box sx={{ 
      bgcolor: 'white', 
      minHeight: '100vh',
      position: 'relative' 
    }}>
      <CssBaseline />

      {/* Header superior */}
      <Box 
        sx={{ 
          position: 'fixed',
          top: '5px',
          left: '5px',
          right: '5px',
          height: '75px',
          bgcolor: '#802629',
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          borderRadius: '10px',
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 1, display: { sm: 'none' }, color: 'white' }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Logo de muebleideas */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'left'
          }}>
            <img 
              src="/assets/images/logo-muebleideas.png" 
              alt="Logo Muebleideas"
              style={{ 
                width: '180px',
                height: 'auto' 
              }}
            />
          </Box>
        </Box>

        {/* Área de usuario */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'white', 
              mr: 2,
              display: { xs: 'none', sm: 'block' },
              fontWeight: 'normal',
              fontSize: '15px'
            }}
          >
            {user?.nombre_completo || 'ADMINISTRADOR'}
          </Typography>
          <IconButton
            onClick={() => navigate('/admin/perfil')}
            sx={{ color: 'white' }}
          >
            <Person sx={{ fontSize: 30 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Panel principal */}
      <Box 
        sx={{ 
          position: 'fixed',
          top: '85px',
          left: '5px',
          right: '5px',
          bottom: '5px',
          display: 'flex',
          borderRadius: '10px',
          overflow: 'hidden',
          zIndex: 1100,
          bgcolor: '#deb886',
        }}
      >
        {/* Contenido del panel lateral */}
        <Box
          sx={{
            width: '200px',
            display: { xs: 'none', sm: 'flex' },
            flexDirection: 'column',
            height: '100%',
            bgcolor: '#802629',
            borderRight: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '10px',
          }}
        >
          {/* Iconos de navegación */}
          <Box sx={{ p: 1, flex: 1 }}>
            {menuItems.map((item) => (
              <Box
                key={item.text}
                onClick={() => navigate(item.path)}
                sx={{ 
                  my: 1,
                  cursor: 'pointer'
                }}
              >
                <Paper
                  elevation={0}
                  sx={{ 
                    bgcolor: 'white',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: '#fff8dc',
                    },
                    mx: 0.5
                  }}
                >
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      width: '100%',
                      py: 1.5
                    }}
                  >
                    {item.icon}
                    <Typography 
                      sx={{ 
                        color: '#802629',
                        fontWeight: 'medium',
                        mt: 1,
                        fontSize: '16px'
                      }}
                    >
                      {item.text}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            ))}
          </Box>
          
          {/* Separador */}
          <Divider sx={{ mx: 2 }} />
          
          {/* Botón de cerrar sesión */}
          <Box
            onClick={handleLogout}
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              color: '#802629', 
              '&:hover': { 
                bgcolor: 'rgba(128, 38, 41, 0.1)' 
              },
              p: 2,
              cursor: 'pointer'
            }}
          >
            <ExitToApp sx={{ color: '#FFFFFF', mr: 1 }} />
            <Typography 
              sx={{ 
                fontWeight: 'medium', 
                color: '#FFFFFF',
                fontSize: '15px',
                position: 'relative',
                top: '1px',
              }}
            >
              Cerrar Sesión
            </Typography>
          </Box>
        </Box>

        {/* Drawer móvil */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: '200px',
              height: 'calc(100% - 90px)',
              top: '85px',
              left: '5px',
              borderRadius: '10px 10px 10px 10px'
            },
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            height: '100%',
            bgcolor: '#deb886'
          }}>
            {/* Botones del menú */}
            <Box sx={{ p: 1.5, flex: 1 }}>
              {menuItems.map((item) => (
                <Box
                  key={item.text}
                  onClick={() => navigate(item.path)}
                  sx={{ 
                    my: 2,
                    cursor: 'pointer'
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{ 
                      bgcolor: 'white',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: '#fff8dc',
                      },
                      mx: 0.5
                    }}
                  >
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        width: '100%',
                        py: 1.5
                      }}
                    >
                      {item.icon}
                      <Typography 
                        sx={{ 
                          color: '#802629',
                          fontWeight: 'medium',
                          mt: 1,
                          fontSize: '16px'
                        }}
                      >
                        {item.text}
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
              ))}
            </Box>
            
            <Divider sx={{ mx: 2 }} />
            
            {/* Botón de cerrar sesión */}
            <Box
              onClick={handleLogout}
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                color: '#802629', 
                '&:hover': { 
                  bgcolor: 'rgba(128, 38, 41, 0.1)' 
                },
                p: 2,
                cursor: 'pointer'
              }}
            >
              <ExitToApp sx={{ color: '#802629', mr: 1 }} />
              <Typography 
                sx={{ 
                  fontWeight: 'medium', 
                  color: '#802629' 
                }}
              >
                Cerrar Sesión
              </Typography>
            </Box>
          </Box>
        </Drawer>

        {/* Área de contenido principal */}
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Barra superior con título e iconos */}
          <Box sx={{ 
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#802629', 
                fontWeight: 'bold',
                fontSize: '20px'
              }}
            >
              PANEL DE ADMINISTRACIÓN
            </Typography>
          </Box>

          {/* Contenido principal beige con bordes redondeados */}
          <Box sx={{ 
            flex: 1, 
            mx: 2, 
            mb: 2, 
            bgcolor: '#fff8dc',
            borderRadius: '10px',
            overflow: 'auto'
          }}>
            <Box sx={{ p: 3 }}>
              <Outlet />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Diálogo de confirmación para cerrar sesión */}
      <Dialog 
        open={showLogoutDialog} 
        onClose={handleCloseLogoutDialog} 
        maxWidth="xs" 
        fullWidth
      >
        <DialogTitle>Confirmar Cierre de Sesión</DialogTitle>
        <DialogContent>
          ¿Está seguro que desea cerrar la sesión?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLogoutDialog}>
            Cancelar
          </Button>
          <Button 
            onClick={confirmLogout} 
            variant="contained" 
            sx={{ bgcolor: '#802629' }}
          >
            Cerrar Sesión
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminLayout;