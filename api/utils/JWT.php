<?php

/**
 * Esta clase maneja la creación y verificación de tokens JWT (JSON Web Tokens).
 * Los tokens JWT son una forma segura de transmitir información entre partes
 * como un objeto JSON que está firmado digitalmente.
 */
class JWT
{
    // Configuración del algoritmo de firma
    private static $algoritmo = 'SHA256';
    private static $tipoToken = 'JWT';

    // Mensajes de error
    private const ERROR_FORMATO = 'Formato de token inválido';
    private const ERROR_FIRMA = 'Firma del token inválida';
    private const ERROR_EXPIRADO = 'El token ha expirado';

    /**
     * Convierte datos a formato base64url
     * Este formato es seguro para URLs y no contiene caracteres especiales
     * 
     * @param string $datos Datos a codificar
     * @return string Datos codificados en base64url
     */
    private static function base64url_encode($datos)
    {
        return rtrim(strtr(base64_encode($datos), '+/', '-_'), '=');
    }

    /**
     * Convierte datos de base64url a su formato original
     * 
     * @param string $datos Datos en formato base64url
     * @return string Datos decodificados
     */
    private static function base64url_decode($datos)
    {
        $padding = str_repeat('=', 3 - (3 + strlen($datos)) % 4);
        return base64_decode(strtr($datos, '-_', '+/') . $padding);
    }

    /**
     * Crea un nuevo token JWT con los datos proporcionados
     * 
     * @param array $payload Datos que se incluirán en el token
     * @return string Token JWT generado
     * @throws Exception si hay error al crear el token
     */
    public static function crearToken($payload)
    {
        try {
            // Creamos el encabezado del token
            $header = [
                'typ' => self::$tipoToken,
                'alg' => 'HS256'
            ];

            // Agregamos marcas de tiempo al payload
            $payload['iat'] = time();                  // Momento de creación
            $payload['exp'] = time() + JWT_EXPIRE;     // Momento de expiración

            // Codificamos las partes del token
            $header_codificado = self::base64url_encode(json_encode($header));
            $payload_codificado = self::base64url_encode(json_encode($payload));

            // Generamos la firma digital
            $dato_a_firmar = "$header_codificado.$payload_codificado";
            $firma = self::generarFirma($dato_a_firmar);

            // Construimos el token completo
            return "$header_codificado.$payload_codificado.$firma";
        } catch (Exception $e) {
            error_log("Error al crear token JWT: " . $e->getMessage());
            throw new Exception("No se pudo crear el token");
        }
    }

    /**
     * Verifica y decodifica un token JWT
     * 
     * @param string $token Token JWT a verificar
     * @return array|false Datos del token si es válido, false si no
     */
    public static function verificarToken($token)
    {
        try {
            // Separamos el token en sus partes
            $partes = explode('.', $token);
            if (count($partes) !== 3) {
                error_log(self::ERROR_FORMATO);
                return false;
            }

            list($header_codificado, $payload_codificado, $firma_recibida) = $partes;

            // Verificamos que la firma sea válida
            $dato_firmado = "$header_codificado.$payload_codificado";
            $firma_calculada = self::generarFirma($dato_firmado);

            if ($firma_calculada !== $firma_recibida) {
                error_log(self::ERROR_FIRMA);
                return false;
            }

            // Decodificamos y verificamos el payload
            $payload = json_decode(self::base64url_decode($payload_codificado), true);

            // Verificamos si el token ha expirado
            if (isset($payload['exp']) && $payload['exp'] < time()) {
                error_log(self::ERROR_EXPIRADO);
                return false;
            }

            return $payload;
        } catch (Exception $e) {
            error_log("Error al verificar token JWT: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Obtiene los datos de un token sin verificar su firma
     * Útil cuando solo necesitamos ver el contenido sin validar
     * 
     * @param string $token Token JWT
     * @return array|null Datos del token o null si el formato es inválido
     */
    public static function obtenerDatos($token)
    {
        try {
            $partes = explode('.', $token);
            if (count($partes) !== 3) {
                return null;
            }

            return json_decode(self::base64url_decode($partes[1]), true);
        } catch (Exception $e) {
            error_log("Error al obtener datos del token: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Genera la firma digital para un dato usando el algoritmo configurado
     * 
     * @param string $datos Datos a firmar
     * @return string Firma codificada en base64url
     */
    private static function generarFirma($datos)
    {
        $firma = hash_hmac(
            self::$algoritmo,
            $datos,
            JWT_SECRET,
            true
        );

        return self::base64url_encode($firma);
    }
}

?>