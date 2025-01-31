<?php

require_once __DIR__ . '/../models/Usuario.php';
require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../utils/Validator.php';

class AuthController
{
    private $db;
    private $usuario;
    private $validator;

    public function __construct()
    {
        $database = new Database();
        $this->db = $database->conectar();
        $this->usuario = new Usuario($this->db);
        $this->validator = new Validator();
    }

    /**
     * Procesa las solicitudes entrantes
     * @param string $metodo Método HTTP
     * @param string|null $parametro Parámetro adicional de la URL
     */
    public function procesarSolicitud($metodo, $parametro = null)
    {
        switch ($metodo) {
            case 'POST':
                if ($parametro === 'login') {
                    $this->login();
                } elseif ($parametro === 'registro') {
                    $this->registro();
                } else {
                    http_response_code(404);
                    echo json_encode(['mensaje' => 'Endpoint no encontrado']);
                }
                break;
            case 'GET':
                if ($parametro === 'perfil') {
                    $this->obtenerPerfil();
                } else {
                    http_response_code(404);
                    echo json_encode(['mensaje' => 'Endpoint no encontrado']);
                }
                break;
            case 'PUT':
                if ($parametro === 'actualizar-perfil') {
                    $this->actualizarPerfil();
                } elseif ($parametro === 'cambiar-contrasena') {
                    $this->cambiarContrasena();
                } else {
                    http_response_code(404);
                    echo json_encode(['mensaje' => 'Endpoint no encontrado']);
                }
                break;
            default:
                http_response_code(405);
                echo json_encode(['mensaje' => 'Método no permitido']);
                break;
        }
    }

