<?php

/**
 * Esta clase maneja todas las operaciones relacionadas con los usuarios en la base de datos.
 * Se encarga de:
 * - Crear nuevos usuarios
 * - Autenticar usuarios (login)
 * - Actualizar información de usuarios
 * - Gestionar contraseñas
 * - Verificar datos únicos (correo, documento)
 */
class Usuario
{
    // Conexión a la base de datos
    private $conn;

    // Nombre de la tabla en la base de datos
    private $tabla = 'usuarios';

    // Información del usuario
    public $id;                // Identificador único del usuario
    public $nombre_completo;   // Nombre completo del usuario
    public $correo;           // Correo electrónico (debe ser único)
    public $fecha_nacimiento; // Fecha de nacimiento
    public $tipo_documento_id; // Tipo de documento de identidad
    public $numero_documento;  // Número de documento (debe ser único)
    public $area_trabajo_id;  // Área donde trabaja el usuario
    public $telefono;         // Teléfono de contacto (opcional)
    public $contrasena;       // Contraseña (se guarda encriptada)
    public $rol_id;           // Rol del usuario en el sistema
    public $fecha_registro;   // Fecha en que se registró
    public $activo;          // Estado del usuario en el sistema

    /**
     * Al crear una nueva instancia, guardamos la conexión a la base de datos
     */
    public function __construct($db)
    {
        $this->conn = $db;
    }

