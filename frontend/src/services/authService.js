// src/services/authService.js
import axios from 'axios';

const API_URL = 'http://localhost:8000'; // Ajusta a tu URL de backend

const AuthService = {
  login: async (credentials) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        return { success: true, data: response.data };
      }
      return { success: false, error: 'No se recibió un token de autenticación' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.mensaje || 'Error al iniciar sesión'
      };
    }
  },

  register: async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/registro`, userData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.mensaje || 'Error al registrar usuario'
      };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  recoverPassword: async (email) => {
    try {
      const response = await axios.post(`${API_URL}/auth/recuperar-password`, { correo: email });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.mensaje || 'Error al enviar solicitud de recuperación'
      };
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await axios.post(`${API_URL}/auth/resetear-password`, { 
        token, 
        contrasena_nueva: newPassword 
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.mensaje || 'Error al restablecer contraseña'
      };
    }
  },

  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  }
};

export default AuthService;