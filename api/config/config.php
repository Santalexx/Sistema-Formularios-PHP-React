<?php
// Configuración de la base de datos
define('DB_HOST', '127.0.0.1');
define('DB_PORT', '3306');
define('DB_NAME', 'gestion_humana_db');
define('DB_USER', 'root');       
define('DB_PASS', '');          

// Configuración JWT
define('JWT_SECRET', 'muebleideas2024_secretKey'); // Esta contraseña debe cambiarse en produccion
define('JWT_EXPIRE', 3600); // Esto es una hora en segundos

// Configuración del entorno (development, production)
define('ENVIRONMENT', 'development'); // Cambiar a 'production' en entorno de producción

// Configuración de CORS para desarrollo
header('Access-Control-Allow-Origin: http://localhost:5173'); // Este es el puerto por defecto de Vite
header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization'); // Esto especifica qué headers están permitidos cuando se hace una solicitud a tu API
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS'); // Esto especifica qué métodos HTTP están permitidos
header('Access-Control-Allow-Credentials: true'); // Esto permite el envío de credenciales (como cookies, headers de autenticación, etc.) con las solicitudes
header('Content-Type: application/json; charset=UTF-8'); // Esto establece que las respuestas de tu API serán en formato JSON y usarán codificación UTF-8

// Manejo de errores en desarrollo
error_reporting(E_ALL); // Esto configura PHP para que muestre todos los errores posibles
ini_set('display_errors', 1); // Esto asegura que los errores se muestren en pantalla. Es útil para el desarrollo, pero en producción se debe desactivar para no mostrar errores a los usuarios

// Zona horaria
date_default_timezone_set('America/Bogota');