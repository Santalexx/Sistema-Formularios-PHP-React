<?php

class Respuesta
{
    private $conn;
    private $tabla = 'respuestas';

    // Propiedades
    public $id;
    public $usuario_id;
    public $pregunta_id;
    public $respuesta;
    public $fecha_respuesta;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    /**
     * Guardar una respuesta
     * @return bool
     */
    public function guardar()
    {
        $query = "INSERT INTO " . $this->tabla . "
                (usuario_id, pregunta_id, respuesta)
                VALUES
                (:usuario_id, :pregunta_id, :respuesta)";

        $stmt = $this->conn->prepare($query);

        // Sanitizar datos
        $this->respuesta = htmlspecialchars(strip_tags($this->respuesta));

        // Vincular parámetros
        $stmt->bindParam(':usuario_id', $this->usuario_id);
        $stmt->bindParam(':pregunta_id', $this->pregunta_id);
        $stmt->bindParam(':respuesta', $this->respuesta);

        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            return false;
        }
    }

    /**
     * Obtener respuestas por usuario
     * @param int $usuario_id
     * @return array
     */
    public function obtenerPorUsuario($usuario_id)
    {
        $query = "SELECT 
                    r.*,
                    p.pregunta,
                    m.nombre as modulo,
                    tr.nombre as tipo_respuesta
                 FROM " . $this->tabla . " r
                 JOIN preguntas p ON r.pregunta_id = p.id
                 JOIN modulos m ON p.modulo_id = m.id
                 JOIN tipos_respuesta tr ON p.tipo_respuesta_id = tr.id
                 WHERE r.usuario_id = :usuario_id
                 ORDER BY r.fecha_respuesta DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':usuario_id', $usuario_id);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Obtener respuestas por pregunta
     * @param int $pregunta_id
     * @return array
     */
    public function obtenerPorPregunta($pregunta_id)
    {
        $query = "SELECT 
                    r.*,
                    u.nombre_completo as nombre_usuario,
                    u.area_trabajo_id
                 FROM " . $this->tabla . " r
                 JOIN usuarios u ON r.usuario_id = u.id
                 WHERE r.pregunta_id = :pregunta_id
                 ORDER BY r.fecha_respuesta DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':pregunta_id', $pregunta_id);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Verificar si un usuario ya respondió una pregunta
     * @param int $usuario_id
     * @param int $pregunta_id
     * @return bool
     */
    public function yaRespondio($usuario_id, $pregunta_id)
    {
        $query = "SELECT id FROM " . $this->tabla . "
                 WHERE usuario_id = :usuario_id 
                 AND pregunta_id = :pregunta_id
                 LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':usuario_id', $usuario_id);
        $stmt->bindParam(':pregunta_id', $pregunta_id);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }

    /**
     * Obtener estadísticas de respuestas por módulo
     * @param int $modulo_id
     * @return array
     */
    public function obtenerEstadisticasPorModulo($modulo_id)
    {
        $query = "SELECT 
                    p.pregunta,
                    tr.nombre as tipo_respuesta,
                    COUNT(r.id) as total_respuestas,
                    CASE 
                        WHEN tr.nombre = 'Escala de satisfacción' 
                        THEN AVG(CAST(r.respuesta AS DECIMAL(10,2)))
                        ELSE NULL
                    END as promedio
                 FROM preguntas p
                 LEFT JOIN " . $this->tabla . " r ON p.id = r.pregunta_id
                 LEFT JOIN tipos_respuesta tr ON p.tipo_respuesta_id = tr.id
                 WHERE p.modulo_id = :modulo_id
                 GROUP BY p.id
                 ORDER BY p.id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':modulo_id', $modulo_id);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Actualizar una respuesta
     * @return bool
     */
    public function actualizar()
    {
        $query = "UPDATE " . $this->tabla . "
                 SET respuesta = :respuesta
                 WHERE id = :id AND usuario_id = :usuario_id";

        $stmt = $this->conn->prepare($query);

        // Sanitizar datos
        $this->respuesta = htmlspecialchars(strip_tags($this->respuesta));

        // Vincular parámetros
        $stmt->bindParam(':respuesta', $this->respuesta);
        $stmt->bindParam(':id', $this->id);
        $stmt->bindParam(':usuario_id', $this->usuario_id);

        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            return false;
        }
    }

    /**
     * Eliminar una respuesta
     * @return bool
     */
    public function eliminar()
    {
        $query = "DELETE FROM " . $this->tabla . "
                 WHERE id = :id AND usuario_id = :usuario_id";

        $stmt = $this->conn->prepare($query);

        // Vincular parámetros
        $stmt->bindParam(':id', $this->id);
        $stmt->bindParam(':usuario_id', $this->usuario_id);

        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            return false;
        }
    }
}

?>