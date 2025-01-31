// src/contexts/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

// Crear el contexto
const AuthContext = createContext(null);
export { AuthContext };

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Configurar el token en los headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        // Obtener datos del usuario
        const response = await axios.get('http://localhost:8000/auth/perfil');
        setUser(response.data.usuario);
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      }
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    try {
      const response = await axios.post('http://localhost:8000/auth/login', credentials);
      const { token, usuario } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(usuario);
      return { success: true };
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        error: error.response?.data?.mensaje || 'Error al iniciar sesión'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const register = async (userData) => {
    try {
      await axios.post('http://localhost:8000/auth/registro', userData);
      return { success: true };
    } catch (error) {
      console.error('Error en registro:', error);
      return {
        success: false,
        error: error.response?.data?.mensaje || 'Error al registrar usuario'
      };
    }
  };

  if (loading) {
    return null; // o un componente de carga
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default AuthContext;