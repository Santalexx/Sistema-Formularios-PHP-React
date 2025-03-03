<?php

// Incluimos los archivos necesarios
require_once __DIR__ . '/../models/Respuesta.php';
require_once __DIR__ . '/../utils/JWT.php';

/**
 * Este controlador maneja todo lo relacionado con las respuestas de los usuarios:
 * - Ver las respuestas propias
 * - Responder preguntas
 * - Modificar respuestas dadas
 * - Eliminar respuestas
 * - Ver estadísticas (solo administradores)
 */
class RespuestaController
{
    // Guardamos las herramientas necesarias
    private $db;        // Para conectarnos a la base de datos
    private $respuesta; // Para manejar las operaciones con respuestas

    // Preparamos todo lo necesario cuando se crea el controlador
    public function __construct()
    {
        $database = new Database();
        $this->db = $database->conectar();
        $this->respuesta = new Respuesta($this->db);
    }

    /**
     * Este método recibe todas las peticiones y las dirige al lugar correcto
     * según lo que el usuario quiere hacer
     */
    public function procesarSolicitud($metodo, $parametro = null)
    {
        // Primero verificamos que el usuario esté autenticado
        $usuario = $this->verificarAutenticacion();
        if (!$usuario) {
            $this->responder(401, 'Por favor, inicia sesión para continuar');
            return;
        }

        // Definimos las acciones permitidas según el tipo de petición
        $acciones = [
            'GET' => function () use ($parametro, $usuario) {
                switch ($parametro) {
                    case 'mis-respuestas':
                        $this->obtenerRespuestasUsuario($usuario['id']);
                        break;
                    case 'estadisticas':
                        if ($this->esAdministrador($usuario)) {
                            $this->obtenerEstadisticas();
                        } else {
                            $this->responder(403, 'No tienes permiso para ver estadísticas');
                        }
                        break;
                    case 'por-pregunta':
                        if ($this->esAdministrador($usuario)) {
                            $this->obtenerRespuestasPregunta();
                        } else {
                            $this->responder(403, 'No tienes permiso para ver estas respuestas');
                        }
                        break;
                    default:
                        $this->responder(404, 'No encontramos lo que buscas');
                }
            },
            'POST' => function () use ($usuario) {
                $this->guardarRespuesta($usuario['id']);
            },
            'PUT' => function () use ($parametro, $usuario) {
                if (!$parametro) {
                    $this->responder(400, 'Necesitamos saber qué respuesta quieres modificar');
                    return;
                }
                $this->actualizarRespuesta($parametro, $usuario['id']);
            },
            'DELETE' => function () use ($parametro, $usuario) {
                if (!$parametro) {
                    $this->responder(400, 'Necesitamos saber qué respuesta quieres eliminar');
                    return;
                }
                $this->eliminarRespuesta($parametro, $usuario['id']);
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
     * Verifica que el usuario esté autenticado correctamente
     */
    private function verificarAutenticacion()
    {
        $headers = getallheaders();

        // Verificamos que se haya enviado el token
        if (!isset($headers['Authorization'])) {
            return false;
        }

        // Extraemos y verificamos el token
        $token = str_replace('Bearer ', '', $headers['Authorization']);
        return JWT::verificarToken($token);
    }

    /**
     * Verifica si un usuario es administrador
     */
    private function esAdministrador($usuario)
    {
        return isset($usuario['rol_id']) && $usuario['rol_id'] === 1;
    }

    /**
     * Guarda una nueva respuesta del usuario
     */
    private function guardarRespuesta($usuario_id)
    {
        $datos = json_decode(file_get_contents("php://input"));

        // Verificamos que tengamos todos los datos necesarios
        if (!isset($datos->pregunta_id) || !isset($datos->respuesta)) {
            $this->responder(400, 'Por favor, asegúrate de proporcionar una respuesta');
            return;
        }

        // Verificamos que no haya respondido antes esta pregunta
        if ($this->respuesta->yaRespondio($usuario_id, $datos->pregunta_id)) {
            $this->responder(400, 'Ya has respondido esta pregunta anteriormente');
            return;
        }

        // Preparamos la respuesta para guardarla
        $this->respuesta->usuario_id = $usuario_id;
        $this->respuesta->pregunta_id = $datos->pregunta_id;
        $this->respuesta->respuesta = $datos->respuesta;

        // Intentamos guardar la respuesta
        if ($this->respuesta->guardar()) {
            $this->responder(201, '¡Respuesta guardada exitosamente!');
        } else {
            $this->responder(500, 'Hubo un problema al guardar tu respuesta');
        }
    }

    /**
     * Muestra todas las respuestas de un usuario
     */
    private function obtenerRespuestasUsuario($usuario_id)
    {
        $respuestas = $this->respuesta->obtenerPorUsuario($usuario_id);
        $this->responder(200, ['respuestas' => $respuestas]);
    }

    /**
     * Muestra todas las respuestas de una pregunta específica
     * (Solo para administradores)
     */
    private function obtenerRespuestasPregunta()
    {
        if (!isset($_GET['pregunta_id'])) {
            $this->responder(400, 'Necesitamos saber qué pregunta quieres consultar');
            return;
        }

        $respuestas = $this->respuesta->obtenerPorPregunta($_GET['pregunta_id']);
        $this->responder(200, ['respuestas' => $respuestas]);
    }

    /**
     * Obtiene estadísticas de las respuestas por módulo
     * (Solo para administradores)
     */
    private function obtenerEstadisticas()
    {
        if (!isset($_GET['modulo_id'])) {
            $this->responder(400, 'Necesitamos saber qué módulo quieres consultar');
            return;
        }

        $estadisticas = $this->respuesta->obtenerEstadisticasPorModulo($_GET['modulo_id']);
        $this->responder(200, ['estadisticas' => $estadisticas]);
    }

    /**
     * Modifica una respuesta existente
     */
    private function actualizarRespuesta($id, $usuario_id)
    {
        $datos = json_decode(file_get_contents("php://input"));

        // Verificamos que nos hayan enviado la nueva respuesta
        if (!isset($datos->respuesta)) {
            $this->responder(400, 'Por favor, proporciona la nueva respuesta');
            return;
        }

        // Preparamos los datos para actualizar
        $this->respuesta->id = $id;
        $this->respuesta->usuario_id = $usuario_id;
        $this->respuesta->respuesta = $datos->respuesta;

        // Intentamos actualizar la respuesta
        if ($this->respuesta->actualizar()) {
            $this->responder(200, 'Respuesta actualizada exitosamente');
        } else {
            $this->responder(500, 'Hubo un problema al actualizar tu respuesta');
        }
    }

    /**
     * Elimina una respuesta del sistema
     */
    private function eliminarRespuesta($id, $usuario_id)
    {
        $this->respuesta->id = $id;
        $this->respuesta->usuario_id = $usuario_id;

        // Intentamos eliminar la respuesta
        if ($this->respuesta->eliminar()) {
            $this->responder(200, 'Respuesta eliminada exitosamente');
        } else {
            $this->responder(500, 'Hubo un problema al eliminar tu respuesta');
        }
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