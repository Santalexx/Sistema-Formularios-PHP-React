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
                'registro' => [$this, 'registro']
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

    // Permite a los usuarios ver su información de perfil
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