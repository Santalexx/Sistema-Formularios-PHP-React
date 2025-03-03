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
    public $opciones;        // Opciones de respuesta para preguntas de selección múltiple

    // 
    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function crear()
    {
        try {
            $query = "INSERT INTO " . $this->tabla . "
                (modulo_id, pregunta, tipo_respuesta_id, opciones, activa)
                VALUES
                (:modulo_id, :pregunta, :tipo_respuesta_id, :opciones, :activa)";

            $stmt = $this->conn->prepare($query);

            // Limpiamos el texto de la pregunta
            $this->pregunta = $this->limpiarTexto($this->pregunta);

            // Convertir opciones a JSON si existen
            $opcionesJson = null;
            if (!empty($this->opciones)) {
                // Limpiamos cada opción antes de convertir a JSON
                $opcionesLimpias = array_map([$this, 'limpiarTexto'], $this->opciones);
                $opcionesJson = json_encode($opcionesLimpias);
            }

            // Vinculamos todos los parámetros
            $this->vincularDatosPregunta($stmt);
            $stmt->bindParam(':opciones', $opcionesJson);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error al crear pregunta: " . $e->getMessage());
            return false;
        }
    }

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

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $preguntas = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Decodificar las opciones JSON para cada pregunta
            foreach ($preguntas as &$pregunta) {
                if (!empty($pregunta['opciones'])) {
                    $pregunta['opciones'] = json_decode($pregunta['opciones'], true);
                } else {
                    $pregunta['opciones'] = null;
                }
            }

            return $preguntas;
        } catch (PDOException $e) {
            error_log("Error al obtener preguntas: " . $e->getMessage());
            return [];
        }
    }

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

    public function actualizar()
    {
        try {
            $query = "UPDATE " . $this->tabla . "
                 SET modulo_id = :modulo_id,
                     pregunta = :pregunta,
                     tipo_respuesta_id = :tipo_respuesta_id,
                     opciones = :opciones,
                     activa = :activa
                 WHERE id = :id";

            $stmt = $this->conn->prepare($query);

            // Limpiamos el texto de la pregunta
            $this->pregunta = $this->limpiarTexto($this->pregunta);

            // Convertir opciones a JSON si existen
            $opcionesJson = null;
            if (!empty($this->opciones)) {
                $opcionesLimpias = array_map([$this, 'limpiarTexto'], $this->opciones);
                $opcionesJson = json_encode($opcionesLimpias);
            }

            // Vinculamos todos los parámetros
            $this->vincularDatosPregunta($stmt);
            $stmt->bindParam(':opciones', $opcionesJson);
            $stmt->bindParam(':id', $this->id);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error al actualizar pregunta: " . $e->getMessage());
            return false;
        }
    }

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

    private function limpiarTexto($texto)
    {
        return htmlspecialchars(strip_tags($texto));
    }

    private function vincularDatosPregunta($stmt)
    {
        $stmt->bindParam(':modulo_id', $this->modulo_id);
        $stmt->bindParam(':pregunta', $this->pregunta);
        $stmt->bindParam(':tipo_respuesta_id', $this->tipo_respuesta_id);
        $stmt->bindParam(':activa', $this->activa, PDO::PARAM_BOOL);
    }
}