    /**
     * Crea un nuevo usuario en el sistema
     * 
     * @return bool true si el usuario se creó correctamente, false si hubo un error
     */
    public function crear()
    {
        try {
            // Preparamos la consulta para insertar el usuario
            $query = "INSERT INTO " . $this->tabla . "
                    (nombre_completo, correo, fecha_nacimiento, tipo_documento_id,
                     numero_documento, area_trabajo_id, telefono, contrasena, rol_id)
                    VALUES
                    (:nombre_completo, :correo, :fecha_nacimiento, :tipo_documento_id,
                     :numero_documento, :area_trabajo_id, :telefono, :contrasena, :rol_id)";

            $stmt = $this->conn->prepare($query);

            // Limpiamos los datos para evitar código malicioso
            $this->limpiarDatos();

            // Encriptamos la contraseña
            $this->contrasena = password_hash($this->contrasena, PASSWORD_DEFAULT);

            // Vinculamos los datos con la consulta
            $this->vincularDatosUsuario($stmt);

            // Ejecutamos la consulta
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error al crear usuario: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Verifica las credenciales de un usuario para el login
     * 
     * @param string $correo Correo del usuario
     * @param string $contrasena Contraseña sin encriptar
     * @return array|false Datos del usuario si el login es exitoso, false si falla
     */
    public function login($correo, $contrasena)
    {
        try {
            // Buscamos al usuario por su correo
            $query = "SELECT * FROM " . $this->tabla . " 
                     WHERE correo = :correo AND activo = true 
                     LIMIT 1";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':correo', $correo);
            $stmt->execute();

            if ($usuario = $stmt->fetch(PDO::FETCH_ASSOC)) {
                // Verificamos si la contraseña es correcta
                if (password_verify($contrasena, $usuario['contrasena'])) {
                    return $usuario;
                }
            }
            return false;
        } catch (PDOException $e) {
            error_log("Error en login: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Verifica si un correo ya está registrado
     * 
     * @return bool true si el correo existe, false si no
     */
    public function existeCorreo()
    {
        try {
            $query = "SELECT id FROM " . $this->tabla . " 
                     WHERE correo = :correo 
                     LIMIT 1";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':correo', $this->correo);
            $stmt->execute();

            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Error al verificar correo: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Verifica si un número de documento ya está registrado
     * 
     * @return bool true si el documento existe, false si no
     */
    public function existeDocumento()
    {
        try {
            $query = "SELECT id FROM " . $this->tabla . " 
                     WHERE numero_documento = :numero_documento 
                     LIMIT 1";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':numero_documento', $this->numero_documento);
            $stmt->execute();

            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Error al verificar documento: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Obtiene la información completa de un usuario
     * 
     * @param int $id ID del usuario a buscar
     * @return array|false Datos del usuario si se encuentra, false si no
     */
    public function obtenerPorId($id)
    {
        try {
            // Obtenemos los datos del usuario y su información relacionada
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
        } catch (PDOException $e) {
            error_log("Error al obtener usuario: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Actualiza la información básica del usuario
     * 
     * @return bool true si la actualización fue exitosa, false si hubo error
     */
    public function actualizar()
    {
        try {
            $query = "UPDATE " . $this->tabla . "
                     SET nombre_completo = :nombre_completo,
                         fecha_nacimiento = :fecha_nacimiento,
                         area_trabajo_id = :area_trabajo_id,
                         telefono = :telefono
                     WHERE id = :id";

            $stmt = $this->conn->prepare($query);

            // Limpiamos los datos
            $this->nombre_completo = $this->limpiarTexto($this->nombre_completo);
            $this->telefono = $this->telefono ? $this->limpiarTexto($this->telefono) : null;

            // Vinculamos los datos
            $stmt->bindParam(':nombre_completo', $this->nombre_completo);
            $stmt->bindParam(':fecha_nacimiento', $this->fecha_nacimiento);
            $stmt->bindParam(':area_trabajo_id', $this->area_trabajo_id);
            $stmt->bindParam(':telefono', $this->telefono);
            $stmt->bindParam(':id', $this->id);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error al actualizar usuario: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Cambia la contraseña de un usuario
     * 
     * @param string $contrasena_actual Contraseña actual sin encriptar
     * @param string $contrasena_nueva Nueva contraseña sin encriptar
     * @return bool true si el cambio fue exitoso, false si hubo error
     */
    public function cambiarContrasena($contrasena_actual, $contrasena_nueva)
    {
        try {
            // Primero verificamos que la contraseña actual sea correcta
            $query = "SELECT contrasena FROM " . $this->tabla . " 
                     WHERE id = :id 
                     LIMIT 1";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $this->id);
            $stmt->execute();

            if ($usuario = $stmt->fetch(PDO::FETCH_ASSOC)) {
                if (!password_verify($contrasena_actual, $usuario['contrasena'])) {
                    return false;
                }
            } else {
                return false;
            }

            // Si la contraseña actual es correcta, actualizamos a la nueva
            $query = "UPDATE " . $this->tabla . "
                     SET contrasena = :contrasena
                     WHERE id = :id";

            $stmt = $this->conn->prepare($query);

            // Encriptamos la nueva contraseña
            $contrasena_hash = password_hash($contrasena_nueva, PASSWORD_DEFAULT);

            $stmt->bindParam(':contrasena', $contrasena_hash);
            $stmt->bindParam(':id', $this->id);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error al cambiar contraseña: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Limpia un texto para evitar código malicioso
     */
    private function limpiarTexto($texto)
    {
        return htmlspecialchars(strip_tags($texto));
    }

    /**
     * Limpia todos los datos del usuario
     */
    private function limpiarDatos()
    {
        $this->nombre_completo = $this->limpiarTexto($this->nombre_completo);
        $this->correo = $this->limpiarTexto($this->correo);
        $this->numero_documento = $this->limpiarTexto($this->numero_documento);
        $this->telefono = $this->telefono ? $this->limpiarTexto($this->telefono) : null;
    }

    /**
     * Vincula los datos básicos del usuario con la consulta preparada
     */
    private function vincularDatosUsuario($stmt)
    {
        $stmt->bindParam(':nombre_completo', $this->nombre_completo);
        $stmt->bindParam(':correo', $this->correo);
        $stmt->bindParam(':fecha_nacimiento', $this->fecha_nacimiento);
        $stmt->bindParam(':tipo_documento_id', $this->tipo_documento_id);
        $stmt->bindParam(':numero_documento', $this->numero_documento);
        $stmt->bindParam(':area_trabajo_id', $this->area_trabajo_id);
        $stmt->bindParam(':telefono', $this->telefono);
        $stmt->bindParam(':contrasena', $this->contrasena);
        $stmt->bindParam(':rol_id', $this->rol_id);
    }
}

?>