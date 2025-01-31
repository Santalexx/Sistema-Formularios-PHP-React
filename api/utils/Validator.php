<?php

class Validator
{
    /**
     * Almacena los errores encontrados durante la validación
     */
    private $errores = [];

    /**
     * Valida un correo electrónico
     * @param string $correo Correo a validar
     * @return bool
     */
    public function validarCorreo($correo)
    {
        if (empty($correo)) {
            $this->errores['correo'] = "El correo es obligatorio";
            return false;
        }

        if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            $this->errores['correo'] = "El formato del correo es inválido";
            return false;
        }

        return true;
    }

    /**
     * Valida una contraseña
     * @param string $contrasena Contraseña a validar
     * @return bool
     */
    public function validarContrasena($contrasena)
    {
        if (empty($contrasena)) {
            $this->errores['contrasena'] = "La contraseña es obligatoria";
            return false;
        }

        // Mínimo 8 caracteres
        if (strlen($contrasena) < 8) {
            $this->errores['contrasena'] = "La contraseña debe tener al menos 8 caracteres";
            return false;
        }

        // Al menos una mayúscula
        if (!preg_match('/[A-Z]/', $contrasena)) {
            $this->errores['contrasena'] = "La contraseña debe contener al menos una mayúscula";
            return false;
        }

        // Al menos una minúscula
        if (!preg_match('/[a-z]/', $contrasena)) {
            $this->errores['contrasena'] = "La contraseña debe contener al menos una minúscula";
            return false;
        }

        // Al menos un número
        if (!preg_match('/[0-9]/', $contrasena)) {
            $this->errores['contrasena'] = "La contraseña debe contener al menos un número";
            return false;
        }

        // Al menos un carácter especial
        if (!preg_match('/[!@#$%^&*(),.?":{}|<>]/', $contrasena)) {
            $this->errores['contrasena'] = "La contraseña debe contener al menos un carácter especial";
            return false;
        }

        return true;
    }

    /**
     * Valida una fecha de nacimiento
     * @param string $fecha Fecha en formato YYYY-MM-DD
     * @return bool
     */
    public function validarFechaNacimiento($fecha)
    {
        if (empty($fecha)) {
            $this->errores['fecha_nacimiento'] = "La fecha de nacimiento es obligatoria";
            return false;
        }

        $fecha_obj = DateTime::createFromFormat('Y-m-d', $fecha);

        if (!$fecha_obj || $fecha_obj->format('Y-m-d') !== $fecha) {
            $this->errores['fecha_nacimiento'] = "El formato de fecha debe ser YYYY-MM-DD";
            return false;
        }

        $hoy = new DateTime();
        if ($fecha_obj > $hoy) {
            $this->errores['fecha_nacimiento'] = "La fecha de nacimiento no puede ser futura";
            return false;
        }

        return true;
    }

    /**
     * Valida un número de documento
     * @param string $numero Número de documento
     * @param string $tipo Tipo de documento
     * @return bool
     */
    public function validarDocumento($numero, $tipo)
    {
        if (empty($numero)) {
            $this->errores['numero_documento'] = "El número de documento es obligatorio";
            return false;
        }

        switch ($tipo) {
            case 1: // Tarjeta de identidad
            case 2: // Cédula de Ciudadanía
                if (!preg_match('/^[0-9]{8,10}$/', $numero)) {
                    $this->errores['numero_documento'] = "El número de documento debe tener entre 8 y 10 dígitos";
                    return false;
                }
                break;
            case 3: // Cédula de Extranjería
                if (!preg_match('/^[0-9]{6,12}$/', $numero)) {
                    $this->errores['numero_documento'] = "El número de documento debe tener entre 6 y 12 dígitos";
                    return false;
                }
                break;
            case 4: // NIT
                if (!preg_match('/^[0-9]{9,9}$/', $numero)) {
                    $this->errores['numero_documento'] = "El NIT debe tener 9 dígitos";
                    return false;
                }
                break;
            case 5: // Pasaporte
                if (!preg_match('/^[A-Z0-9]{6,12}$/', $numero)) {
                    $this->errores['numero_documento'] = "El pasaporte debe tener entre 6 y 12 caracteres alfanuméricos";
                    return false;
                }
                break;
            default:
                $this->errores['tipo_documento'] = "Tipo de documento inválido";
                return false;
        }

        return true;
    }

    /**
     * Valida un número de teléfono (opcional)
     * @param string|null $telefono Número de teléfono
     * @return bool
     */
    public function validarTelefono($telefono)
    {
        if (empty($telefono)) {
            return true; // Es opcional
        }

        if (!preg_match('/^[0-9]{10}$/', $telefono)) {
            $this->errores['telefono'] = "El número de teléfono debe tener 10 dígitos";
            return false;
        }

        return true;
    }

    /**
     * Obtiene los errores de validación
     * @return array
     */
    public function obtenerErrores()
    {
        return $this->errores;
    }

    /**
     * Limpia los errores de validación
     */
    public function limpiarErrores()
    {
        $this->errores = [];
    }
}

?>
