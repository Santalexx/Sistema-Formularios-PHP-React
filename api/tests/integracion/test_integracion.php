<?php
// api/tests/integracion/test_integracion.php

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../utils/JWT.php';
require_once __DIR__ . '/../../utils/Validator.php';
require_once __DIR__ . '/../../models/Usuario.php';
require_once __DIR__ . '/../../models/Pregunta.php';
require_once __DIR__ . '/../../models/Respuesta.php';

echo "Iniciando pruebas de integración...\n\n";

// Prueba de conexión a la base de datos
try {
    $database = new Database();
    $db = $database->conectar();
    echo "✅ Conexión a la base de datos exitosa\n";
} catch (Exception $e) {
    echo "❌ Error en la conexión a la base de datos: " . $e->getMessage() . "\n";
    exit;
}

// Prueba del validador
$validator = new Validator();
echo "\nPruebas del Validator:\n";

// Prueba de validación de correo
$correo_valido = "test@example.com";
$correo_invalido = "testinvalido";
echo $validator->validarCorreo($correo_valido) ? "✅ Validación de correo correcto\n" : "❌ Error en validación de correo correcto\n";
echo !$validator->validarCorreo($correo_invalido) ? "✅ Validación de correo incorrecto\n" : "❌ Error en validación de correo incorrecto\n";

// Prueba de validación de contraseña
$contrasena_valida = "Test1234!";
$contrasena_invalida = "123";
echo $validator->validarContrasena($contrasena_valida) ? "✅ Validación de contraseña correcta\n" : "❌ Error en validación de contraseña correcta\n";
echo !$validator->validarContrasena($contrasena_invalida) ? "✅ Validación de contraseña incorrecta\n" : "❌ Error en validación de contraseña incorrecta\n";

// Prueba de JWT
echo "\nPruebas de JWT:\n";
$payload = ['id' => 1, 'correo' => 'test@example.com', 'rol_id' => 1];
$token = JWT::crearToken($payload);
$verificacion = JWT::verificarToken($token);

echo $token ? "✅ Creación de token exitosa\n" : "❌ Error en creación de token\n";
echo $verificacion ? "✅ Verificación de token exitosa\n" : "❌ Error en verificación de token\n";

// Prueba de modelo Usuario
echo "\nPruebas del modelo Usuario:\n";
$usuario = new Usuario($db);
$usuario->correo = "test@example.com";
echo $usuario->existeCorreo() !== null ? "✅ Verificación de existencia de correo funciona\n" : "❌ Error en verificación de correo\n";

// Prueba de modelo Pregunta
echo "\nPruebas del modelo Pregunta:\n";
$pregunta = new Pregunta($db);
$preguntas = $pregunta->obtenerTodas();
echo is_array($preguntas) ? "✅ Obtención de preguntas funciona\n" : "❌ Error en obtención de preguntas\n";

// Prueba de modelo Respuesta
echo "\nPruebas del modelo Respuesta:\n";
$respuesta = new Respuesta($db);
try {
    $estadisticas = $respuesta->obtenerEstadisticasPorModulo(1);
    echo is_array($estadisticas) ? "✅ Obtención de estadísticas funciona\n" : "❌ Error en obtención de estadísticas\n";
} catch (Exception $e) {
    echo "❌ Error en obtención de estadísticas: " . $e->getMessage() . "\n";
}

// Resumen de las pruebas
echo "\nPruebas completadas.\n";

?>