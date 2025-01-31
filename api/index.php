<?php

// Habilitar el reporte de errores
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Configurar el manejador de errores
set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    error_log("Error [$errno] $errstr en $errfile:$errline");
    http_response_code(500);
    echo json_encode([
        'error' => 'Error interno del servidor',
        'mensaje' => $errstr,
        'archivo' => basename($errfile),
        'linea' => $errline
    ]);
    exit(1);
});

// Configurar el manejador de excepciones
set_exception_handler(function ($e) {
    error_log("Excepción no capturada: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Error interno del servidor',
        'mensaje' => $e->getMessage(),
        'archivo' => basename($e->getFile()),
        'linea' => $e->getLine()
    ]);
    exit(1);
});

try {
    require_once './config/config.php';
    require_once './config/Database.php';
    require_once './utils/JWT.php';

    // Configurar headers CORS
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Content-Type: application/json; charset=UTF-8');

    // Manejar pre-flight CORS
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }

    // Obtener la URI y el método
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $uri = explode('/', trim($uri, '/'));

    // Log para debugging
    error_log("URI solicitada: " . $_SERVER['REQUEST_URI']);
    error_log("Método: " . $_SERVER['REQUEST_METHOD']);

    // Remover 'api' si está en la URL
    if (isset($uri[0]) && $uri[0] === 'api') {
        array_shift($uri);
    }

    $recurso = $uri[0] ?? '';
    $id = $uri[1] ?? null;
    $metodo = $_SERVER['REQUEST_METHOD'];

    // Log de la ruta procesada
    error_log("Procesando recurso: $recurso, ID: $id, Método: $metodo");

    switch ($recurso) {
        case '':
            echo json_encode(['mensaje' => 'API funcionando correctamente']);
            break;

        case 'auth':
            require_once './controllers/AuthController.php';
            $controller = new AuthController();
            $controller->procesarSolicitud($metodo, $id);
            break;

        case 'preguntas':
            require_once './controllers/PreguntaController.php';
            $controller = new PreguntaController();
            $controller->procesarSolicitud($metodo, $id);
            break;

        case 'respuestas':
            require_once './controllers/RespuestaController.php';
            $controller = new RespuestaController();
            $controller->procesarSolicitud($metodo, $id);
            break;

        default:
            http_response_code(404);
            echo json_encode(['error' => 'Recurso no encontrado']);
            break;
    }
} catch (Throwable $e) {
    error_log("Error crítico: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'error' => 'Error interno del servidor',
        'mensaje' => $e->getMessage(),
        'archivo' => basename($e->getFile()),
        'linea' => $e->getLine()
    ]);
}

?>