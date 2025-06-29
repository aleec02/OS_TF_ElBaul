const { verificarAuth } = require("./auth.middleware");



const verificarAuthYAdmin = [
    verificarAuth,  // Primero verificar que esté autenticado
    (req, res, next) => {
        if (req.usuario.rol !== "admin") {
            return res.status(403).json({
                exito: false,
                mensaje: "Acceso denegado. Se requieren permisos de administrador",
                codigo: "ACCESS_DENIED"
            });
        }
        next();
    }
];

module.exports = {
    verificarAuthYAdmin
};