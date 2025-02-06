<?php

/**
 * Esta clase se encarga de validar los datos ingresados por los usuarios.
 * Verifica que los datos cumplan con los formatos y requisitos necesarios,
 * como correos válidos, contraseñas seguras, fechas correctas, etc.
 */
class Validator
{
    // Constantes de edad
    private const EDAD_MINIMA_TI = 14;
    private const EDAD_MAXIMA_TI = 17;
    private const EDAD_MINIMA_ADULTO = 18;
    private const EDAD_MAXIMA = 100;

    // Patrones de validación
    private const PATRON_MAYUSCULA = '/[A-Z]/';
    private const PATRON_MINUSCULA = '/[a-z]/';
    private const PATRON_NUMERO = '/[0-9]/';
    private const PATRON_ESPECIAL = '/[!@#$%^&*(),.?":{}|<>]/';
    private const PATRON_TELEFONO = '/^3[0-9]{9}$/';

    // Requisitos de documentos por tipo
    private const TIPOS_DOCUMENTO = [
        1 => [
            'nombre' => 'Tarjeta de Identidad',
            'patron' => '/^\d{10}$/',
            'descripcion' => '10 dígitos exactos',
            'edad_min' => self::EDAD_MINIMA_TI,
            'edad_max' => self::EDAD_MAXIMA_TI
        ],
        2 => [
            'nombre' => 'Cédula de Ciudadanía',
            'patron' => '/^\d{6,10}$/',
            'descripcion' => 'entre 6 y 10 dígitos',
            'edad_min' => self::EDAD_MINIMA_ADULTO,
            'edad_max' => null
        ],
        3 => [
            'nombre' => 'Cédula de Extranjería',
            'patron' => '/^\d{6,12}$/',
            'descripcion' => 'entre 6 y 12 dígitos',
            'edad_min' => self::EDAD_MINIMA_ADULTO,
            'edad_max' => null
        ],
        4 => [
            'nombre' => 'NIT',
            'patron' => '/^\d{9}-\d{1}$/',  // Actualizado para NIT con guión
            'descripcion' => '9 dígitos, guión y dígito de verificación',
            'edad_min' => self::EDAD_MINIMA_ADULTO,
            'edad_max' => null
        ]
    ];

    // Mensajes de error
    private $mensajesError = [
        'auth' => [
            'edad_invalida_ti' => [
                'codigo' => 'EDAD_INVALIDA_TI',
                'mensaje' => 'Para tarjeta de identidad debe tener entre 14 y 17 años'
            ],
            'edad_invalida_cc' => [
                'codigo' => 'EDAD_INVALIDA_CC',
                'mensaje' => 'Debe ser mayor de 18 años para este tipo de documento'
            ],
            'edad_maxima' => [
                'codigo' => 'EDAD_MAXIMA',
                'mensaje' => 'La edad ingresada supera el límite permitido'
            ],
            'telefono_invalido' => [
                'codigo' => 'TELEFONO_INVALIDO',
                'mensaje' => 'El número debe empezar con 3 y tener 10 dígitos'
            ],
            'correo_vacio' => [
                'codigo' => 'CORREO_VACIO',
                'mensaje' => 'Por favor ingresa tu correo electrónico'
            ],
            'correo_formato' => [
                'codigo' => 'CORREO_INVALIDO',
                'mensaje' => 'El formato del correo electrónico no es válido'
            ],
            'documento_vacio' => [
                'codigo' => 'DOCUMENTO_VACIO',
                'mensaje' => 'Por favor ingresa tu número de documento'
            ],
            'documento_invalido' => [
                'codigo' => 'DOCUMENTO_INVALIDO',
                'mensaje' => 'El formato del documento no es válido para el tipo seleccionado'
            ],
            'tipo_documento_invalido' => [
                'codigo' => 'TIPO_DOCUMENTO_INVALIDO',
                'mensaje' => 'El tipo de documento seleccionado no es válido'
            ],
            'contrasena_vacia' => [
                'codigo' => 'CONTRASENA_VACIA',
                'mensaje' => 'Por favor ingresa una contraseña'
            ],
            'contrasena_longitud' => [
                'codigo' => 'CONTRASENA_LONGITUD',
                'mensaje' => 'La contraseña debe tener al menos 8 caracteres'
            ],
            'contrasena_requisitos' => [
                'codigo' => 'CONTRASENA_REQUISITOS',
                'mensaje' => 'La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales'
            ],
            'fecha_vacia' => [
                'codigo' => 'FECHA_VACIA',
                'mensaje' => 'Por favor ingresa tu fecha de nacimiento'
            ],
            'fecha_formato' => [
                'codigo' => 'FECHA_FORMATO',
                'mensaje' => 'La fecha debe tener el formato AAAA-MM-DD'
            ],
            'fecha_futura' => [
                'codigo' => 'FECHA_FUTURA',
                'mensaje' => 'La fecha de nacimiento no puede ser futura'
            ]
        ]
    ];

    // Lista de errores encontrados
    private $errores = [];

