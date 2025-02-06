<?php

// Incluimos los archivos necesarios
require_once __DIR__ . '/../models/Pregunta.php';
require_once __DIR__ . '/../utils/JWT.php';

/**
 * Este controlador maneja todo lo relacionado con las preguntas del sistema:
 * - Ver todas las preguntas
 * - Crear preguntas nuevas
 * - Modificar preguntas existentes
 * - Eliminar preguntas
 * - Ver preguntas por módulo
 */
class PreguntaController
{
    // Guardamos las herramientas que necesitamos
    private $db;        // Para conectarnos a la base de datos
    private $pregunta;  // Para manejar las operaciones con preguntas

    // Preparamos todo lo necesario cuando se crea el controlador
    public function __construct()
    {
        $database = new Database();
        $this->db = $database->conectar();
        $this->pregunta = new Pregunta($this->db);
    }

    /**
     * Este método recibe todas las peticiones y las dirige al lugar correcto
     * según lo que el usuario quiere hacer
     */
    public function procesarSolicitud($metodo, $parametro = null)
    {
        // Solo los administradores pueden modificar preguntas
        if ($metodo !== 'GET') {
            if (!$this->verificarPermisos()) {
                $this->responder(403, 'No tienes permiso para realizar esta acción');
                return;
            }
        }

        // Definimos qué hacer según el tipo de petición
        $acciones = [
            'GET' => function () use ($parametro) {
                if (empty($parametro)) {
                    $this->obtenerTodas();
                } elseif (is_numeric($parametro)) {
                    $this->obtenerPorId($parametro);
                } elseif ($parametro === 'modulo') {
                    $this->obtenerPorModulo();
                } else {
                    $this->responder(404, 'No encontramos lo que buscas');
                }
            },
            'POST' => function () {
                $this->crear();
            },
            'PUT' => function () use ($parametro) {
                if (!$parametro) {
                    $this->responder(400, 'Necesitamos saber qué pregunta quieres modificar');
                    return;
                }
                $this->actualizar($parametro);
            },
            'DELETE' => function () use ($parametro) {
                if (!$parametro) {
                    $this->responder(400, 'Necesitamos saber qué pregunta quieres eliminar');
                    return;
                }
                $this->eliminar($parametro);
            }
        ];

        // Si el método existe, lo ejecutamos
        if (isset($acciones[$metodo])) {
            $acciones[$metodo]();
        } else {
            $this->responder(405, 'Este tipo de petición no está permitida');
        }
    }

    /**
     * Verifica si el usuario está autenticado y es administrador
     */
    private function verificarPermisos()
    {
        // Primero verificamos que haya un token válido
        $token = $this->obtenerToken();
        if (!$token) return false;

        // Luego verificamos que sea administrador
        $datos = JWT::verificarToken($token);
        return $datos && $datos['rol_id'] === 1;
    }

    /**
     * Obtiene el token de autorización de los headers
     */
    private function obtenerToken()
    {
        $headers = getallheaders();
        if (!isset($headers['Authorization'])) {
            return false;
        }
        return str_replace('Bearer ', '', $headers['Authorization']);
    }

    /**
     * Muestra todas las preguntas activas
     */
    private function obtenerTodas()
    {
        $preguntas = $this->pregunta->obtenerTodas();
        $this->responder(200, ['preguntas' => $preguntas]);
    }

    /**
     * Muestra una pregunta específica por su ID
     */
    private function obtenerPorId($id)
    {
        $this->pregunta->id = $id;
        $pregunta = $this->pregunta->obtenerPorId();

        if ($pregunta) {
            $this->responder(200, ['pregunta' => $pregunta]);
        } else {
            $this->responder(404, 'No encontramos la pregunta que buscas');
        }
    }

    /**
     * Muestra todas las preguntas de un módulo específico
     */
    private function obtenerPorModulo()
    {
        if (!isset($_GET['id'])) {
            $this->responder(400, 'Necesitamos saber qué módulo quieres consultar');
            return;
        }

        $modulo_id = $_GET['id'];
        $preguntas = $this->pregunta->obtenerPorModulo($modulo_id);
        $this->responder(200, ['preguntas' => $preguntas]);
    }

    /**
     * Crea una nueva pregunta en el sistema
     */
    private function crear()
    {
        $datos = json_decode(file_get_contents("php://input"));

        // Verificamos que los datos estén completos y sean válidos
        if (!$this->validarDatosPregunta($datos)) {
            $this->responder(400, 'Faltan datos o algunos datos no son válidos');
            return;
        }

        // Preparamos la pregunta para guardarla
        $this->pregunta->modulo_id = $datos->modulo_id;
        $this->pregunta->pregunta = $datos->pregunta;
        $this->pregunta->tipo_respuesta_id = $datos->tipo_respuesta_id;
        $this->pregunta->activa = $datos->activa ?? true;

        // Intentamos guardar la pregunta
        if ($this->pregunta->crear()) {
            $this->responder(201, 'Pregunta creada exitosamente');
        } else {
            $this->responder(500, 'Hubo un problema al crear la pregunta');
        }
    }

    /**
     * Actualiza una pregunta existente
     */
    private function actualizar($id)
    {
        $datos = json_decode(file_get_contents("php://input"));

        // Verificamos que los datos estén completos y sean válidos
        if (!$this->validarDatosPregunta($datos)) {
            $this->responder(400, 'Faltan datos o algunos datos no son válidos');
            return;
        }

        // Preparamos la pregunta para actualizarla
        $this->pregunta->id = $id;
        $this->pregunta->modulo_id = $datos->modulo_id;
        $this->pregunta->pregunta = $datos->pregunta;
        $this->pregunta->tipo_respuesta_id = $datos->tipo_respuesta_id;
        $this->pregunta->activa = $datos->activa ?? true;

        // Intentamos actualizar la pregunta
        if ($this->pregunta->actualizar()) {
            $this->responder(200, 'Pregunta actualizada exitosamente');
        } else {
            $this->responder(500, 'Hubo un problema al actualizar la pregunta');
        }
    }

    /**
     * Elimina (desactiva) una pregunta del sistema
     */
    private function eliminar($id)
    {
        $this->pregunta->id = $id;

        // Intentamos eliminar la pregunta
        if ($this->pregunta->eliminar()) {
            $this->responder(200, 'Pregunta eliminada exitosamente');
        } else {
            $this->responder(500, 'Hubo un problema al eliminar la pregunta');
        }
    }

    /**
     * Verifica que una pregunta tenga todos los datos necesarios
     */
    private function validarDatosPregunta($datos)
    {
        // Verificamos que existan todos los campos necesarios
        $campos_requeridos = [
            'modulo_id' => 'número',
            'pregunta' => 'texto',
            'tipo_respuesta_id' => 'número'
        ];

        foreach ($campos_requeridos as $campo => $tipo) {
            if (!isset($datos->$campo)) {
                return false;
            }

            // Verificamos que los campos numéricos sean números
            if ($tipo === 'número' && !is_numeric($datos->$campo)) {
                return false;
            }

            // Verificamos que los campos de texto no estén vacíos
            if ($tipo === 'texto' && empty($datos->$campo)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Envía una respuesta al cliente en formato JSON
     */
    private function responder($codigo, $mensaje)
    {
        http_response_code($codigo);
        if (is_string($mensaje)) {
            echo json_encode(['mensaje' => $mensaje]);
        } else {
            echo json_encode($mensaje);
        }
    }
}

?>