// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import PropTypes from 'prop-types';
import { useAuth } from './hooks/useAuth';
import { theme } from './theme/theme';

// Componentes de autenticación
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Componentes de administrador
import AdminLayout from './components/admin/AdminLayout';
import QuestionManagement from './components/admin/QuestionManagement';
import Statistics from './components/admin/Statistics';

// Componentes de usuario
import UserLayout from './components/user/UserLayout';
import UserDashboard from './components/user/UserDashboard';
import UserForms from './components/user/UserForms';
import UserResponses from './components/user/UserResponses';
import UserProfile from './components/user/UserProfile';

// Componente para rutas protegidas
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRole && user.rol_id !== allowedRole) {
    return <Navigate to="/" />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRole: PropTypes.number
};

function App() {
  const { user } = useAuth();
  console.log('App us rendering');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={
          user ? <Navigate to="/" /> : <Login />
        } />
        <Route path="/registro" element={
          user ? <Navigate to="/" /> : <Register />
        } />

        {/* Rutas de administrador */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRole={1}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Statistics />} />
          <Route path="preguntas" element={<QuestionManagement />} />
          <Route path="estadisticas" element={<Statistics />} />
        </Route>

        {/* Rutas de usuario */}
        <Route path="/" element={
          <ProtectedRoute>
            <UserLayout />
          </ProtectedRoute>
        }>
          <Route index element={<UserDashboard />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="formularios" element={<UserForms />} />
          <Route path="mis-respuestas" element={<UserResponses />} />
          <Route path="perfil" element={<UserProfile />} />
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;