<?php
// corregir_opciones.php - Script para corregir opciones faltantes en preguntas de opción múltiple

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/Database.php';

echo "Iniciando corrección de opciones en preguntas...\n\n";

try {
    $database = new Database();
    $db = $database->conectar();
    echo "✅ Conexión a la base de datos exitosa\n\n";

    // Obtener todas las preguntas de tipo opción múltiple
    $query = "SELECT id, pregunta, opciones FROM preguntas WHERE tipo_respuesta_id = 3";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $preguntas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Encontradas " . count($preguntas) . " preguntas de opción múltiple.\n\n";

    $corregidas = 0;
    foreach ($preguntas as $pregunta) {
        echo "Pregunta ID {$pregunta['id']}: {$pregunta['pregunta']}\n";

        // Verificar si ya tiene opciones
        $tienOpciones = !empty($pregunta['opciones']) && $pregunta['opciones'] != 'null';

        if ($tienOpciones) {
            echo "  - Ya tiene opciones: " . $pregunta['opciones'] . "\n";
            continue;
        }

        echo "  - No tiene opciones configuradas.\n";

        // Preguntar al usuario qué opciones quiere agregar
        echo "  - Ingrese las opciones separadas por coma (o presione ENTER para usar 'Estrato 1,Estrato 2,Estrato 3,Estrato 4' para preguntas con 'estrato'): ";
        $input = trim(fgets(STDIN));

        // Si no hay entrada del usuario, usar opciones predeterminadas basadas en el texto de la pregunta
        if (empty($input)) {
            // Si la pregunta contiene "estrato" o "socioeconómico", usar opciones de estratos
            if (
                stripos($pregunta['pregunta'], 'estrato') !== false ||
                stripos($pregunta['pregunta'], 'socioeconómico') !== false
            ) {
                $opciones = ["Estrato 1", "Estrato 2", "Estrato 3", "Estrato 4"];
            } else {
                // Opciones por defecto para otras preguntas
                $opciones = ["Si", "No", "No aplica"];
            }
        } else {
            // Usar las opciones proporcionadas por el usuario
            $opciones = array_map('trim', explode(',', $input));
        }

        // Convertir a JSON y almacenar
        $opcionesJson = json_encode($opciones, JSON_UNESCAPED_UNICODE);

        $query = "UPDATE preguntas SET opciones = :opciones WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':opciones', $opcionesJson);
        $stmt->bindParam(':id', $pregunta['id']);

        if ($stmt->execute()) {
            echo "  - ✅ Opciones actualizadas a: " . $opcionesJson . "\n";
            $corregidas++;
        } else {
            echo "  - ❌ Error al actualizar opciones\n";
        }

        echo "\n";
    }

    echo "Proceso completado. Se corrigieron $corregidas preguntas.\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
