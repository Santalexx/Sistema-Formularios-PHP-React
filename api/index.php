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

            $parametro = $id;

            error_log("Parámetro de ruta: " . ($parametro ?: "ninguno"));

            if ($parametro === 'todas') {
                error_log("Procesando solicitud /respuestas/todas");

                // Verificación de autenticación
                $headers = getallheaders();
                error_log("Headers recibidos: " . json_encode($headers));

                if (!isset($headers['Authorization'])) {
                    error_log("Error: No se encontró el header Authorization");
                    http_response_code(401);
                    echo json_encode(['mensaje' => 'No autorizado']);
                    break;
                }

                $token = str_replace('Bearer ', '', $headers['Authorization']);
                error_log("Token recibido: " . $token);

                $datos = JWT::verificarToken($token);
                error_log("Resultado de verificación del token: " . ($datos ? "Válido" : "Inválido"));

                if (!$datos) {
                    error_log("Error: Token inválido o expirado");
                    http_response_code(403);
                    echo json_encode(['mensaje' => 'No tiene permisos para acceder a esta información']);
                    break;
                }

                error_log("Rol del usuario: " . $datos['rol_id']);

                if ($datos['rol_id'] !== 1) {
                    error_log("Error: El usuario no es administrador");
                    http_response_code(403);
                    echo json_encode(['mensaje' => 'No tiene permisos para acceder a esta información']);
                    break;
                }

                // Si llegamos aquí, el usuario está autenticado y es admin
                try {
                    error_log("Ejecutando controller->obtenerTodas()");
                    $controller->obtenerTodas();
                } catch (Exception $e) {
                    error_log("Error en ruta /respuestas/todas: " . $e->getMessage());
                    error_log("Stack trace: " . $e->getTraceAsString());
                    http_response_code(500);
                    echo json_encode(['mensaje' => 'Error interno del servidor']);
                }
            } else {
                $controller->procesarSolicitud($metodo, $parametro);
            }
            break;

        case 'test-auth':
            error_log("Procesando ruta de prueba: /test-auth");

            // Verificamos los headers
            $headers = getallheaders();
            error_log("Headers en test-auth: " . json_encode($headers));

            if (isset($headers['Authorization'])) {
                $token = str_replace('Bearer ', '', $headers['Authorization']);
                error_log("Token recibido en test-auth: " . $token);

                // Verificamos el token
                require_once './utils/JWT.php';
                $datos = JWT::verificarToken($token);

                if ($datos) {
                    error_log("Token válido. Datos: " . json_encode($datos));
                    http_response_code(200);
                    echo json_encode([
                        'auth' => true,
                        'mensaje' => 'Autenticación correcta',
                        'datos' => $datos
                    ]);
                } else {
                    error_log("Token inválido o expirado en test-auth");
                    http_response_code(401);
                    echo json_encode(['auth' => false, 'mensaje' => 'Token inválido o expirado']);
                }
            } else {
                error_log("No se encontró header Authorization en test-auth");
                http_response_code(401);
                echo json_encode(['auth' => false, 'mensaje' => 'No se proporcionó token']);
            }
            break;

        case 'modulos':
            require_once './controllers/ModuloController.php';
            $controller = new ModuloController();

            // Verificar si hay una acción específica
            $accion = null;
            if (isset($uri[2])) {
                if ($uri[2] === 'activar' || $uri[2] === 'eliminar') {
                    $accion = $uri[2];
                    $id = $uri[1];

                    // Log para depuración
                    error_log("Procesando acción especial: $accion para módulo ID: $id");
                } else {
                    $id = $uri[2];
                }
            } else {
                $id = $uri[1] ?? null;
            }

            // Log adicional para depuración
            error_log("ModuloController - Método: $metodo, ID: $id, Acción: " . ($accion ?: "ninguna"));

            $controller->procesarSolicitud($metodo, $id, $accion);
            break;

        case 'areas':
            // Verificación de autenticación
            $headers = getallheaders();
            if (!isset($headers['Authorization'])) {
                http_response_code(401);
                echo json_encode(['mensaje' => 'No autorizado']);
                break;
            }

            // Conectamos a la base de datos directamente
            $database = new Database();
            $db = $database->conectar();

            try {
                $query = "SELECT * FROM areas_trabajo ORDER BY nombre";
                $stmt = $db->prepare($query);
                $stmt->execute();
                $areas = $stmt->fetchAll(PDO::FETCH_ASSOC);

                http_response_code(200);
                echo json_encode(['areas' => $areas]);
            } catch (Exception $e) {
                error_log("Error al obtener áreas: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(['mensaje' => 'Error al obtener áreas de trabajo']);
            }
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