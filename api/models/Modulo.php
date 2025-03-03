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
                         modificado_por = :modificado_por
                     WHERE id = :id";

            $stmt = $this->conn->prepare($query);

            // Limpiar datos
            $this->nombre = htmlspecialchars(strip_tags($this->nombre));
            $this->descripcion = $this->descripcion ? htmlspecialchars(strip_tags($this->descripcion)) : null;

            // Vincular valores
            $stmt->bindParam(':nombre', $this->nombre);
            $stmt->bindParam(':descripcion', $this->descripcion);
            $stmt->bindParam(':activo', $this->activo);
            $stmt->bindParam(':modificado_por', $this->modificado_por);
            $stmt->bindParam(':id', $this->id);

            return $stmt->execute();
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
            $query = "SELECT COUNT(*) as total
                     FROM preguntas
                     WHERE modulo_id = :id
                     AND activa = true";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $this->id);
            $stmt->execute();

            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
            return $resultado['total'] > 0;
        } catch (PDOException $e) {
            error_log("Error al verificar preguntas activas: " . $e->getMessage());
            return true; // Por seguridad, asumimos que hay preguntas activas
        }
    }

    public function cambiarEstado()
    {
        try {
            $query = "UPDATE " . $this->tabla . "
                     SET activo = :activo
                     WHERE id = :id";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $this->id);
            $stmt->bindParam(':activo', $this->activo, PDO::PARAM_BOOL);

            return $stmt->execute();
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

            $query = "DELETE FROM " . $this->tabla . " WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $this->id);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error al eliminar módulo: " . $e->getMessage());
            return false;
        }
    }
}