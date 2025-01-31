<?php

class Pregunta
{
    private $conn;
    private $tabla = 'preguntas';

    // Propiedades
    public $id;
    public $modulo_id;
    public $pregunta;
    public $tipo_respuesta_id;
    public $activa;
    public $fecha_creacion;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    /**
     * Crear una nueva pregunta
     * @return bool
     */
    public function crear()
    {
        $query = "INSERT INTO " . $this->tabla . "
                (modulo_id, pregunta, tipo_respuesta_id, activa)
                VALUES
                (:modulo_id, :pregunta, :tipo_respuesta_id, :activa)";

        $stmt = $this->conn->prepare($query);

        // Sanitizar datos
        $this->pregunta = htmlspecialchars(strip_tags($this->pregunta));
        $this->activa = $this->activa ?? true;

        // Vincular parámetros
        $stmt->bindParam(':modulo_id', $this->modulo_id);
        $stmt->bindParam(':pregunta', $this->pregunta);
        $stmt->bindParam(':tipo_respuesta_id', $this->tipo_respuesta_id);
        $stmt->bindParam(':activa', $this->activa, PDO::PARAM_BOOL);

        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            return false;
        }
    }

    /**
     * Obtener todas las preguntas activas con información relacionada
     * @return array
     */
    public function obtenerTodas()
    {
        $query = "SELECT 
                    p.*,
                    m.nombre as modulo,
                    tr.nombre as tipo_respuesta
                 FROM " . $this->tabla . " p
                 LEFT JOIN modulos m ON p.modulo_id = m.id
                 LEFT JOIN tipos_respuesta tr ON p.tipo_respuesta_id = tr.id
                 WHERE p.activa = true
                 ORDER BY m.id, p.id";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Obtiene una pregunta específica por su ID
     * @param int $id
     * @return array|false
     */
    public function obtenerPorId()
    {
        $query = "SELECT 
                    p.*,
                    m.nombre as modulo,
                    tr.nombre as tipo_respuesta
                 FROM " . $this->tabla . " p
                 LEFT JOIN modulos m ON p.modulo_id = m.id
                 LEFT JOIN tipos_respuesta tr ON p.tipo_respuesta_id = tr.id
                 WHERE p.id = :id AND p.activa = true
                 LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);

        try {
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return false;
        }
    }

    /**
     * Obtener preguntas por módulo
     * @param int $modulo_id
     * @return array
     */
    public function obtenerPorModulo($modulo_id)
    {
        $query = "SELECT 
                    p.*,
                    tr.nombre as tipo_respuesta
                 FROM " . $this->tabla . " p
                 LEFT JOIN tipos_respuesta tr ON p.tipo_respuesta_id = tr.id
                 WHERE p.modulo_id = :modulo_id AND p.activa = true
                 ORDER BY p.id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':modulo_id', $modulo_id);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Actualizar una pregunta
     * @return bool
     */
    public function actualizar()
    {
        $query = "UPDATE " . $this->tabla . "
                 SET modulo_id = :modulo_id,
                     pregunta = :pregunta,
                     tipo_respuesta_id = :tipo_respuesta_id,
                     activa = :activa
                 WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        // Sanitizar datos
        $this->pregunta = htmlspecialchars(strip_tags($this->pregunta));

        // Vincular parámetros
        $stmt->bindParam(':modulo_id', $this->modulo_id);
        $stmt->bindParam(':pregunta', $this->pregunta);
        $stmt->bindParam(':tipo_respuesta_id', $this->tipo_respuesta_id);
        $stmt->bindParam(':activa', $this->activa, PDO::PARAM_BOOL);
        $stmt->bindParam(':id', $this->id);

        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            return false;
        }
    }

    /**
     * Eliminar una pregunta (desactivar)
     * @return bool
     */
    public function eliminar()
    {
        $query = "UPDATE " . $this->tabla . "
                 SET activa = false
                 WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);

        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            return false;
        }
    }
}

?>