<?php
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/Database.php';

try {
    $database = new Database();
    $db = $database->conectar();
    echo "Conexión exitosa a la base de datos\n";

    // Prueba simple: obtener la versión de MySQL
    $stmt = $db->query('SELECT VERSION() as version');
    $version = $stmt->fetch();
    echo "Versión de MySQL: " . $version['version'] . "\n";

    $database->cerrarConexion();
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

?>