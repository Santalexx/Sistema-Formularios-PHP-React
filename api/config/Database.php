<?php

class Database
{
    private $host; // Almacena la direccion del servidor de la base de datos
    private $port; // Almacena el puerto del servidor de la base de datos
    private $db_name; // Almacena el nombre de la base de datos
    private $username; // Almacena el nombre de usuario para la conexion a la base de datos
    private $password; // Almacena el password
    private $conn; // Almacena la conexión a la base de datos (un objeto PDO)

    public function __construct() // Es un método especial llamado constructor. Se ejecuta automáticamente cuando se crea una instancia de la clase Database.
    {
        $this->host = DB_HOST;
        $this->port = DB_PORT;
        $this->db_name = DB_NAME;
        $this->username = DB_USER;
        $this->password = DB_PASS;
    }

    /**
     * Obtiene la conexión a la base de datos
     * @return PDO|null Retorna la conexión PDO o null si hay error
     */
    public function conectar()
    {
        $this->conn = null;

        try {
            // Construir el DSN para la conexión
            $dsn = "mysql:host=" . $this->host .
                ";port=" . $this->port .
                ";dbname=" . $this->db_name .
                ";charset=utf8mb4";

            // Opciones para PDO
            $opciones = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_spanish_ci"
            ];

            // Crear la conexión
            $this->conn = new PDO($dsn, $this->username, $this->password, $opciones);

            return $this->conn;
        } catch (PDOException $e) {
            // En producción, deberías loguear el error en lugar de mostrarlo
            error_log("Error de conexión: " . $e->getMessage());
            throw new Exception("Error de conexión a la base de datos");
        }
    }

    /**
     * Cierra la conexión a la base de datos
     */
    public function cerrarConexion()
    {
        $this->conn = null;
    }

    /**
     * Inicia una transacción
     */
    public function iniciarTransaccion()
    {
        $this->conn->beginTransaction();
    }

    /**
     * Confirma una transacción
     */
    public function confirmarTransaccion()
    {
        $this->conn->commit();
    }

    /**
     * Revierte una transacción
     */
    public function revertirTransaccion()
    {
        $this->conn->rollBack();
    }

    /**
     * Verifica si hay una transacción activa
     * @return bool
     */
    public function enTransaccion()
    {
        return $this->conn->inTransaction();
    }
}

?>