    /**
     * Verifica que un correo electrónico sea válido
     */
    public function validarCorreo($correo)
    {
        if (empty($correo)) {
            $this->errores['correo'] = $this->obtenerMensajeError('correo_vacio');
            return false;
        }

        if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            $this->errores['correo'] = $this->obtenerMensajeError('correo_formato');
            return false;
        }

        return true;
    }

    /**
     * Verifica que una contraseña cumpla con los requisitos de seguridad
     */
    public function validarContrasena($contrasena)
    {
        if (empty($contrasena)) {
            $this->errores['contrasena'] = $this->obtenerMensajeError('contrasena_vacia');
            return false;
        }

        if (strlen($contrasena) < 8) {
            $this->errores['contrasena'] = $this->obtenerMensajeError('contrasena_longitud');
            return false;
        }

        $requisitos = [
            self::PATRON_MAYUSCULA,
            self::PATRON_MINUSCULA,
            self::PATRON_NUMERO,
            self::PATRON_ESPECIAL
        ];

        foreach ($requisitos as $patron) {
            if (!preg_match($patron, $contrasena)) {
                $this->errores['contrasena'] = $this->obtenerMensajeError('contrasena_requisitos');
                return false;
            }
        }

        return true;
    }

    /**
     * Valida la fecha de nacimiento y la edad según el tipo de documento
     */
    public function validarFechaNacimiento($fecha, $tipoDocumento = null)
    {
        if (empty($fecha)) {
            $this->errores['fecha_nacimiento'] = $this->obtenerMensajeError('fecha_vacia');
            return false;
        }

        $fecha_obj = DateTime::createFromFormat('Y-m-d', $fecha);
        if (!$fecha_obj || $fecha_obj->format('Y-m-d') !== $fecha) {
            $this->errores['fecha_nacimiento'] = $this->obtenerMensajeError('fecha_formato');
            return false;
        }

        $hoy = new DateTime();
        if ($fecha_obj > $hoy) {
            $this->errores['fecha_nacimiento'] = $this->obtenerMensajeError('fecha_futura');
            return false;
        }

        $edad = $hoy->diff($fecha_obj)->y;

        if ($edad > self::EDAD_MAXIMA) {
            $this->errores['fecha_nacimiento'] = $this->obtenerMensajeError('edad_maxima');
            return false;
        }

        if ($tipoDocumento !== null) {
            if (!isset(self::TIPOS_DOCUMENTO[$tipoDocumento])) {
                $this->errores['tipo_documento'] = $this->obtenerMensajeError('tipo_documento_invalido');
                return false;
            }

            $requisitos = self::TIPOS_DOCUMENTO[$tipoDocumento];

            if (
                $edad < $requisitos['edad_min'] ||
                ($requisitos['edad_max'] !== null && $edad > $requisitos['edad_max'])
            ) {
                $this->errores['fecha_nacimiento'] = sprintf(
                    "Para %s debe tener %s años",
                    $requisitos['nombre'],
                    $requisitos['edad_max'] ?
                        "entre {$requisitos['edad_min']} y {$requisitos['edad_max']}" :
                        "mínimo {$requisitos['edad_min']}"
                );
                return false;
            }
        }

        return true;
    }

    /**
     * Valida el documento según su tipo
     */
    public function validarDocumento($numero, $tipo)
    {
        if (empty($numero)) {
            $this->errores['numero_documento'] = $this->obtenerMensajeError('documento_vacio');
            return false;
        }

        if (!isset(self::TIPOS_DOCUMENTO[$tipo])) {
            $this->errores['tipo_documento'] = $this->obtenerMensajeError('tipo_documento_invalido');
            return false;
        }

        $requisitos = self::TIPOS_DOCUMENTO[$tipo];
        if (!preg_match($requisitos['patron'], $numero)) {
            $this->errores['numero_documento'] = sprintf(
                "El documento debe tener %s para %s",
                $requisitos['descripcion'],
                $requisitos['nombre']
            );
            return false;
        }

        return true;
    }

    /**
     * Valida el número de teléfono (debe comenzar con 3 y tener 10 dígitos)
     */
    public function validarTelefono($telefono)
    {
        if (empty($telefono)) {
            return true; // El teléfono es opcional
        }

        if (!preg_match(self::PATRON_TELEFONO, $telefono)) {
            $this->errores['telefono'] = $this->obtenerMensajeError('telefono_invalido');
            return false;
        }

        return true;
    }

    /**
     * Obtiene un mensaje de error específico
     */
    private function obtenerMensajeError($codigo, $contexto = 'auth')
    {
        return $this->mensajesError[$contexto][$codigo]['mensaje'] ?? 'Error de validación';
    }

    /**
     * Devuelve la lista de errores encontrados
     */
    public function obtenerErrores()
    {
        return $this->errores;
    }

    /**
     * Limpia la lista de errores
     */
    public function limpiarErrores()
    {
        $this->errores = [];
    }

    /**
     * Verifica si hay errores pendientes
     */
    public function hayErrores()
    {
        return !empty($this->errores);
    }

    /**
     * Obtiene el primer error encontrado
     */
    public function obtenerPrimerError()
    {
        return reset($this->errores);
    }
}

?>