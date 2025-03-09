<?php

class Modulo
{
    private $conn;
    private $tabla = 'modulos';

    public $id;
    public $nombre;
    public $descripcion;
    public $activo;
    public $fecha_creacion;
    public $ultima_modificacion;
    public $modificado_por;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function obtenerTodos()
    {
        try {
            $query = "SELECT m.*, 
                        (SELECT COUNT(*) FROM preguntas p WHERE p.modulo_id = m.id AND p.activa = true) as total_preguntas,
                        u.nombre_completo as modificado_por_nombre
                        FROM " . $this->tabla . " m
                        LEFT JOIN usuarios u ON m.modificado_por = u.id
                        ORDER BY m.fecha_creacion DESC";

            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error al obtener módulos: " . $e->getMessage());
            return [];
        }
    }

    public function obtenerPorId()
    {
        try {
            $query = "SELECT m.*, 
                        (SELECT COUNT(*) FROM preguntas p WHERE p.modulo_id = m.id AND p.activa = true) as total_preguntas,
                        u.nombre_completo as modificado_por_nombre
                        FROM " . $this->tabla . " m
                        LEFT JOIN usuarios u ON m.modificado_por = u.id
                        WHERE m.id = :id
                        LIMIT 1";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $this->id);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error al obtener módulo: " . $e->getMessage());
            return false;
        }
    }

    public function crear()
    {
        try {
            $query = "INSERT INTO " . $this->tabla . "
                    (nombre, descripcion, activo)
                    VALUES
                    (:nombre, :descripcion, :activo)";

            $stmt = $this->conn->prepare($query);

            // Limpiar datos
            $this->nombre = htmlspecialchars(strip_tags($this->nombre));
            $this->descripcion = $this->descripcion ? htmlspecialchars(strip_tags($this->descripcion)) : null;

            // Vincular valores
            $stmt->bindParam(':nombre', $this->nombre);
            $stmt->bindParam(':descripcion', $this->descripcion);
            $stmt->bindParam(':activo', $this->activo);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error al crear módulo: " . $e->getMessage());
            return false;
        }
    }

    public function actualizar()
    {
        try {
            $query = "UPDATE " . $this->tabla . "
                SET nombre = :nombre,
                    descripcion = :descripcion,
                    activo = :activo,
                    ultima_modificacion = NOW()
                WHERE id = :id";

            $stmt = $this->conn->prepare($query);

            // Limpiar datos
            $this->nombre = htmlspecialchars(strip_tags($this->nombre));
            $this->descripcion = $this->descripcion ? htmlspecialchars(strip_tags($this->descripcion)) : null;

            // Vincular valores
            $stmt->bindParam(':nombre', $this->nombre);
            $stmt->bindParam(':descripcion', $this->descripcion);
            $stmt->bindParam(':activo', $this->activo);
            $stmt->bindParam(':id', $this->id);

            $result = $stmt->execute();

            // Registrar resultado para depuración
            error_log("Actualización de módulo ID {$this->id}: " . ($result ? "Exitosa" : "Fallida"));

            return $result;
        } catch (PDOException $e) {
            error_log("Error al actualizar módulo: " . $e->getMessage());
            return false;
        }
    }

    public function desactivar()
    {
        try {
            $query = "UPDATE " . $this->tabla . "
                     SET activo = false,
                         modificado_por = :modificado_por
                     WHERE id = :id";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $this->id);
            $stmt->bindParam(':modificado_por', $this->modificado_por);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error al desactivar módulo: " . $e->getMessage());
            return false;
        }
    }

    public function existeNombre()
    {
        try {
            $query = "SELECT id FROM " . $this->tabla . "
                     WHERE nombre = :nombre
                     LIMIT 1";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':nombre', $this->nombre);
            $stmt->execute();

            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Error al verificar nombre: " . $e->getMessage());
            return false;
        }
    }

    public function existeNombreExceptoId($id)
    {
        try {
            $query = "SELECT id FROM " . $this->tabla . "
                     WHERE nombre = :nombre
                     AND id != :id
                     LIMIT 1";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':nombre', $this->nombre);
            $stmt->bindParam(':id', $id);
            $stmt->execute();

            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Error al verificar nombre: " . $e->getMessage());
            return false;
        }
    }

    public function tienePreguntasActivas()
    {
        try {
            // Añadir registro para depuración
            error_log("Verificando preguntas activas para módulo ID: {$this->id}");

            $query = "SELECT COUNT(*) as total
                 FROM preguntas
                 WHERE modulo_id = :id
                 AND activa = true";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $this->id);
            $stmt->execute();

            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
            $tienePreguntas = $resultado['total'] > 0;

            // Registro detallado del resultado
            error_log("Módulo ID {$this->id} tiene {$resultado['total']} preguntas activas");

            return $tienePreguntas;
        } catch (PDOException $e) {
            error_log("Error al verificar preguntas activas: " . $e->getMessage());
            return true; // Por seguridad, asumimos que hay preguntas activas
        }
    }

    public function cambiarEstado()
    {
        try {
            $query = "UPDATE " . $this->tabla . "
                SET activo = :activo,
                    ultima_modificacion = NOW()
                WHERE id = :id";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $this->id);
            $stmt->bindParam(':activo', $this->activo, PDO::PARAM_BOOL);

            $result = $stmt->execute();

            // Registrar resultado para depuración
            error_log("Cambio de estado de módulo ID {$this->id} a " . ($this->activo ? "activo" : "inactivo") . ": " . ($result ? "Exitoso" : "Fallido"));

            return $result;
        } catch (PDOException $e) {
            error_log("Error al cambiar estado del módulo: " . $e->getMessage());
            return false;
        }
    }

    public function eliminarPermanente()
    {
        try {
            // Primero verificamos si tiene preguntas
            if ($this->tienePreguntasActivas()) {
                return false;
            }

            // Iniciamos una transacción para mayor seguridad
            $this->conn->beginTransaction();

            // Verificar existencia del módulo
            $checkQuery = "SELECT id FROM " . $this->tabla . " WHERE id = :id LIMIT 1";
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->bindParam(':id', $this->id);
            $checkStmt->execute();

            if ($checkStmt->rowCount() === 0) {
                // Si no existe, devolvemos false
                $this->conn->rollBack();
                error_log("Error: Intento de eliminar un módulo inexistente (ID: {$this->id})");
                return false;
            }

            // Realizar la eliminación
            $query = "DELETE FROM " . $this->tabla . " WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $this->id);
            $result = $stmt->execute();

            if ($result) {
                $this->conn->commit();
                return true;
            } else {
                $this->conn->rollBack();
                error_log("Error en la consulta de eliminación para módulo ID: {$this->id}");
                return false;
            }
        } catch (PDOException $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            error_log("Error en eliminarPermanente: " . $e->getMessage());
            return false;
        }
    }

    public function eliminar()
    {
        try {
            // Verificar si tiene preguntas activas
            if ($this->tienePreguntasActivas()) {
                error_log("No se puede eliminar el módulo ID {$this->id} porque tiene preguntas activas");
                return false;
            }

            // IMPORTANTE: Verificar si existen preguntas inactivas y eliminarlas primero
            $queryVerificarPreguntas = "SELECT id FROM preguntas WHERE modulo_id = :id";
            $stmtVerificar = $this->conn->prepare($queryVerificarPreguntas);
            $stmtVerificar->bindParam(':id', $this->id);
            $stmtVerificar->execute();

            // Iniciar una transacción
            $this->conn->beginTransaction();

            // Si hay preguntas inactivas, eliminarlas
            if ($stmtVerificar->rowCount() > 0) {
                error_log("Eliminando {$stmtVerificar->rowCount()} preguntas inactivas para módulo ID {$this->id}");

                // Primero eliminar respuestas asociadas a esas preguntas
                $queryEliminarRespuestas = "DELETE r FROM respuestas r 
                                        INNER JOIN preguntas p ON r.pregunta_id = p.id 
                                        WHERE p.modulo_id = :id";
                $stmtRespuestas = $this->conn->prepare($queryEliminarRespuestas);
                $stmtRespuestas->bindParam(':id', $this->id);

                if (!$stmtRespuestas->execute()) {
                    error_log("Error al eliminar respuestas asociadas al módulo ID {$this->id}");
                    $this->conn->rollBack();
                    return false;
                }

                // Luego eliminar las preguntas
                $queryEliminarPreguntas = "DELETE FROM preguntas WHERE modulo_id = :id";
                $stmtPreguntas = $this->conn->prepare($queryEliminarPreguntas);
                $stmtPreguntas->bindParam(':id', $this->id);

                if (!$stmtPreguntas->execute()) {
                    error_log("Error al eliminar preguntas asociadas al módulo ID {$this->id}");
                    $this->conn->rollBack();
                    return false;
                }
            }

            // Finalmente eliminar el módulo
            $query = "DELETE FROM " . $this->tabla . " WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $this->id);
            $result = $stmt->execute();

            if ($result) {
                $this->conn->commit();
                error_log("Módulo ID {$this->id} eliminado exitosamente");
                return true;
            } else {
                $this->conn->rollBack();
                error_log("Error en la consulta de eliminación para módulo ID: {$this->id}");
                return false;
            }
        } catch (PDOException $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            error_log("Error en eliminar(): " . $e->getMessage());
            return false;
        }
    }
}