<?php

require_once __DIR__ . '/../models/Respuesta.php';
require_once __DIR__ . '/../utils/JWT.php';

class RespuestaController
{
    private $db;
    private $respuesta;

    public function __construct()
    {
        $database = new Database();
        $this->db = $database->conectar();
        $this->respuesta = new Respuesta($this->db);
    }

    /**
     * Procesa las solicitudes entrantes
     * @param string $metodo Método HTTP
     * @param string|null $parametro Parámetro adicional de la URL
     */
    public function procesarSolicitud($metodo, $parametro = null)
    {
        // Verificar autenticación para todas las rutas
        $usuario = $this->verificarAutenticacion();
        if (!$usuario) {
            http_response_code(401);
            echo json_encode(['mensaje' => 'No autorizado']);
            return;
        }

        switch ($metodo) {
            case 'GET':
                if ($parametro === 'mis-respuestas') {
                    $this->obtenerRespuestasUsuario($usuario['id']);
                } elseif ($parametro === 'estadisticas' && $this->esAdministrador($usuario)) {
                    $this->obtenerEstadisticas();
                } elseif ($parametro === 'por-pregunta' && $this->esAdministrador($usuario)) {
                    $this->obtenerRespuestasPregunta();
                } else {
                    http_response_code(404);
                    echo json_encode(['mensaje' => 'Endpoint no encontrado']);
                }
                break;
            case 'POST':
                $this->guardarRespuesta($usuario['id']);
                break;
            case 'PUT':
                if ($parametro) {
                    $this->actualizarRespuesta($parametro, $usuario['id']);
                } else {
                    http_response_code(400);
                    echo json_encode(['mensaje' => 'ID de respuesta no proporcionado']);
                }
                break;
            case 'DELETE':
                if ($parametro) {
                    $this->eliminarRespuesta($parametro, $usuario['id']);
                } else {
                    http_response_code(400);
                    echo json_encode(['mensaje' => 'ID de respuesta no proporcionado']);
                }
                break;
            default:
                http_response_code(405);
                echo json_encode(['mensaje' => 'Método no permitido']);
                break;
        }
    }

    /**
     * Verifica la autenticación del usuario
     * @return array|false Datos del usuario o false si no está autenticado
     */
    private function verificarAutenticacion()
    {
        $headers = getallheaders();
        if (!isset($headers['Authorization'])) {
            return false;
        }

        $token = str_replace('Bearer ', '', $headers['Authorization']);
        return JWT::verificarToken($token);
    }

    /**
     * Verifica si el usuario es administrador
     * @param array $usuario Datos del usuario
     * @return bool
     */
    private function esAdministrador($usuario)
    {
        return isset($usuario['rol_id']) && $usuario['rol_id'] === 1;
    }

    /**
     * Guarda una nueva respuesta
     * @param int $usuario_id ID del usuario
     */
    private function guardarRespuesta($usuario_id)
    {
        $datos = json_decode(file_get_contents("php://input"));

        if (!isset($datos->pregunta_id) || !isset($datos->respuesta)) {
            http_response_code(400);
            echo json_encode(['mensaje' => 'Faltan datos requeridos']);
            return;
        }

        // Verificar si ya respondió esta pregunta
        if ($this->respuesta->yaRespondio($usuario_id, $datos->pregunta_id)) {
            http_response_code(400);
            echo json_encode(['mensaje' => 'Ya has respondido esta pregunta']);
            return;
        }

        $this->respuesta->usuario_id = $usuario_id;
        $this->respuesta->pregunta_id = $datos->pregunta_id;
        $this->respuesta->respuesta = $datos->respuesta;

        if ($this->respuesta->guardar()) {
            http_response_code(201);
            echo json_encode(['mensaje' => 'Respuesta guardada exitosamente']);
        } else {
            http_response_code(500);
            echo json_encode(['mensaje' => 'Error al guardar la respuesta']);
        }
    }

    /**
     * Obtiene las respuestas de un usuario específico
     * @param int $usuario_id ID del usuario
     */
    private function obtenerRespuestasUsuario($usuario_id)
    {
        $respuestas = $this->respuesta->obtenerPorUsuario($usuario_id);
        echo json_encode(['respuestas' => $respuestas]);
    }

    /**
     * Obtiene las respuestas para una pregunta específica (solo admin)
     */
    private function obtenerRespuestasPregunta()
    {
        if (!isset($_GET['pregunta_id'])) {
            http_response_code(400);
            echo json_encode(['mensaje' => 'ID de pregunta no proporcionado']);
            return;
        }

        $respuestas = $this->respuesta->obtenerPorPregunta($_GET['pregunta_id']);
        echo json_encode(['respuestas' => $respuestas]);
    }

    /**
     * Obtiene estadísticas de respuestas por módulo (solo admin)
     */
    private function obtenerEstadisticas()
    {
        if (!isset($_GET['modulo_id'])) {
            http_response_code(400);
            echo json_encode(['mensaje' => 'ID de módulo no proporcionado']);
            return;
        }

        $estadisticas = $this->respuesta->obtenerEstadisticasPorModulo($_GET['modulo_id']);
        echo json_encode(['estadisticas' => $estadisticas]);
    }

    /**
     * Actualiza una respuesta existente
     * @param int $id ID de la respuesta
     * @param int $usuario_id ID del usuario
     */
    private function actualizarRespuesta($id, $usuario_id)
    {
        $datos = json_decode(file_get_contents("php://input"));

        if (!isset($datos->respuesta)) {
            http_response_code(400);
            echo json_encode(['mensaje' => 'Falta la respuesta']);
            return;
        }

        $this->respuesta->id = $id;
        $this->respuesta->usuario_id = $usuario_id;
        $this->respuesta->respuesta = $datos->respuesta;

        if ($this->respuesta->actualizar()) {
            echo json_encode(['mensaje' => 'Respuesta actualizada exitosamente']);
        } else {
            http_response_code(500);
            echo json_encode(['mensaje' => 'Error al actualizar la respuesta']);
        }
    }

    /**
     * Elimina una respuesta
     * @param int $id ID de la respuesta
     * @param int $usuario_id ID del usuario
     */
    private function eliminarRespuesta($id, $usuario_id)
    {
        $this->respuesta->id = $id;
        $this->respuesta->usuario_id = $usuario_id;

        if ($this->respuesta->eliminar()) {
            echo json_encode(['mensaje' => 'Respuesta eliminada exitosamente']);
        } else {
            http_response_code(500);
            echo json_encode(['mensaje' => 'Error al eliminar la respuesta']);
        }
    }
}

?>