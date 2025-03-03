<?php

// Incluimos los archivos necesarios para que el controlador funcione
require_once __DIR__ . '/../models/Usuario.php';
require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../utils/Validator.php';

/**
 * Esta clase se encarga de manejar todo lo relacionado con la cuenta del usuario:
 * - Crear cuenta nueva (registro)
 * - Iniciar sesión (login)
 * - Ver información del perfil
 * - Actualizar datos del perfil
 * - Cambiar contraseña
 */
class AuthController
{
    // Guardamos las herramientas que vamos a usar frecuentemente
    private $db;            // Para conectarnos a la base de datos
    private $usuario;       // Para manejar las operaciones con usuarios
    private $validator;     // Para validar datos como correos, contraseñas, etc.

    // Cuando creamos el controlador, preparamos todas las herramientas
    public function __construct()
    {
        $database = new Database();
        $this->db = $database->conectar();
        $this->usuario = new Usuario($this->db);
        $this->validator = new Validator();
    }

    // Este método es como un guardia que recibe todas las peticiones y las dirige al lugar correcto según lo que el usuario quiere hacer
    public function procesarSolicitud($metodo, $parametro = null)
    {
        // Definimos qué acciones están permitidas y qué método debe atenderlas
        $acciones_permitidas = [
            'POST' => [
                'login' => [$this, 'login'],
                'registro' => [$this, 'registro'],
                'recuperar-password' => [$this, 'recuperarPassword'],
                'resetear-password' => [$this, 'resetearPassword']
            ],
            'GET' => [
                'perfil' => [$this, 'obtenerPerfil']
            ],
            'PUT' => [
                'actualizar-perfil' => [$this, 'actualizarPerfil'],
                'cambiar-contrasena' => [$this, 'cambiarContrasena']
            ]
        ];

        // Si el método no está permitido, enviamos un error
        if (!isset($acciones_permitidas[$metodo])) {
            $this->responder(405, 'Este tipo de petición no está permitida');
            return;
        }

        // Si la acción solicitada no existe, enviamos un error
        if (!isset($acciones_permitidas[$metodo][$parametro])) {
            $this->responder(404, 'No encontramos lo que estás buscando');
            return;
        }

        // Si todo está bien, ejecutamos la acción solicitada
        call_user_func($acciones_permitidas[$metodo][$parametro]);
    }

    // Maneja el proceso de inicio de sesión de los usuarios
    private function login()
    {
        // Obtenemos los datos que envió el usuario
        $datos = json_decode(file_get_contents("php://input"));

        // Verificamos que nos hayan enviado el correo y la contraseña
        if (!isset($datos->correo) || !isset($datos->contrasena)) {
            $this->responder(400, 'Necesitamos tu correo y contraseña para continuar');
            return;
        }

        // Verificamos que el correo tenga un formato válido
        if (!$this->validator->validarCorreo($datos->correo)) {
            $this->responder(400, $this->validator->obtenerErrores()['correo']);
            return;
        }

        // Intentamos hacer login con los datos proporcionados
        $usuario = $this->usuario->login($datos->correo, $datos->contrasena);

        if ($usuario) {
            // Si el login es exitoso, creamos un token de acceso
            $token = JWT::crearToken([
                'id' => $usuario['id'],
                'correo' => $usuario['correo'],
                'rol_id' => $usuario['rol_id']
            ]);

            // Por seguridad, quitamos la contraseña antes de enviar los datos
            unset($usuario['contrasena']);

            // Enviamos la respuesta exitosa
            $this->responder(200, [
                'mensaje' => '¡Bienvenido!',
                'token' => $token,
                'usuario' => $usuario
            ]);
        } else {
            // Si el login falla, enviamos un mensaje de error
            $this->responder(401, 'El correo o la contraseña no son correctos');
        }
    }

