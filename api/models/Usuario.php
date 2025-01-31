<?php

class Usuario
{
    private $conn;
    private $tabla = 'usuarios';

    // Propiedades
    public $id;
    public $nombre_completo;
    public $correo;
    public $fecha_nacimiento;
    public $tipo_documento_id;
    public $numero_documento;
    public $area_trabajo_id;
    public $telefono;
    public $contrasena;
    public $rol_id;
    public $fecha_registro;
    public $activo;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    /**
     * Crea un nuevo usuario
     * @return bool
     */
    public function crear()
    {
        $query = "INSERT INTO " . $this->tabla . "
                (nombre_completo, correo, fecha_nacimiento, tipo_documento_id,
                 numero_documento, area_trabajo_id, telefono, contrasena, rol_id)
                VALUES
                (:nombre_completo, :correo, :fecha_nacimiento, :tipo_documento_id,
                 :numero_documento, :area_trabajo_id, :telefono, :contrasena, :rol_id)";

        $stmt = $this->conn->prepare($query);

        // Sanitizar datos
        $this->nombre_completo = htmlspecialchars(strip_tags($this->nombre_completo));
        $this->correo = htmlspecialchars(strip_tags($this->correo));
        $this->numero_documento = htmlspecialchars(strip_tags($this->numero_documento));
        $this->telefono = $this->telefono ? htmlspecialchars(strip_tags($this->telefono)) : null;

        // Hash de la contraseña
        $this->contrasena = password_hash($this->contrasena, PASSWORD_DEFAULT);

        // Vincular parámetros
        $stmt->bindParam(':nombre_completo', $this->nombre_completo);
        $stmt->bindParam(':correo', $this->correo);
        $stmt->bindParam(':fecha_nacimiento', $this->fecha_nacimiento);
        $stmt->bindParam(':tipo_documento_id', $this->tipo_documento_id);
        $stmt->bindParam(':numero_documento', $this->numero_documento);
        $stmt->bindParam(':area_trabajo_id', $this->area_trabajo_id);
        $stmt->bindParam(':telefono', $this->telefono);
        $stmt->bindParam(':contrasena', $this->contrasena);
        $stmt->bindParam(':rol_id', $this->rol_id);

        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            return false;
        }
    }

    /**
     * Login de usuario
     * @param string $correo
     * @param string $contrasena
     * @return bool|array
     */
    public function login($correo, $contrasena)
    {
        $query = "SELECT * FROM " . $this->tabla . " 
                 WHERE correo = :correo AND activo = true LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':correo', $correo);
        $stmt->execute();

        if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if (password_verify($contrasena, $row['contrasena'])) {
                return $row;
            }
        }
        return false;
    }

    /**
     * Verifica si existe un correo
     * @return bool
     */
    public function existeCorreo()
    {
        $query = "SELECT id FROM " . $this->tabla . " 
                 WHERE correo = :correo LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':correo', $this->correo);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }

    /**
     * Verifica si existe un número de documento
     * @return bool
     */
    public function existeDocumento()
    {
        $query = "SELECT id FROM " . $this->tabla . " 
                 WHERE numero_documento = :numero_documento LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':numero_documento', $this->numero_documento);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }

    /**
     * Obtiene la información de un usuario por ID
     * @param int $id
     * @return array|false
     */
    public function obtenerPorId($id)
    {
        $query = "SELECT 
                    u.*, 
                    td.nombre as tipo_documento,
                    at.nombre as area_trabajo,
                    r.nombre as rol
                 FROM " . $this->tabla . " u
                 LEFT JOIN tipos_documento td ON u.tipo_documento_id = td.id
                 LEFT JOIN areas_trabajo at ON u.area_trabajo_id = at.id
                 LEFT JOIN roles r ON u.rol_id = r.id
                 WHERE u.id = :id AND u.activo = true";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Actualiza la información de un usuario
     * @return bool
     */
    public function actualizar()
    {
        $query = "UPDATE " . $this->tabla . "
                 SET nombre_completo = :nombre_completo,
                     fecha_nacimiento = :fecha_nacimiento,
                     area_trabajo_id = :area_trabajo_id,
                     telefono = :telefono
                 WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        // Sanitizar datos
        $this->nombre_completo = htmlspecialchars(strip_tags($this->nombre_completo));
        $this->telefono = $this->telefono ? htmlspecialchars(strip_tags($this->telefono)) : null;

        // Vincular parámetros
        $stmt->bindParam(':nombre_completo', $this->nombre_completo);
        $stmt->bindParam(':fecha_nacimiento', $this->fecha_nacimiento);
        $stmt->bindParam(':area_trabajo_id', $this->area_trabajo_id);
        $stmt->bindParam(':telefono', $this->telefono);
        $stmt->bindParam(':id', $this->id);

        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            return false;
        }
    }

    /**
     * Cambiar contraseña
     * @param string $contrasena_actual
     * @param string $contrasena_nueva
     * @return bool
     */
    public function cambiarContrasena($contrasena_actual, $contrasena_nueva)
    {
        // Verificar contraseña actual
        $query = "SELECT contrasena FROM " . $this->tabla . " 
                 WHERE id = :id LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        $stmt->execute();

        if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if (!password_verify($contrasena_actual, $row['contrasena'])) {
                return false;
            }
        } else {
            return false;
        }

        // Actualizar contraseña
        $query = "UPDATE " . $this->tabla . "
                 SET contrasena = :contrasena
                 WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $contrasena_hash = password_hash($contrasena_nueva, PASSWORD_DEFAULT);

        $stmt->bindParam(':contrasena', $contrasena_hash);
        $stmt->bindParam(':id', $this->id);

        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            return false;
        }
    }
}

?>