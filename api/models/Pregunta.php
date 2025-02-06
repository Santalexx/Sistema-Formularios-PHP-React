<?php

/**
 * Esta clase maneja todas las operaciones relacionadas con las preguntas en la base de datos.
 * Se encarga de crear, leer, actualizar y eliminar preguntas, así como obtener
 * información relacionada con cada pregunta, como su módulo y tipo de respuesta.
 */
class Pregunta
{
    // Conexión a la base de datos
    private $conn;

    // Nombre de la tabla en la base de datos
    private $tabla = 'preguntas';

    // Datos de la pregunta
    public $id;              // Identificador único de la pregunta
    public $modulo_id;       // Módulo al que pertenece la pregunta
    public $pregunta;        // Texto de la pregunta
    public $tipo_respuesta_id; // Tipo de respuesta esperada
    public $activa;          // Indica si la pregunta está activa
    public $fecha_creacion;  // Fecha en que se creó la pregunta

    /**
     * Al crear una nueva instancia, guardamos la conexión a la base de datos
     */
    public function __construct($db)
    {
        $this->conn = $db;
    }

    /**
     * Crea una nueva pregunta en la base de datos
     * 
     * @return bool true si la pregunta se creó correctamente, false si hubo un error
     */
    public function crear()
    {
        try {
            // Preparamos la consulta SQL
            $query = "INSERT INTO " . $this->tabla . "
                    (modulo_id, pregunta, tipo_respuesta_id, activa)
                    VALUES
                    (:modulo_id, :pregunta, :tipo_respuesta_id, :activa)";

            $stmt = $this->conn->prepare($query);

            // Limpiamos el texto de la pregunta para evitar código malicioso
            $this->pregunta = $this->limpiarTexto($this->pregunta);

            // Si no se especificó si la pregunta está activa, la activamos por defecto
            $this->activa = $this->activa ?? true;

            // Vinculamos los datos con la consulta
            $this->vincularDatosPregunta($stmt);

            // Ejecutamos la consulta
            return $stmt->execute();
        } catch (PDOException $e) {
            // Si algo sale mal, registramos el error y devolvemos false
            error_log("Error al crear pregunta: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Obtiene todas las preguntas activas junto con su información relacionada
     * 
     * @return array Lista de preguntas con sus módulos y tipos de respuesta
     */
    public function obtenerTodas()
    {
        // Preparamos la consulta que obtiene las preguntas y su información relacionada
        $query = "SELECT 
                    p.*,
                    m.nombre as modulo,
                    tr.nombre as tipo_respuesta
                 FROM " . $this->tabla . " p
                 LEFT JOIN modulos m ON p.modulo_id = m.id
                 LEFT JOIN tipos_respuesta tr ON p.tipo_respuesta_id = tr.id
                 WHERE p.activa = true
                 ORDER BY m.id, p.id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error al obtener preguntas: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Obtiene una pregunta específica por su ID junto con su información relacionada
     * 
     * @return array|false Datos de la pregunta o false si no se encuentra
     */
    public function obtenerPorId()
    {
        // Preparamos la consulta para obtener una pregunta específica
        $query = "SELECT 
                    p.*,
                    m.nombre as modulo,
                    tr.nombre as tipo_respuesta
                 FROM " . $this->tabla . " p
                 LEFT JOIN modulos m ON p.modulo_id = m.id
                 LEFT JOIN tipos_respuesta tr ON p.tipo_respuesta_id = tr.id
                 WHERE p.id = :id AND p.activa = true
                 LIMIT 1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $this->id);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error al obtener pregunta por ID: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Obtiene todas las preguntas de un módulo específico
     * 
     * @param int $modulo_id ID del módulo a consultar
     * @return array Lista de preguntas del módulo
     */
    public function obtenerPorModulo($modulo_id)
    {
        // Preparamos la consulta para obtener preguntas de un módulo
        $query = "SELECT 
                    p.*,
                    tr.nombre as tipo_respuesta
                 FROM " . $this->tabla . " p
                 LEFT JOIN tipos_respuesta tr ON p.tipo_respuesta_id = tr.id
                 WHERE p.modulo_id = :modulo_id AND p.activa = true
                 ORDER BY p.id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':modulo_id', $modulo_id);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error al obtener preguntas por módulo: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Actualiza una pregunta existente
     * 
     * @return bool true si la actualización fue exitosa, false si hubo un error
     */
    public function actualizar()
    {
        try {
            // Preparamos la consulta de actualización
            $query = "UPDATE " . $this->tabla . "
                     SET modulo_id = :modulo_id,
                         pregunta = :pregunta,
                         tipo_respuesta_id = :tipo_respuesta_id,
                         activa = :activa
                     WHERE id = :id";

            $stmt = $this->conn->prepare($query);

            // Limpiamos el texto de la pregunta
            $this->pregunta = $this->limpiarTexto($this->pregunta);

            // Vinculamos los datos con la consulta
            $this->vincularDatosPregunta($stmt);
            $stmt->bindParam(':id', $this->id);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error al actualizar pregunta: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Elimina (desactiva) una pregunta
     * 
     * @return bool true si la desactivación fue exitosa, false si hubo un error
     */
    public function eliminar()
    {
        try {
            // En lugar de eliminar, marcamos la pregunta como inactiva
            $query = "UPDATE " . $this->tabla . "
                     SET activa = false
                     WHERE id = :id";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $this->id);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error al eliminar pregunta: " . $e->getMessage());
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
     * Vincula los datos de la pregunta con la consulta preparada
     */
    private function vincularDatosPregunta($stmt)
    {
        $stmt->bindParam(':modulo_id', $this->modulo_id);
        $stmt->bindParam(':pregunta', $this->pregunta);
        $stmt->bindParam(':tipo_respuesta_id', $this->tipo_respuesta_id);
        $stmt->bindParam(':activa', $this->activa, PDO::PARAM_BOOL);
    }
}

?>