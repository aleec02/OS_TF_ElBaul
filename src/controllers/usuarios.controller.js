const ModeloUsuario = require("../models/usuario.model");
const { generarToken } = require("../utils/jwt.util");

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
        
        // Verificar si el email ya existe
        const usuarioExistente = await ModeloUsuario.findOne({ email });
        if (usuarioExistente) {
            return res.status(400).json({
                exito: false,
                mensaje: "El email ya está registrado",
                codigo: "EMAIL_EXISTS"
            });
        }
        
        // Crear nuevo usuario
        const nuevoUsuario = new ModeloUsuario({
            nombre,
            apellido,
            email,
            contrasena_hash: contrasena, // Se hashea automáticamente en el modelo
            direccion,
            telefono
        });
        
        // Guardar usuario
        await nuevoUsuario.save();
        
        // Generar token
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
 * login de usuario
 */
const loginUsuario = async (req, res) => {
    try {
        const { email, contrasena } = req.body;
        
        // Validar campos requeridos
        if (!email || !contrasena) {
            return res.status(400).json({
                exito: false,
                mensaje: "Email y contraseña son requeridos",
                codigo: "MISSING_CREDENTIALS"
            });
        }
        
        // Buscar usuario por email
        const usuario = await ModeloUsuario.findOne({ email, estado: true });
        if (!usuario) {
            return res.status(401).json({
                exito: false,
                mensaje: "Credenciales inválidas",
                codigo: "INVALID_CREDENTIALS"
            });
        }
        
        // Verificar contraseña
        const contrasenaValida = await usuario.compararContrasena(contrasena);
        if (!contrasenaValida) {
            return res.status(401).json({
                exito: false,
                mensaje: "Credenciales inválidas",
                codigo: "INVALID_CREDENTIALS"
            });
        }
        
        // Generar token
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
        
        // Campos permitidos para actualizar
        const camposPermitidos = { nombre, apellido, direccion, telefono };
        
        // Remover campos undefined
        Object.keys(camposPermitidos).forEach(key => {
            if (camposPermitidos[key] === undefined) {
                delete camposPermitidos[key];
            }
        });
        
        // Actualizar usuario
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


const cambiarContrasena = async (req, res) => {
    try {
        const { contrasena_actual, contrasena_nueva } = req.body;
        
        // Validar campos requeridos
        if (!contrasena_actual || !contrasena_nueva) {
            return res.status(400).json({
                exito: false,
                mensaje: "Contraseña actual y nueva son requeridas",
                codigo: "MISSING_PASSWORDS"
            });
        }
        
        // Verificar contraseña actual
        const contrasenaValida = await req.usuario.compararContrasena(contrasena_actual);
        if (!contrasenaValida) {
            return res.status(401).json({
                exito: false,
                mensaje: "Contraseña actual incorrecta",
                codigo: "INVALID_CURRENT_PASSWORD"
            });
        }
        
        // Actualizar contraseña
        req.usuario.contrasena_hash = contrasena_nueva; // hasheo automático al tq
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
    obtenerPerfil,
    actualizarPerfil,
    cambiarContrasena
};