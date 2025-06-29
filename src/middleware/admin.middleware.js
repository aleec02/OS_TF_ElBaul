const { verificarAuth } = require("./auth.middleware");

/**
 * Middleware para verificar que el usuario sea admin
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

/**
 * Middleware combinado: verificar autenticación Y rol de admin
 */
const verificarAuthYAdmin = [verificarAuth, verificarAdmin];

module.exports = {
    verificarAdmin,
    verificarAuthYAdmin
};