    // Maneja el registro de nuevos usuarios
    private function registro()
    {
        // Obtenemos los datos que envió el usuario
        $datos = json_decode(file_get_contents("php://input"));

        // Lista de campos que necesitamos para crear una cuenta
        $campos_necesarios = [
            'nombre_completo',
            'correo',
            'fecha_nacimiento',
            'tipo_documento_id',
            'numero_documento',
            'area_trabajo_id',
            'contrasena'
        ];

        // Verificamos que no falte ningún campo requerido
        foreach ($campos_necesarios as $campo) {
            if (!isset($datos->$campo)) {
                $this->responder(400, "Por favor, completa el campo: $campo");
                return;
            }
        }

        // Validamos cada campo individual
        if (!$this->validarDatosRegistro($datos)) {
            return; // La función validarDatosRegistro ya envía el mensaje de error
        }

        // Verificamos que el correo no esté ya registrado
        $this->usuario->correo = $datos->correo;
        if ($this->usuario->existeCorreo()) {
            $this->responder(400, 'Este correo ya está registrado');
            return;
        }

        // Verificamos que el documento no esté ya registrado
        $this->usuario->numero_documento = $datos->numero_documento;
        if ($this->usuario->existeDocumento()) {
            $this->responder(400, 'Este número de documento ya está registrado');
            return;
        }

        // Si todas las validaciones pasan, preparamos los datos del usuario
        $this->usuario->nombre_completo = $datos->nombre_completo;
        $this->usuario->fecha_nacimiento = $datos->fecha_nacimiento;
        $this->usuario->tipo_documento_id = $datos->tipo_documento_id;
        $this->usuario->area_trabajo_id = $datos->area_trabajo_id;
        $this->usuario->telefono = $datos->telefono ?? null;
        $this->usuario->contrasena = $datos->contrasena;
        $this->usuario->rol_id = 2; // Asignamos el rol de usuario normal

        // Intentamos crear el usuario en la base de datos
        if ($this->usuario->crear()) {
            $this->responder(201, '¡Cuenta creada exitosamente!');
        } else {
            $this->responder(500, 'Hubo un problema al crear la cuenta. Por favor, intenta de nuevo');
        }
    }

