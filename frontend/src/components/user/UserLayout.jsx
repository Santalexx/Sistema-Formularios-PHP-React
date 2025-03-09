// src/components/user/UserLayout.jsx
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
  Assignment,
  History,
  Person,
  ExitToApp,
  Dashboard,
} from '@mui/icons-material';

// Ancho del panel de navegación
const drawerWidth = 250;

const UserLayout = () => {
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
      text: 'Inicio', 
      icon: <Dashboard sx={{ color: '#802629', fontSize: 30 }} />, 
      path: '/dashboard' 
    },
    { 
      text: 'Formularios', 
      icon: <Assignment sx={{ color: '#802629', fontSize: 30 }} />, 
      path: '/formularios' 
    },
    { 
      text: 'Mis Respuestas', 
      icon: <History sx={{ color: '#802629', fontSize: 30 }} />, 
      path: '/mis-respuestas' 
    },
    { 
      text: 'Mi Perfil', 
      icon: <Person sx={{ color: '#802629', fontSize: 30 }} />, 
      path: '/perfil' 
    }
  ];

  return (
    <Box sx={{ 
      bgcolor: 'white', 
      minHeight: '100vh',
      position: 'relative' 
    }}>
      <CssBaseline />

      {/* Header superior (color rojo oscuro) separado 10px de los bordes */}
      <Box 
        sx={{ 
          position: 'fixed',
          top: '10px',
          left: '10px',
          right: '10px',
          height: '75px',
          bgcolor: '#802629',
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          borderRadius: '10px'
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' }, color: 'white' }}
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
              mr: 1.5,
              display: { xs: 'none', sm: 'block' },
              fontWeight: 'normal',
              fontSize: '16px'
            }}
          >
            {user?.nombre_completo || 'USUARIO'}
          </Typography>
          <IconButton
            onClick={() => navigate('/perfil')}
            sx={{ color: 'white' }}
          >
            <Person sx={{ fontSize: 35 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Panel principal (color marrón) - Separado 10px del header */}
      <Box 
        sx={{ 
          position: 'fixed',
          top: '95px',
          left: '10px',
          right: '10px',
          bottom: '10px',
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
            width: drawerWidth,
            display: { xs: 'none', sm: 'flex' },
            flexDirection: 'column',
            height: '100%',
            bgcolor: '#deb886',
            borderRight: '1px solid rgba(0,0,0,0.1)'
          }}
        >
          {/* Iconos de navegación */}
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
              width: drawerWidth,
              height: 'calc(100% - 160px)',
              top: '160px',
              left: '10px',
              borderRadius: '10px 0 0 0'
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
              PANEL DE USUARIO
            </Typography>
          </Box>

          {/* Contenido principal beige con bordes redondeados */}
          <Box sx={{ 
            flex: 1, 
            mx: 2, 
            mb: 2, 
            bgcolor: '#fff8dc',
            borderRadius: '10px',
            overflow: 'auto' // Solo scroll aquí
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

export default UserLayout;