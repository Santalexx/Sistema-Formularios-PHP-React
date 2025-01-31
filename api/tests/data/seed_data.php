<?php

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/Database.php';

try {
    $database = new Database();
    $db = $database->conectar();

    echo "Conectado a la base de datos. Iniciando inserción de datos...\n\n";

    // Insertar áreas de trabajo si no existen
    $query = "INSERT IGNORE INTO areas_trabajo (id, nombre) VALUES 
        (1, 'Recursos Humanos'),
        (2, 'Producción'),
        (3, 'Ventas'),
        (4, 'Administración'),
        (5, 'Diseño')";
    $db->exec($query);
    echo "✅ Áreas de trabajo insertadas\n";

    // Insertar módulos si no existen
    $query = "INSERT IGNORE INTO modulos (id, nombre, descripcion) VALUES 
        (1, 'Satisfacción Laboral', 'Preguntas sobre satisfacción en el trabajo'),
        (2, 'Ambiente de trabajo', 'Evaluación del ambiente laboral'),
        (3, 'Oportunidades de desarrollo', 'Desarrollo profesional y capacitación'),
        (4, 'Sugerencias', 'Sugerencias y comentarios generales')";
    $db->exec($query);
    echo "✅ Módulos insertados\n";

    // Insertar tipos de respuesta si no existen
    $query = "INSERT IGNORE INTO tipos_respuesta (id, nombre, descripcion) VALUES 
        (1, 'Escala de satisfacción', 'Escala del 1 al 5'),
        (2, 'Respuesta abierta', 'Campo de texto libre'),
        (3, 'Opción múltiple', 'Opciones: Sí/No/No aplica')";
    $db->exec($query);
    echo "✅ Tipos de respuesta insertados\n";

    // Insertar preguntas de prueba
    $query = "INSERT IGNORE INTO preguntas (modulo_id, pregunta, tipo_respuesta_id, activa) VALUES 
        (1, '¿Qué tan satisfecho está con su trabajo actual?', 1, true),
        (1, '¿Se siente motivado para realizar sus tareas diarias?', 1, true),
        (2, '¿Considera que el ambiente de trabajo es adecuado?', 3, true),
        (2, '¿Qué aspectos del ambiente laboral mejoraría?', 2, true),
        (3, '¿Ha recibido capacitación útil para su desarrollo?', 3, true),
        (3, '¿Qué tipo de capacitación le gustaría recibir?', 2, true)";
    $db->exec($query);
    echo "✅ Preguntas insertadas\n";

    echo "\nDatos de prueba insertados exitosamente.\n";
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

?>