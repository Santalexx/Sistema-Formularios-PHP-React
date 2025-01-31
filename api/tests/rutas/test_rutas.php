<?php
// api/tests/rutas/test_rutas.php

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../utils/JWT.php';
require_once __DIR__ . '/../../models/Usuario.php';
require_once __DIR__ . '/../../models/Pregunta.php';
require_once __DIR__ . '/../../models/Respuesta.php';

function hacerPeticion($metodo, $ruta, $datos = null, $token = null)
{
    $ch = curl_init();
    $url = "http://localhost:8000" . $ruta;

    $headers = ['Content-Type: application/json'];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }

    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    if ($metodo !== 'GET') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $metodo);
        if ($datos) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($datos));
        }
    }

    $respuesta = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        echo "Error CURL: " . $error . "\n";
        return null;
    }

    // Intentar decodificar la respuesta JSON
    $respuesta_decoded = json_decode($respuesta, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo "Error decodificando JSON: " . json_last_error_msg() . "\n";
        echo "Respuesta cruda: " . $respuesta . "\n";
    }

    return [
        'codigo' => $httpCode,
        'respuesta' => $respuesta_decoded
    ];
}

echo "Iniciando pruebas de rutas...\n\n";

// Verificar si el servidor está respondiendo
echo "Verificando conexión al servidor...\n";
$check = hacerPeticion('GET', '/');
if ($check === null) {
    echo "❌ No se puede conectar al servidor. Asegúrate de que el servidor PHP esté corriendo en localhost:8000\n";
    exit(1);
}

// Prueba de registro
echo "\nPrueba de registro:\n";
$datos_registro = [
    'nombre_completo' => 'Usuario Prueba',
    'correo' => 'test' . time() . '@example.com', // Email único
    'contrasena' => 'Test1234!',
    'fecha_nacimiento' => '1990-01-01',
    'tipo_documento_id' => 1,
    'numero_documento' => time(), // Número único
    'area_trabajo_id' => 1
];

$registro = hacerPeticion('POST', '/auth/registro', $datos_registro);
if ($registro === null) {
    echo "❌ Error en la petición de registro\n";
} else {
    echo "Código HTTP: " . $registro['codigo'] . "\n";
    echo "Respuesta: " . print_r($registro['respuesta'], true) . "\n";
    echo $registro['codigo'] === 201 ? "✅ Registro exitoso\n" : "❌ Error en registro\n";
}

// Prueba de login
echo "\nPrueba de login:\n";
$datos_login = [
    'correo' => $datos_registro['correo'],
    'contrasena' => $datos_registro['contrasena']
];

$login = hacerPeticion('POST', '/auth/login', $datos_login);
if ($login === null) {
    echo "❌ Error en la petición de login\n";
    exit(1);
}

echo "Código HTTP: " . $login['codigo'] . "\n";
echo "Respuesta: " . print_r($login['respuesta'], true) . "\n";
echo $login['codigo'] === 200 ? "✅ Login exitoso\n" : "❌ Error en login\n";

// Obtener el token si el login fue exitoso
$token = null;
if ($login['codigo'] === 200 && isset($login['respuesta']['token'])) {
    $token = $login['respuesta']['token'];
    echo "✅ Token obtenido correctamente\n";
} else {
    echo "❌ No se pudo obtener el token\n";
    echo "Terminando pruebas...\n";
    exit(1);
}

// Prueba de obtención de preguntas
echo "\nPrueba de obtención de preguntas:\n";
$preguntas = hacerPeticion('GET', '/preguntas', null, $token);
if ($preguntas === null) {
    echo "❌ Error en la petición de preguntas\n";
} else {
    echo "Código HTTP: " . $preguntas['codigo'] . "\n";
    echo "Respuesta: " . print_r($preguntas['respuesta'], true) . "\n";
    echo $preguntas['codigo'] === 200 ? "✅ Obtención de preguntas exitosa\n" : "❌ Error obteniendo preguntas\n";
}

// Prueba de guardar respuesta
echo "\nPrueba de guardar respuesta:\n";
$datos_respuesta = [
    'pregunta_id' => 1,  // Esta pregunta debería existir después de ejecutar seed_data.php
    'respuesta' => '5'   // Para pregunta tipo escala de satisfacción
];

$respuesta = hacerPeticion('POST', '/respuestas', $datos_respuesta, $token);
if ($respuesta === null) {
    echo "❌ Error en la petición de guardar respuesta\n";
} else {
    echo "Código HTTP: " . $respuesta['codigo'] . "\n";
    echo "Respuesta: " . print_r($respuesta['respuesta'], true) . "\n";
    echo $respuesta['codigo'] === 201 ? "✅ Respuesta guardada exitosamente\n" : "❌ Error guardando respuesta\n";
}

echo "\nPruebas de rutas completadas.\n";

?>