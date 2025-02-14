<?php

class Database
{
    private string $host;
    private string $port;
    private string $dbName;
    private string $username;
    private string $password;
    private ?PDO $conn = null;

    public function __construct()
    {        
        $this->host = DB_HOST;
        $this->port = DB_PORT;
        $this->dbName = DB_NAME;
        $this->username = DB_USER;
        $this->password = DB_PASS;
    }

    public function conectar(): ?PDO
    {
        if ($this->conn) {
            return $this->conn;
        }

        $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->dbName};charset=utf8mb4";

        $opciones = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_spanish_ci"
        ];

        try {
            $this->conn = new PDO($dsn, $this->username, $this->password, $opciones);
        } catch (PDOException $e) {
            error_log("Error de conexión: " . $e->getMessage());
            throw new Exception("Error de conexión a la base de datos");
        }

        return $this->conn;
    }

    public function cerrarConexion(): void
    {
        $this->conn = null;
    }

    public function iniciarTransaccion(): void
    {
        $this->conn?->beginTransaction();
    }

    public function confirmarTransaccion(): void
    {
        $this->conn?->commit();
    }

    public function revertirTransaccion(): void
    {
        $this->conn?->rollBack();
    }

    public function enTransaccion(): bool
    {
        return $this->conn?->inTransaction() ?? false;
    }
}