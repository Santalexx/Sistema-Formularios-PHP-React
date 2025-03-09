<?php

/**
 * Esta clase maneja todas las operaciones relacionadas con las respuestas de los usuarios
 * en la base de datos. Se encarga de guardar nuevas respuestas, consultar respuestas
 * existentes, actualizar respuestas y generar estadísticas.
 */
class Respuesta
{
    // Conexión a la base de datos
    private $conn;

    // Nombre de la tabla en la base de datos
    private $tabla = 'respuestas';

    // Datos de la respuesta
    public $id;               // Identificador único de la respuesta
    public $usuario_id;       // Usuario que dio la respuesta
    public $pregunta_id;      // Pregunta que se respondió
    public $respuesta;        // Texto o valor de la respuesta
    public $fecha_respuesta;  // Cuándo se dio la respuesta

    /**
     * Al crear una nueva instancia, guardamos la conexión a la base de datos
     */
    public function __construct($db)
    {
        $this->conn = $db;
    }

    /**
     * Guarda una nueva respuesta en la base de datos
     * 
     * @return bool true si la respuesta se guardó correctamente, false si hubo un error
     */
    public function guardar()
    {
        try {
            // Preparamos la consulta para insertar la respuesta
            $query = "INSERT INTO " . $this->tabla . "
                    (usuario_id, pregunta_id, respuesta)
                    VALUES
                    (:usuario_id, :pregunta_id, :respuesta)";

            $stmt = $this->conn->prepare($query);

            // Limpiamos la respuesta para evitar código malicioso
            $this->respuesta = $this->limpiarTexto($this->respuesta);

            // Vinculamos los datos con la consulta
            $this->vincularDatosRespuesta($stmt);

            // Ejecutamos la consulta
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error al guardar respuesta: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Obtiene todas las respuestas de un usuario específico
     * 
     * @param int $usuario_id ID del usuario a consultar
     * @return array Lista de respuestas con información relacionada
     */
    public function obtenerPorUsuario($usuario_id)
    {
        try {
            // Preparamos la consulta que obtiene las respuestas y su información relacionada
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
        } catch (PDOException $e) {
            error_log("Error al obtener respuestas del usuario: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Obtiene todas las respuestas para una pregunta específica
     * 
     * @param int $pregunta_id ID de la pregunta a consultar
     * @return array Lista de respuestas con información de los usuarios
     */
    public function obtenerPorPregunta($pregunta_id)
    {
        try {
            // Preparamos la consulta que obtiene las respuestas y datos de los usuarios
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
        } catch (PDOException $e) {
            error_log("Error al obtener respuestas de la pregunta: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Verifica si un usuario ya respondió una pregunta específica
     * 
     * @param int $usuario_id ID del usuario
     * @param int $pregunta_id ID de la pregunta
     * @return bool true si ya respondió, false si no
     */
    public function yaRespondio($usuario_id, $pregunta_id)
    {
        try {
            $query = "SELECT id FROM " . $this->tabla . "
                     WHERE usuario_id = :usuario_id 
                     AND pregunta_id = :pregunta_id
                     LIMIT 1";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':usuario_id', $usuario_id);
            $stmt->bindParam(':pregunta_id', $pregunta_id);
            $stmt->execute();

            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Error al verificar respuesta existente: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Obtiene estadísticas de las respuestas por módulo
     * 
     * @param int $modulo_id ID del módulo a analizar
     * @return array Estadísticas de las respuestas
     */
    public function obtenerEstadisticasPorModulo($modulo_id)
    {
        try {
            // Preparamos la consulta que calcula las estadísticas
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
        } catch (PDOException $e) {
            error_log("Error al obtener estadísticas: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Actualiza una respuesta existente
     * 
     * @return bool true si la actualización fue exitosa, false si hubo un error
     */
    public function actualizar()
    {
        try {
            $query = "UPDATE " . $this->tabla . "
                     SET respuesta = :respuesta
                     WHERE id = :id AND usuario_id = :usuario_id";

            $stmt = $this->conn->prepare($query);

            // Limpiamos la respuesta
            $this->respuesta = $this->limpiarTexto($this->respuesta);

            // Vinculamos los datos
            $stmt->bindParam(':respuesta', $this->respuesta);
            $stmt->bindParam(':id', $this->id);
            $stmt->bindParam(':usuario_id', $this->usuario_id);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error al actualizar respuesta: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Elimina una respuesta de la base de datos
     * 
     * @return bool true si se eliminó correctamente, false si hubo un error
     */
    public function eliminar()
    {
        try {
            $query = "DELETE FROM " . $this->tabla . "
                     WHERE id = :id AND usuario_id = :usuario_id";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $this->id);
            $stmt->bindParam(':usuario_id', $this->usuario_id);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error al eliminar respuesta: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Limpia el texto para evitar código malicioso
     */
    private function limpiarTexto($texto)
    {
        return htmlspecialchars(strip_tags($texto));
    }

    /**
     * Vincula los datos básicos de una respuesta con la consulta preparada
     */
    private function vincularDatosRespuesta($stmt)
    {
        $stmt->bindParam(':usuario_id', $this->usuario_id);
        $stmt->bindParam(':pregunta_id', $this->pregunta_id);
        $stmt->bindParam(':respuesta', $this->respuesta);
    }

    /**
     * Obtiene todas las respuestas con información de usuarios
     */
    public function obtenerTodasConUsuarios()
    {
        try {
            // Consulta más simple para identificar errores
            $query = "SELECT 
                    r.*,
                    p.pregunta,
                    p.modulo_id,
                    tr.nombre as tipo_respuesta,
                    u.nombre_completo as nombre_usuario,
                    u.area_trabajo_id,
                    a.nombre as area_trabajo
                 FROM " . $this->tabla . " r
                 JOIN preguntas p ON r.pregunta_id = p.id
                 JOIN tipos_respuesta tr ON p.tipo_respuesta_id = tr.id
                 JOIN usuarios u ON r.usuario_id = u.id
                 LEFT JOIN areas_trabajo a ON u.area_trabajo_id = a.id
                 ORDER BY r.fecha_respuesta DESC";

            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            // Registrar el error para diagnóstico
            error_log("Error en obtenerTodasConUsuarios: " . $e->getMessage());
            return [];
        }
    }
}