    /**
     * Maneja la solicitud de recuperación de contraseña
     * Se debe llamar desde la ruta POST /auth/recuperar-password
     */
    private function recuperarPassword()
    {
        try {
            // Obtener datos de la solicitud
            $datos = json_decode(file_get_contents("php://input"));

            // Verificar que se haya proporcionado un correo
            if (!isset($datos->correo)) {
                $this->responder(400, 'El correo electrónico es requerido');
                return;
            }

            // Validar formato de correo
            if (!$this->validator->validarCorreo($datos->correo)) {
                $this->responder(400, $this->validator->obtenerErrores()['correo']);
                return;
            }

            // Verificar si el correo existe en la base de datos
            $this->usuario->correo = $datos->correo;
            if (!$this->usuario->existeCorreo()) {
                // Por seguridad, no informamos si el correo existe o no
                $this->responder(200, 'Si el correo existe en nuestro sistema, recibirás un correo con instrucciones');
                return;
            }

            // Obtener el ID del usuario directamente (nuevo código)
            $usuarioInfo = $this->usuario->obtenerIdPorCorreo($datos->correo);
            if (!$usuarioInfo) {
                error_log("No se pudo obtener información del usuario: " . $datos->correo);
                $this->responder(500, 'Error al procesar la solicitud');
                return;
            }

            // Establecer el ID del usuario (nuevo código)
            $this->usuario->id = $usuarioInfo;

            // Generar token único para recuperación
            $token = bin2hex(random_bytes(32));
            $expiracion = date('Y-m-d H:i:s', time() + 3600); // 1 hora de validez

            // Guardar token en la base de datos
            if (!$this->usuario->guardarTokenRecuperacion($token, $expiracion)) {
                $this->responder(500, 'Error al procesar la solicitud');
                return;
            }

            // Preparar el correo
            $nombreUsuario = $this->usuario->obtenerNombrePorCorreo($datos->correo);
            $urlRecuperacion = "http://localhost:5173/resetear-password/{$token}";
            $asunto = "Recuperación de contraseña - MuebleIdeas";

            $mensaje = "
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #802629; color: white; padding: 15px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .button { display: inline-block; background-color: #802629; color: white; padding: 10px 20px; 
                            text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { font-size: 12px; text-align: center; margin-top: 30px; color: #777; }
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h2>Recuperación de Contraseña</h2>
                    </div>
                    <div class='content'>
                        <p>Hola {$nombreUsuario},</p>
                        <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en MuebleIdeas.</p>
                        <p>Para continuar con el proceso, haz clic en el siguiente enlace:</p>
                        <p style='text-align: center;'>
                            <a href='{$urlRecuperacion}' class='button'>Restablecer mi contraseña</a>
                        </p>
                        <p>Si no solicitaste este cambio, puedes ignorar este correo. El enlace expirará en 1 hora por seguridad.</p>
                        <p>Gracias,<br>El equipo de MuebleIdeas</p>
                    </div>
                    <div class='footer'>
                        <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                    </div>
                </div>
            </body>
            </html>
            ";

            // Enviar el correo
            $nombreUsuario = $this->usuario->obtenerNombrePorCorreo($datos->correo);
            $urlRecuperacion = "http://localhost:5173/resetear-password/{$token}";
            $cabeceras = "MIME-Version: 1.0" . "\r\n";
            $cabeceras .= "Content-type:text/html;charset=UTF-8" . "\r\n";
            $cabeceras .= "From: MuebleIdeas <no-reply@muebleideas.com>" . "\r\n";

            if (mail($datos->correo, $asunto, $mensaje, $cabeceras)) {
                $this->responder(200, 'Se ha enviado un correo con instrucciones para restablecer tu contraseña');
            } else {
                error_log("Error al enviar correo a: " . $datos->correo);
                $this->responder(500, 'Error al enviar el correo. Por favor, intenta nuevamente');
            }
        } catch (Exception $e) {
            error_log("Excepción en recuperarPassword: " . $e->getMessage());
            $this->responder(500, 'Error interno al procesar la solicitud');
        }            
    }

    /**
     * Maneja la solicitud de restablecimiento de contraseña
     * Se debe llamar desde la ruta POST /auth/resetear-password
     */
    private function resetearPassword()
    {
        // Obtener datos de la solicitud
        $datos = json_decode(file_get_contents("php://input"));

        // Verificar que se hayan proporcionado todos los datos necesarios
        if (!isset($datos->token) || !isset($datos->contrasena_nueva)) {
            $this->responder(400, 'Todos los campos son requeridos');
            return;
        }

        // Validar la nueva contraseña
        if (!$this->validator->validarContrasena($datos->contrasena_nueva)) {
            $this->responder(400, $this->validator->obtenerErrores()['contrasena']);
            return;
        }

        // Verificar que el token sea válido y no haya expirado
        $usuarioId = $this->usuario->verificarTokenRecuperacion($datos->token);
        if (!$usuarioId) {
            $this->responder(400, 'El enlace de recuperación es inválido o ha expirado');
            return;
        }

        // Actualizar la contraseña
        $this->usuario->id = $usuarioId;
        $this->usuario->contrasena = password_hash($datos->contrasena_nueva, PASSWORD_DEFAULT);

        if ($this->usuario->actualizarContrasena()) {
            // Invalidar el token usado
            $this->usuario->invalidarTokenRecuperacion($datos->token);
            $this->responder(200, 'Contraseña actualizada exitosamente');
        } else {
            $this->responder(500, 'Error al actualizar la contraseña');
        }
    }

    /**
     * Permite a los usuarios ver su información de perfil
     */
    private function obtenerPerfil()
    {
        // Verificamos que el usuario esté autenticado
        $usuario = $this->verificarAutenticacion();
        if (!$usuario) {
            return;
        }

        // Buscamos los datos del usuario
        $perfil = $this->usuario->obtenerPorId($usuario['id']);

        if ($perfil) {
            // Por seguridad, quitamos la contraseña antes de enviar los datos
            unset($perfil['contrasena']);
            $this->responder(200, ['usuario' => $perfil]);
        } else {
            $this->responder(404, 'No encontramos tu perfil');
        }
    }

    // Permite a los usuarios actualizar su información de perfil
    private function actualizarPerfil()
    {
        // Verificamos que el usuario esté autenticado
        $usuario = $this->verificarAutenticacion();
        if (!$usuario) {
            return;
        }

        // Obtenemos los datos que el usuario quiere actualizar
        $datos = json_decode(file_get_contents("php://input"));

        // Verificamos que nos hayan enviado los datos mínimos necesarios
        if (!isset($datos->nombre_completo) || !isset($datos->fecha_nacimiento)) {
            $this->responder(400, 'Necesitamos tu nombre y fecha de nacimiento');
            return;
        }

        // Validamos la fecha de nacimiento
        if (!$this->validator->validarFechaNacimiento($datos->fecha_nacimiento)) {
            $this->responder(400, $this->validator->obtenerErrores()['fecha_nacimiento']);
            return;
        }

        // Validamos el teléfono si fue proporcionado
        if (isset($datos->telefono) && !$this->validator->validarTelefono($datos->telefono)) {
            $this->responder(400, $this->validator->obtenerErrores()['telefono']);
            return;
        }

        // Preparamos los datos para actualizar
        $this->usuario->id = $usuario['id'];
        $this->usuario->nombre_completo = $datos->nombre_completo;
        $this->usuario->fecha_nacimiento = $datos->fecha_nacimiento;
        $this->usuario->area_trabajo_id = $datos->area_trabajo_id;
        $this->usuario->telefono = $datos->telefono ?? null;

        // Intentamos actualizar el perfil
        if ($this->usuario->actualizar()) {
            $this->responder(200, 'Perfil actualizado exitosamente');
        } else {
            $this->responder(500, 'Hubo un problema al actualizar tu perfil');
        }
    }

    // Permite a los usuarios cambiar su contraseña
    private function cambiarContrasena()
    {
        // Verificamos que el usuario esté autenticado
        $usuario = $this->verificarAutenticacion();
        if (!$usuario) {
            return;
        }

        // Obtenemos los datos enviados
        $datos = json_decode(file_get_contents("php://input"));

        // Verificamos que nos hayan enviado ambas contraseñas
        if (!isset($datos->contrasena_actual) || !isset($datos->contrasena_nueva)) {
            $this->responder(400, 'Necesitamos tu contraseña actual y la nueva');
            return;
        }

        // Validamos que la nueva contraseña cumpla con los requisitos
        if (!$this->validator->validarContrasena($datos->contrasena_nueva)) {
            $this->responder(400, $this->validator->obtenerErrores()['contrasena']);
            return;
        }

        // Intentamos cambiar la contraseña
        $this->usuario->id = $usuario['id'];
        if ($this->usuario->cambiarContrasena($datos->contrasena_actual, $datos->contrasena_nueva)) {
            $this->responder(200, 'Contraseña actualizada exitosamente');
        } else {
            $this->responder(400, 'La contraseña actual no es correcta');
        }
    }

    // Verifica que el usuario esté autenticado correctamente
    private function verificarAutenticacion()
    {
        $headers = getallheaders();

        // Verificamos que se haya enviado el token
        if (!isset($headers['Authorization'])) {
            $this->responder(401, 'Por favor, inicia sesión para continuar');
            return false;
        }

        // Extraemos y verificamos el token
        $token = str_replace('Bearer ', '', $headers['Authorization']);
        $datos = JWT::verificarToken($token);

        if (!$datos) {
            $this->responder(401, 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo');
            return false;
        }

        return $datos;
    }

    // Valida todos los campos necesarios para el registro
    private function validarDatosRegistro($datos)
    {
        // Validamos el correo
        if (!$this->validator->validarCorreo($datos->correo)) {
            $this->responder(400, $this->validator->obtenerErrores()['correo']);
            return false;
        }

        // Validamos la contraseña
        if (!$this->validator->validarContrasena($datos->contrasena)) {
            $this->responder(400, $this->validator->obtenerErrores()['contrasena']);
            return false;
        }

        // Validamos la fecha de nacimiento
        if (!$this->validator->validarFechaNacimiento($datos->fecha_nacimiento)) {
            $this->responder(400, $this->validator->obtenerErrores()['fecha_nacimiento']);
            return false;
        }

        // Validamos el documento
        if (!$this->validator->validarDocumento($datos->numero_documento, $datos->tipo_documento_id)) {
            $this->responder(400, $this->validator->obtenerErrores()['numero_documento']);
            return false;
        }

        // Validamos el teléfono si fue proporcionado
        if (isset($datos->telefono) && !$this->validator->validarTelefono($datos->telefono)) {
            $this->responder(400, $this->validator->obtenerErrores()['telefono']);
            return false;
        }

        return true;
    }

    // Envía una respuesta al cliente en formato JSON
    private function responder($codigo, $mensaje)
    {
        http_response_code($codigo);
        if (is_string($mensaje)) {
            echo json_encode(['mensaje' => $mensaje]);
        } else {
            echo json_encode($mensaje);
        }
    }
}