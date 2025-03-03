<?php

require_once __DIR__ . '/../models/Modulo.php';
require_once __DIR__ . '/../utils/JWT.php';

class ModuloController
{
    private $db;
    private $modulo;

    public function __construct()
    {
        $database = new Database();
        $this->db = $database->conectar();
        $this->modulo = new Modulo($this->db);
    }

    public function procesarSolicitud($metodo, $parametro = null, $accion = null)
    {
        // Verificar que sea administrador
        if ($metodo !== 'GET') {
            if (!$this->verificarPermisos()) {
                $this->responder(403, 'No tiene permisos para realizar esta acción');
                return;
            }
        }

        $acciones = [
            'GET' => function () use ($parametro) {
                if (empty($parametro)) {
                    $this->obtenerTodos();
                } else {
                    $this->obtenerPorId($parametro);
                }
            },
            'POST' => function () {
                $this->crear();
            },
            'PUT' => function () use ($parametro, $accion) {
                if (!$parametro) {
                    $this->responder(400, 'ID de módulo requerido');
                    return;
                }
                if ($accion === 'activar') {
                    $this->cambiarEstado($parametro);
                } else {
                    $this->actualizar($parametro);
                }
            },
            'DELETE' => function () use ($parametro, $accion) {
                if (!$parametro) {
                    $this->responder(400, 'ID de módulo requerido');
                    return;
                }
                if ($accion === 'eliminar') {
                    $this->eliminarPermanente($parametro);
                } else {
                    $this->desactivar($parametro);
                }
            }
        ];

        if (isset($acciones[$metodo])) {
            $acciones[$metodo]();
        } else {
            $this->responder(405, 'Método no permitido');
        }
    }

    private function verificarPermisos()
    {
        $token = $this->obtenerToken();
        if (!$token) return false;

        $datos = JWT::verificarToken($token);
        return $datos && $datos['rol_id'] === 1;
    }

    private function obtenerToken()
    {
        $headers = getallheaders();
        return isset($headers['Authorization']) ?
            str_replace('Bearer ', '', $headers['Authorization']) : false;
    }

    private function obtenerTodos()
    {
        $modulos = $this->modulo->obtenerTodos();
        $this->responder(200, ['modulos' => $modulos]);
    }

    private function obtenerPorId($id)
    {
        $this->modulo->id = $id;
        $modulo = $this->modulo->obtenerPorId();

        if ($modulo) {
            $this->responder(200, ['modulo' => $modulo]);
        } else {
            $this->responder(404, 'Módulo no encontrado');
        }
    }

    private function crear()
    {
        $datos = json_decode(file_get_contents("php://input"));

        if (!$this->validarDatosModulo($datos)) {
            return;
        }

        $this->modulo->nombre = $datos->nombre;
        $this->modulo->descripcion = $datos->descripcion ?? null;
        $this->modulo->activo = $datos->activo ?? true;

        if ($this->modulo->existeNombre()) {
            $this->responder(400, 'Ya existe un módulo con este nombre');
            return;
        }

        if ($this->modulo->crear()) {
            $this->responder(201, 'Módulo creado exitosamente');
        } else {
            $this->responder(500, 'Error al crear el módulo');
        }
    }

    private function actualizar($id)
    {
        $datos = json_decode(file_get_contents("php://input"));

        if (!$this->validarDatosModulo($datos)) {
            return;
        }

        $this->modulo->id = $id;
        $this->modulo->nombre = $datos->nombre;
        $this->modulo->descripcion = $datos->descripcion ?? null;
        $this->modulo->activo = $datos->activo ?? true;

        if ($this->modulo->existeNombreExceptoId($id)) {
            $this->responder(400, 'Ya existe otro módulo con este nombre');
            return;
        }

        if ($this->modulo->actualizar()) {
            $this->responder(200, 'Módulo actualizado exitosamente');
        } else {
            $this->responder(500, 'Error al actualizar el módulo');
        }
    }

    private function cambiarEstado($id)
    {
        $datos = json_decode(file_get_contents("php://input"));

        if (!isset($datos->activo)) {
            $this->responder(400, 'Estado requerido');
            return;
        }

        $this->modulo->id = $id;
        $this->modulo->activo = $datos->activo;

        if ($this->modulo->cambiarEstado()) {
            $mensaje = $datos->activo ? 'Módulo activado exitosamente' : 'Módulo desactivado exitosamente';
            $this->responder(200, $mensaje);
        } else {
            $this->responder(500, 'Error al cambiar estado del módulo');
        }
    }

    private function desactivar($id)
    {
        $this->modulo->id = $id;

        if ($this->modulo->tienePreguntasActivas()) {
            $this->responder(400, 'No se puede desactivar el módulo porque tiene preguntas activas');
            return;
        }

        if ($this->modulo->desactivar()) {
            $this->responder(200, 'Módulo desactivado exitosamente');
        } else {
            $this->responder(500, 'Error al desactivar el módulo');
        }
    }

    private function eliminarPermanente($id)
    {
        $this->modulo->id = $id;

        if ($this->modulo->tienePreguntasActivas()) {
            $this->responder(400, 'No se puede eliminar el módulo porque tiene preguntas activas');
            return;
        }

        if ($this->modulo->eliminarPermanente()) {
            $this->responder(200, 'Módulo eliminado permanentemente');
        } else {
            $this->responder(500, 'Error al eliminar el módulo');
        }
    }

    private function validarDatosModulo($datos)
    {
        if (!isset($datos->nombre) || empty(trim($datos->nombre))) {
            $this->responder(400, 'El nombre del módulo es requerido');
            return false;
        }

        if (strlen($datos->nombre) > 100) {
            $this->responder(400, 'El nombre del módulo no puede exceder los 100 caracteres');
            return false;
        }

        if (isset($datos->descripcion) && strlen($datos->descripcion) > 500) {
            $this->responder(400, 'La descripción no puede exceder los 500 caracteres');
            return false;
        }

        return true;
    }

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