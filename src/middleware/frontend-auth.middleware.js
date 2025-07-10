const { verificarToken } = require("../utils/jwt.util");
const ModeloUsuario = require("../models/usuario.model");

/**
 * Middleware para verificar autenticación en frontend (EJS routes)
 * Funciona con JWT tokens y Express sessions
 */
const requireAuth = async (req, res, next) => {
    try {
        let user = null;
        
        // First check Express session
        if (req.session && req.session.user) {
            user = req.session.user;
        } else {
            // Check JWT token from Authorization header
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith("Bearer ")) {
                const token = authHeader.substring(7);
                const decoded = verificarToken(token);
                
                const usuario = await ModeloUsuario.findOne({ 
                    usuario_id: decoded.usuario_id,
                    estado: true 
                });
                
                if (usuario) {
                    user = usuario.obtenerDatosPublicos();
                    // Sync with session
                    req.session.user = user;
                }
            }
        }
        
        if (!user) {
            req.flash('error', 'Debes iniciar sesión para acceder a esta página');
            return res.redirect('/login');
        }
        
        // Add user to request
        req.user = user;
        res.locals.user = user;
        
        next();
    } catch (error) {
        console.error('Frontend auth error:', error);
        req.flash('error', 'Error de autenticación. Por favor, inicia sesión nuevamente.');
        return res.redirect('/login');
    }
};

/**
 * Middleware para verificar rol de administrador en frontend
 */
const requireAdmin = async (req, res, next) => {
    try {
        // First ensure user is authenticated
        await requireAuth(req, res, (err) => {
            if (err) return next(err);
        });
        
        // Then check admin role
        if (req.user.rol !== "admin") {
            req.flash('error', 'Acceso denegado. Se requieren permisos de administrador.');
            return res.redirect('/');
        }
        
        next();
    } catch (error) {
        console.error('Frontend admin auth error:', error);
        req.flash('error', 'Error de autenticación.');
        return res.redirect('/login');
    }
};

/**
 * Middleware para redirigir usuarios autenticados
 * (usado en login/register pages)
 */
const redirectIfAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return res.redirect('/');
    }
    next();
};

/**
 * Middleware para verificar autenticación opcional
 * (no redirige, solo agrega user a locals si existe)
 */
const optionalAuth = async (req, res, next) => {
    try {
        let user = null;
        
        // Check Express session
        if (req.session && req.session.user) {
            user = req.session.user;
        } else {
            // Check JWT token
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith("Bearer ")) {
                const token = authHeader.substring(7);
                const decoded = verificarToken(token);
                
                const usuario = await ModeloUsuario.findOne({ 
                    usuario_id: decoded.usuario_id,
                    estado: true 
                });
                
                if (usuario) {
                    user = usuario.obtenerDatosPublicos();
                    req.session.user = user;
                }
            }
        }
        
        // Add user to locals (even if null)
        res.locals.user = user;
        req.user = user;
        
        next();
    } catch (error) {
        console.error('Optional auth error:', error);
        res.locals.user = null;
        req.user = null;
        next();
    }
};

module.exports = {
    requireAuth,
    requireAdmin,
    redirectIfAuthenticated,
    optionalAuth
}; 