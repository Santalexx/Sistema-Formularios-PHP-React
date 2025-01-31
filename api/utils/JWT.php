<?php

class JWT
{
    private static $algoritmo = 'SHA256';
    private static $tipoToken = 'JWT';

    /**
     * Codifica los datos en base64url
     */
    private static function base64url_encode($datos)
    {
        return rtrim(strtr(base64_encode($datos), '+/', '-_'), '=');
    }

    /**
     * Decodifica datos en base64url
     */
    private static function base64url_decode($datos)
    {
        return base64_decode(strtr($datos, '-_', '+/') . str_repeat('=', 3 - (3 + strlen($datos)) % 4));
    }

    /**
     * Crea un token JWT
     * @param array $payload Datos a codificar en el token
     * @return string Token JWT
     */
    public static function crearToken($payload)
    {
        // Crear header
        $header = json_encode([
            'typ' => self::$tipoToken,
            'alg' => 'HS256'
        ]);

        // Preparar payload con timestamps
        $payload['iat'] = time(); // Tiempo de creación
        $payload['exp'] = time() + JWT_EXPIRE; // Tiempo de expiración

        // Codificar header y payload
        $header_codificado = self::base64url_encode($header);
        $payload_codificado = self::base64url_encode(json_encode($payload));

        // Crear firma
        $firma = hash_hmac(
            self::$algoritmo,
            "$header_codificado.$payload_codificado",
            JWT_SECRET,
            true
        );

        $firma_codificada = self::base64url_encode($firma);

        // Retornar token completo
        return "$header_codificado.$payload_codificado.$firma_codificada";
    }

    /**
     * Verifica y decodifica un token JWT
     * @param string $token Token JWT a verificar
     * @return array|false Payload decodificado o false si es inválido
     */
    public static function verificarToken($token)
    {
        // Dividir token en sus partes
        $partes = explode('.', $token);
        if (count($partes) != 3) {
            return false;
        }

        list($header_codificado, $payload_codificado, $firma_recibida) = $partes;

        // Verificar firma
        $firma = hash_hmac(
            self::$algoritmo,
            "$header_codificado.$payload_codificado",
            JWT_SECRET,
            true
        );

        $firma_codificada = self::base64url_encode($firma);

        if ($firma_codificada !== $firma_recibida) {
            return false;
        }

        // Decodificar payload
        $payload = json_decode(self::base64url_decode($payload_codificado), true);

        // Verificar expiración
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }

        return $payload;
    }

    /**
     * Obtiene los datos del token sin verificar firma
     * @param string $token Token JWT
     * @return array|null Datos del token o null si es inválido
     */
    public static function obtenerDatos($token)
    {
        try {
            $partes = explode('.', $token);
            if (count($partes) != 3) {
                return null;
            }

            return json_decode(self::base64url_decode($partes[1]), true);
        } catch (Exception $e) {
            return null;
        }
    }
}

?>
