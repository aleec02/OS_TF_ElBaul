const { verificarToken } = require("../utils/jwt.util");
const ModeloUsuario = require("../models/usuario.model");

/**
 * Middleware para verificar autenticación
 */
const verificarAuth = async (req, res, next) => {
    try {
        // Obtener token del header Authorization
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                exito: false,
                mensaje: "Token no proporcionado",
                codigo: "NO_TOKEN"
            });
        }
        
        // Verificar formato Bearer
        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                exito: false,
                mensaje: "Formato de token inválido. Use Bearer <token>",
                codigo: "INVALID_TOKEN_FORMAT"
            });
        }
        
        // Extraer token
        const token = authHeader.substring(7);
        
        // Verificar token
        const decoded = verificarToken(token);
        
        // Buscar usuario en la base de datos
        const usuario = await ModeloUsuario.findOne({ 
            usuario_id: decoded.usuario_id,
            estado: true 
        });
        
        if (!usuario) {
            return res.status(401).json({
                exito: false,
                mensaje: "Usuario no encontrado o inactivo",
                codigo: "USER_NOT_FOUND"
            });
        }
        
        // Agregar usuario a req para uso en controladores
        req.usuario = usuario;
        
        next();
    } catch (error) {
        return res.status(401).json({
            exito: false,
            mensaje: "Token inválido o expirado",
            codigo: "INVALID_TOKEN",
            error: error.message
        });
    }
};

/**
 * Middleware para verificar rol de administrador
 */
const verificarAdmin = (req, res, next) => {
    if (req.usuario.rol !== "admin") {
        return res.status(403).json({
            exito: false,
            mensaje: "Acceso denegado. Se requieren permisos de administrador",
            codigo: "ACCESS_DENIED"
        });
    }
    next();
};

module.exports = {
    verificarAuth,
    verificarAdmin
};