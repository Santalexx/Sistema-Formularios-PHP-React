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
        try {
            $datos = json_decode(file_get_contents("php://input"));

            if (!$this->validarDatosModulo($datos)) {
                return;
            }

            $this->modulo->id = $id;
            $this->modulo->nombre = $datos->nombre;
            $this->modulo->descripcion = $datos->descripcion ?? null;
            $this->modulo->activo = $datos->activo ?? true;

            // Excepción para nombres que empiezan con "INACTIVO - " - no validar unicidad
            if (!preg_match('/^INACTIVO - /', $this->modulo->nombre)) {
                if ($this->modulo->existeNombreExceptoId($id)) {
                    $this->responder(400, 'Ya existe otro módulo con este nombre');
                    return;
                }
            }

            if ($this->modulo->actualizar()) {
                $this->responder(200, 'Módulo actualizado exitosamente');
            } else {
                $this->responder(500, 'Error al actualizar el módulo');
            }
        } catch (Exception $e) {
            error_log("Error en actualizar módulo: " . $e->getMessage());
            $this->responder(500, 'Error interno: ' . $e->getMessage());
        }
    }

    private function cambiarEstado($id)
    {
        try {
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
        } catch (Exception $e) {
            error_log("Error en cambiarEstado: " . $e->getMessage());
            $this->responder(500, 'Error interno: ' . $e->getMessage());
        }
    }

    private function desactivar($id)
    {
        try {
            $this->modulo->id = $id;

            // Verificar si el módulo tiene preguntas activas
            if ($this->modulo->tienePreguntasActivas()) {
                $this->responder(400, 'No se puede eliminar el módulo porque tiene preguntas activas');
                return;
            }

            // Simplemente eliminar el módulo directamente
            if ($this->modulo->eliminar()) {
                $this->responder(200, 'Módulo eliminado exitosamente');
            } else {
                $this->responder(500, 'Error al eliminar el módulo');
            }
        } catch (Exception $e) {
            error_log("Error al eliminar módulo: " . $e->getMessage());
            $this->responder(500, 'Error interno del servidor: ' . $e->getMessage());
        }
    }

    private function eliminarPermanente($id)
    {
        $this->modulo->id = $id;

        try {
            // Verificamos primero si el módulo existe
            $modulo = $this->modulo->obtenerPorId();
            if (!$modulo) {
                $this->responder(404, 'Módulo no encontrado');
                return;
            }

            // Después verificamos si tiene preguntas activas
            if ($this->modulo->tienePreguntasActivas()) {
                $this->responder(400, 'No se puede eliminar el módulo porque tiene preguntas activas');
                return;
            }

            // Si pasa ambas verificaciones, procedemos a eliminarlo
            if ($this->modulo->eliminarPermanente()) {
                $this->responder(200, 'Módulo eliminado permanentemente');
            } else {
                $this->responder(500, 'Error al eliminar el módulo');
            }
        } catch (Exception $e) {
            // Registramos el error para poder analizarlo
            error_log("Error en eliminarPermanente: " . $e->getMessage());
            $this->responder(500, 'Error interno del servidor: ' . $e->getMessage());
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