    /**
     * Maneja el login de usuarios
     */
    private function login()
    {
        // Obtener datos POST
        $datos = json_decode(file_get_contents("php://input"));

        if (!isset($datos->correo) || !isset($datos->contrasena)) {
            http_response_code(400);
            echo json_encode(['mensaje' => 'Faltan datos requeridos']);
            return;
        }

        // Validar correo
        if (!$this->validator->validarCorreo($datos->correo)) {
            http_response_code(400);
            echo json_encode(['mensaje' => $this->validator->obtenerErrores()['correo']]);
            return;
        }

        // Intentar login
        $usuario = $this->usuario->login($datos->correo, $datos->contrasena);

        if ($usuario) {
            // Crear token JWT
            $token = JWT::crearToken([
                'id' => $usuario['id'],
                'correo' => $usuario['correo'],
                'rol_id' => $usuario['rol_id']
            ]);

            // Eliminar la contraseña del array de respuesta
            unset($usuario['contrasena']);

            echo json_encode([
                'mensaje' => 'Login exitoso',
                'token' => $token,
                'usuario' => $usuario
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['mensaje' => 'Credenciales inválidas']);
        }
    }

    /**
     * Maneja el registro de nuevos usuarios
     */
    private function registro()
    {
        // Obtener datos POST
        $datos = json_decode(file_get_contents("php://input"));

        // Verificar datos requeridos
        $camposRequeridos = [
            'nombre_completo',
            'correo',
            'fecha_nacimiento',
            'tipo_documento_id',
            'numero_documento',
            'area_trabajo_id',
            'contrasena'
        ];

        foreach ($camposRequeridos as $campo) {
            if (!isset($datos->$campo)) {
                http_response_code(400);
                echo json_encode(['mensaje' => "El campo $campo es requerido"]);
                return;
            }
        }

        // Validar datos
        if (!$this->validator->validarCorreo($datos->correo)) {
            http_response_code(400);
            echo json_encode(['errores' => ['correo' => $this->validator->obtenerErrores()['correo']]]);
            return;
        }

        if (!$this->validator->validarContrasena($datos->contrasena)) {
            http_response_code(400);
            echo json_encode(['errores' => ['contrasena' => $this->validator->obtenerErrores()['contrasena']]]);
            return;
        }

        if (!$this->validator->validarFechaNacimiento($datos->fecha_nacimiento)) {
            http_response_code(400);
            echo json_encode(['errores' => ['fecha_nacimiento' => $this->validator->obtenerErrores()['fecha_nacimiento']]]);
            return;
        }

        if (!$this->validator->validarDocumento($datos->numero_documento, $datos->tipo_documento_id)) {
            http_response_code(400);
            echo json_encode(['errores' => ['documento' => $this->validator->obtenerErrores()['numero_documento']]]);
            return;
        }

        if (isset($datos->telefono) && !$this->validator->validarTelefono($datos->telefono)) {
            http_response_code(400);
            echo json_encode(['errores' => ['telefono' => $this->validator->obtenerErrores()['telefono']]]);
            return;
        }

        // Verificar si el correo ya existe
        $this->usuario->correo = $datos->correo;
        if ($this->usuario->existeCorreo()) {
            http_response_code(400);
            echo json_encode(['mensaje' => 'El correo ya está registrado']);
            return;
        }

        // Verificar si el documento ya existe
        $this->usuario->numero_documento = $datos->numero_documento;
        if ($this->usuario->existeDocumento()) {
            http_response_code(400);
            echo json_encode(['mensaje' => 'El número de documento ya está registrado']);
            return;
        }

        // Asignar datos al objeto usuario
        $this->usuario->nombre_completo = $datos->nombre_completo;
        $this->usuario->fecha_nacimiento = $datos->fecha_nacimiento;
        $this->usuario->tipo_documento_id = $datos->tipo_documento_id;
        $this->usuario->area_trabajo_id = $datos->area_trabajo_id;
        $this->usuario->telefono = $datos->telefono ?? null;
        $this->usuario->contrasena = $datos->contrasena;
        $this->usuario->rol_id = 2; // Rol por defecto: Usuario

        // Intentar crear el usuario
        if ($this->usuario->crear()) {
            http_response_code(201);
            echo json_encode(['mensaje' => 'Usuario creado exitosamente']);
        } else {
            http_response_code(500);
            echo json_encode(['mensaje' => 'Error al crear el usuario']);
        }
    }

    /**
     * Obtiene el perfil del usuario autenticado
     */
    private function obtenerPerfil()
    {
        $headers = getallheaders();

        if (!isset($headers['Authorization'])) {
            http_response_code(401);
            echo json_encode(['mensaje' => 'Token no proporcionado']);
            return;
        }

        $token = str_replace('Bearer ', '', $headers['Authorization']);
        $datos = JWT::verificarToken($token);

        if (!$datos) {
            http_response_code(401);
            echo json_encode(['mensaje' => 'Token inválido o expirado']);
            return;
        }

        $perfil = $this->usuario->obtenerPorId($datos['id']);

        if ($perfil) {
            unset($perfil['contrasena']); // No enviar la contraseña
            echo json_encode(['usuario' => $perfil]);
        } else {
            http_response_code(404);
            echo json_encode(['mensaje' => 'Usuario no encontrado']);
        }
    }

    /**
     * Actualiza el perfil del usuario
     */
    private function actualizarPerfil()
    {
        $headers = getallheaders();

        if (!isset($headers['Authorization'])) {
            http_response_code(401);
            echo json_encode(['mensaje' => 'Token no proporcionado']);
            return;
        }

        $token = str_replace('Bearer ', '', $headers['Authorization']);
        $datos_token = JWT::verificarToken($token);

        if (!$datos_token) {
            http_response_code(401);
            echo json_encode(['mensaje' => 'Token inválido o expirado']);
            return;
        }

        $datos = json_decode(file_get_contents("php://input"));

        if (!isset($datos->nombre_completo) || !isset($datos->fecha_nacimiento)) {
            http_response_code(400);
            echo json_encode(['mensaje' => 'Faltan datos requeridos']);
            return;
        }

        // Validar fecha de nacimiento
        if (!$this->validator->validarFechaNacimiento($datos->fecha_nacimiento)) {
            http_response_code(400);
            echo json_encode(['errores' => ['fecha_nacimiento' => $this->validator->obtenerErrores()['fecha_nacimiento']]]);
            return;
        }

        // Validar teléfono si está presente
        if (isset($datos->telefono) && !$this->validator->validarTelefono($datos->telefono)) {
            http_response_code(400);
            echo json_encode(['errores' => ['telefono' => $this->validator->obtenerErrores()['telefono']]]);
            return;
        }

        $this->usuario->id = $datos_token['id'];
        $this->usuario->nombre_completo = $datos->nombre_completo;
        $this->usuario->fecha_nacimiento = $datos->fecha_nacimiento;
        $this->usuario->area_trabajo_id = $datos->area_trabajo_id;
        $this->usuario->telefono = $datos->telefono ?? null;

        if ($this->usuario->actualizar()) {
            echo json_encode(['mensaje' => 'Perfil actualizado exitosamente']);
        } else {
            http_response_code(500);
            echo json_encode(['mensaje' => 'Error al actualizar el perfil']);
        }
    }

    /**
     * Cambiar contraseña del usuario
     */
    private function cambiarContrasena()
    {
        $headers = getallheaders();

        if (!isset($headers['Authorization'])) {
            http_response_code(401);
            echo json_encode(['mensaje' => 'Token no proporcionado']);
            return;
        }

        $token = str_replace('Bearer ', '', $headers['Authorization']);
        $datos_token = JWT::verificarToken($token);

        if (!$datos_token) {
            http_response_code(401);
            echo json_encode(['mensaje' => 'Token inválido o expirado']);
            return;
        }

        $datos = json_decode(file_get_contents("php://input"));

        if (!isset($datos->contrasena_actual) || !isset($datos->contrasena_nueva)) {
            http_response_code(400);
            echo json_encode(['mensaje' => 'Faltan datos requeridos']);
            return;
        }

        // Validar nueva contraseña
        if (!$this->validator->validarContrasena($datos->contrasena_nueva)) {
            http_response_code(400);
            echo json_encode(['errores' => ['contrasena' => $this->validator->obtenerErrores()['contrasena']]]);
            return;
        }

        $this->usuario->id = $datos_token['id'];

        if ($this->usuario->cambiarContrasena($datos->contrasena_actual, $datos->contrasena_nueva)) {
            echo json_encode(['mensaje' => 'Contraseña actualizada exitosamente']);
        } else {
            http_response_code(400);
            echo json_encode(['mensaje' => 'La contraseña actual es incorrecta']);
        }
    }
}

?>