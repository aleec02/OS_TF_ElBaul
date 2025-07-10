// Frontend authentication middleware
// This checks if user is logged in via session for page rendering

const verificarAuthFrontend = (req, res, next) => {
    // Check if user exists in session (synced from frontend)
    if (req.session && req.session.user) {
        req.usuario = req.session.user;
        return next();
    }
    
    // If no session, redirect to login with return URL
    const returnUrl = encodeURIComponent(req.originalUrl);
    return res.redirect(`/login?return=${returnUrl}`);
};

// Optional auth - doesn't redirect but sets user if available
const verificarAuthOpcional = (req, res, next) => {
    if (req.session && req.session.user) {
        req.usuario = req.session.user;
    }
    next();
};

module.exports = {
    verificarAuthFrontend,
    verificarAuthOpcional
};