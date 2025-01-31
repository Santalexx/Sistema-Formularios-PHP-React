<?php

require_once __DIR__ . '/../models/Pregunta.php';
require_once __DIR__ . '/../utils/JWT.php';

class PreguntaController
{
    private $db;
    private $pregunta;

    public function __construct()
    {
        $database = new Database();
        $this->db = $database->conectar();
        $this->pregunta = new Pregunta($this->db);
    }

    /**
     * Procesa las solicitudes entrantes
     * @param string $metodo Método HTTP
     * @param string|null $parametro Parámetro adicional de la URL
     */
    public function procesarSolicitud($metodo, $parametro = null)
    {
        // Verificar token para todas las rutas excepto GET
        if ($metodo !== 'GET') {
            if (!$this->verificarToken() || !$this->esAdministrador()) {
                http_response_code(403);
                echo json_encode(['mensaje' => 'No autorizado']);
                return;
            }
        }

        switch ($metodo) {
            case 'GET':
                if ($parametro) {
                    if (is_numeric($parametro)) {
                        $this->obtenerPorId($parametro);
                    } else if ($parametro === 'modulo') {
                        $this->obtenerPorModulo();
                    }
                } else {
                    $this->obtenerTodas();
                }
                break;
            case 'POST':
                $this->crear();
                break;
            case 'PUT':
                if (!$parametro) {
                    http_response_code(400);
                    echo json_encode(['mensaje' => 'ID de pregunta no proporcionado']);
                    return;
                }
                $this->actualizar($parametro);
                break;
            case 'DELETE':
                if (!$parametro) {
                    http_response_code(400);
                    echo json_encode(['mensaje' => 'ID de pregunta no proporcionado']);
                    return;
                }
                $this->eliminar($parametro);
                break;
            default:
                http_response_code(405);
                echo json_encode(['mensaje' => 'Método no permitido']);
                break;
        }
    }

    /**
     * Verifica el token JWT
     * @return bool
     */
    private function verificarToken()
    {
        $headers = getallheaders();
        if (!isset($headers['Authorization'])) {
            return false;
        }

        $token = str_replace('Bearer ', '', $headers['Authorization']);
        return JWT::verificarToken($token) !== false;
    }

    /**
     * Verifica si el usuario es administrador
     * @return bool
     */
    private function esAdministrador()
    {
        $headers = getallheaders();
        $token = str_replace('Bearer ', '', $headers['Authorization']);
        $datos = JWT::verificarToken($token);

        return $datos && $datos['rol_id'] === 1;
    }

    /**
     * Obtiene todas las preguntas activas
     */
    private function obtenerTodas()
    {
        $preguntas = $this->pregunta->obtenerTodas();
        echo json_encode(['preguntas' => $preguntas]);
    }

    /**
     * Obtiene una pregunta por su ID
     * @param int $id ID de la pregunta
     */
    private function obtenerPorId($id)
    {
        $this->pregunta->id = $id;
        $pregunta = $this->pregunta->obtenerPorId();

        if ($pregunta) {
            echo json_encode(['pregunta' => $pregunta]);
        } else {
            http_response_code(404);
            echo json_encode(['mensaje' => 'Pregunta no encontrada']);
        }
    }

    /**
     * Obtiene preguntas por módulo
     */
    private function obtenerPorModulo()
    {
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['mensaje' => 'ID de módulo no proporcionado']);
            return;
        }

        $modulo_id = $_GET['id'];
        $preguntas = $this->pregunta->obtenerPorModulo($modulo_id);
        echo json_encode(['preguntas' => $preguntas]);
    }

    /**
     * Crea una nueva pregunta
     */
    private function crear()
    {
        $datos = json_decode(file_get_contents("php://input"));

        if (!$this->validarDatosPregunta($datos)) {
            http_response_code(400);
            echo json_encode(['mensaje' => 'Faltan datos requeridos o son inválidos']);
            return;
        }

        $this->pregunta->modulo_id = $datos->modulo_id;
        $this->pregunta->pregunta = $datos->pregunta;
        $this->pregunta->tipo_respuesta_id = $datos->tipo_respuesta_id;
        $this->pregunta->activa = $datos->activa ?? true;

        if ($this->pregunta->crear()) {
            http_response_code(201);
            echo json_encode(['mensaje' => 'Pregunta creada exitosamente']);
        } else {
            http_response_code(500);
            echo json_encode(['mensaje' => 'Error al crear la pregunta']);
        }
    }

    /**
     * Actualiza una pregunta existente
     * @param int $id ID de la pregunta
     */
    private function actualizar($id)
    {
        $datos = json_decode(file_get_contents("php://input"));

        if (!$this->validarDatosPregunta($datos)) {
            http_response_code(400);
            echo json_encode(['mensaje' => 'Faltan datos requeridos o son inválidos']);
            return;
        }

        $this->pregunta->id = $id;
        $this->pregunta->modulo_id = $datos->modulo_id;
        $this->pregunta->pregunta = $datos->pregunta;
        $this->pregunta->tipo_respuesta_id = $datos->tipo_respuesta_id;
        $this->pregunta->activa = $datos->activa ?? true;

        if ($this->pregunta->actualizar()) {
            echo json_encode(['mensaje' => 'Pregunta actualizada exitosamente']);
        } else {
            http_response_code(500);
            echo json_encode(['mensaje' => 'Error al actualizar la pregunta']);
        }
    }

    /**
     * Elimina (desactiva) una pregunta
     * @param int $id ID de la pregunta
     */
    private function eliminar($id)
    {
        $this->pregunta->id = $id;

        if ($this->pregunta->eliminar()) {
            echo json_encode(['mensaje' => 'Pregunta eliminada exitosamente']);
        } else {
            http_response_code(500);
            echo json_encode(['mensaje' => 'Error al eliminar la pregunta']);
        }
    }

    /**
     * Valida los datos requeridos de una pregunta
     * @param object $datos Datos a validar
     * @return bool
     */
    private function validarDatosPregunta($datos)
    {
        return isset($datos->modulo_id) &&
            isset($datos->pregunta) &&
            isset($datos->tipo_respuesta_id) &&
            !empty($datos->pregunta) &&
            is_numeric($datos->modulo_id) &&
            is_numeric($datos->tipo_respuesta_id);
    }
}

?>