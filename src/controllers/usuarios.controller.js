const ModeloUsuario = require("../models/usuario.model");
const { generarToken, invalidarToken } = require("../utils/jwt.util");

/**
 * Registrar nuevo usuario
 */
const registrarUsuario = async (req, res) => {
    try {
        const { nombre, apellido, email, contrasena, direccion, telefono } = req.body;
        
        if (!nombre || !apellido || !email || !contrasena) {
            return res.status(400).json({
                exito: false,
                mensaje: "Nombre, apellido, email y contraseña son requeridos",
                codigo: "MISSING_FIELDS"
            });
        }
        
        const usuarioExistente = await ModeloUsuario.findOne({ email });
        if (usuarioExistente) {
            return res.status(400).json({
                exito: false,
                mensaje: "El email ya está registrado",
                codigo: "EMAIL_EXISTS"
            });
        }
        
        const nuevoUsuario = new ModeloUsuario({
            nombre,
            apellido,
            email,
            contrasena_hash: contrasena,
            direccion,
            telefono
        });
        
        await nuevoUsuario.save();
        
        const token = generarToken({
            usuario_id: nuevoUsuario.usuario_id,
            email: nuevoUsuario.email,
            rol: nuevoUsuario.rol
        });
        
        res.status(201).json({
            exito: true,
            mensaje: "Usuario registrado exitosamente",
            data: {
                usuario: nuevoUsuario.obtenerDatosPublicos(),
                token
            }
        });
        
    } catch (error) {
        console.error("Error en registrarUsuario:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Login de usuario
 */
const loginUsuario = async (req, res) => {
    try {
        console.log('Login attempt:', { email: req.body.email, hasPassword: !!req.body.contrasena });
        
        const { email, contrasena } = req.body;
        
        if (!email || !contrasena) {
            console.log('Missing credentials');
            return res.status(400).json({
                exito: false,
                mensaje: "Email y contraseña son requeridos",
                codigo: "MISSING_CREDENTIALS"
            });
        }
        
        console.log('Looking for user with email:', email);
        const usuario = await ModeloUsuario.findOne({ email, estado: true });
        if (!usuario) {
            console.log('User not found');
            return res.status(401).json({
                exito: false,
                mensaje: "Credenciales inválidas",
                codigo: "INVALID_CREDENTIALS"
            });
        }
        
        console.log('User found:', { usuario_id: usuario.usuario_id, nombre: usuario.nombre });
        const contrasenaValida = await usuario.compararContrasena(contrasena);
        console.log('Password validation result:', contrasenaValida);
        
        if (!contrasenaValida) {
            console.log('Invalid password');
            return res.status(401).json({
                exito: false,
                mensaje: "Credenciales inválidas",
                codigo: "INVALID_CREDENTIALS"
            });
        }
        
        const token = generarToken({
            usuario_id: usuario.usuario_id,
            email: usuario.email,
            rol: usuario.rol
        });
        
        res.json({
            exito: true,
            mensaje: "Login exitoso",
            data: {
                usuario: usuario.obtenerDatosPublicos(),
                token
            }
        });
        
    } catch (error) {
        console.error("Error en loginUsuario:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Logout de usuario
 */
const logoutUsuario = async (req, res) => {
    try {
        // Obtener token del header
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            // Invalidar token
            invalidarToken(token);
        }
        
        res.json({
            exito: true,
            mensaje: "Logout exitoso"
        });
        
    } catch (error) {
        console.error("Error en logoutUsuario:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Obtener perfil del usuario autenticado
 */
const obtenerPerfil = async (req, res) => {
    try {
        res.json({
            exito: true,
            mensaje: "Perfil obtenido exitosamente",
            data: {
                usuario: req.usuario.obtenerDatosPublicos()
            }
        });
    } catch (error) {
        console.error("Error en obtenerPerfil:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Actualizar perfil del usuario
 */
const actualizarPerfil = async (req, res) => {
    try {
        const { nombre, apellido, direccion, telefono } = req.body;
        
        const camposPermitidos = { nombre, apellido, direccion, telefono };
        
        Object.keys(camposPermitidos).forEach(key => {
            if (camposPermitidos[key] === undefined) {
                delete camposPermitidos[key];
            }
        });
        
        const usuarioActualizado = await ModeloUsuario.findOneAndUpdate(
            { usuario_id: req.usuario.usuario_id },
            camposPermitidos,
            { new: true, runValidators: true }
        );
        
        res.json({
            exito: true,
            mensaje: "Perfil actualizado exitosamente",
            data: {
                usuario: usuarioActualizado.obtenerDatosPublicos()
            }
        });
        
    } catch (error) {
        console.error("Error en actualizarPerfil:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Cambiar contraseña
 */
const cambiarContrasena = async (req, res) => {
    try {
        const { contrasena_actual, contrasena_nueva } = req.body;
        
        if (!contrasena_actual || !contrasena_nueva) {
            return res.status(400).json({
                exito: false,
                mensaje: "Contraseña actual y nueva son requeridas",
                codigo: "MISSING_PASSWORDS"
            });
        }
        
        const contrasenaValida = await req.usuario.compararContrasena(contrasena_actual);
        if (!contrasenaValida) {
            return res.status(401).json({
                exito: false,
                mensaje: "Contraseña actual incorrecta",
                codigo: "INVALID_CURRENT_PASSWORD"
            });
        }
        
        req.usuario.contrasena_hash = contrasena_nueva;
        await req.usuario.save();
        
        res.json({
            exito: true,
            mensaje: "Contraseña cambiada exitosamente"
        });
        
    } catch (error) {
        console.error("Error en cambiarContrasena:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

module.exports = {
    registrarUsuario,
    loginUsuario,
    logoutUsuario,
    obtenerPerfil,
    actualizarPerfil,
    cambiarContrasena
};