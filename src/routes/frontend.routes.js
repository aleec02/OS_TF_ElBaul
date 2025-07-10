const express = require("express");
const router = express.Router();

// Simple middleware to check if user is in session
const verificarAuthFrontend = (req, res, next) => {
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

// Home page
router.get("/", (req, res) => {
    res.render('pages/home', {
        title: 'ElBaul - Productos de Segunda Mano',
        page: 'home'
    });
});

// Auth pages
router.get("/login", (req, res) => {
    res.render('pages/auth/login', {
        title: 'Iniciar Sesión - ElBaul',
        page: 'login'
    });
});

router.get("/registro", (req, res) => {
    res.render('pages/auth/register', {
        title: 'Registrarse - ElBaul',
        page: 'register'
    });
});

// Products pages
router.get("/productos", (req, res) => {
    res.render('pages/products/index', {
        title: 'Productos - ElBaul',
        page: 'products'
    });
});

router.get("/productos/:id", (req, res) => {
    res.render('pages/products/detail', {
        title: 'Detalle del Producto - ElBaul',
        page: 'product-detail',
        productId: req.params.id
    });
});

// Detalle de publicación
router.get("/publicaciones/:id", (req, res) => {
    res.render('pages/social/post-detail', {
        title: 'Publicación - ElBaul',
        page: 'post-detail',
        postId: req.params.id
    });
});

router.get("/buscar", (req, res) => {
    res.render('pages/products/index', {
        title: 'Buscar Productos - ElBaul',
        page: 'search',
        searchQuery: req.query.q || ''
    });
});

// User protected pages (require authentication)
router.get("/dashboard", verificarAuthFrontend, (req, res) => {
    res.render('pages/user/dashboard', {
        title: 'Dashboard - ElBaul',
        page: 'dashboard'
    });
});

router.get("/perfil", verificarAuthFrontend, (req, res) => {
    res.render('pages/profile/index', {
        title: 'Mi Perfil - ElBaul',
        page: 'profile'
    });
});

router.get("/favoritos", verificarAuthFrontend, (req, res) => {
    res.render('pages/profile/favorites', {
        title: 'Mis Favoritos - ElBaul',
        page: 'favorites'
    });
});

router.get("/carrito", verificarAuthFrontend, (req, res) => {
    res.render('pages/cart/index', {
        title: 'Mi Carrito - ElBaul',
        page: 'cart'
    });
});

router.get("/ordenes", verificarAuthFrontend, (req, res) => {
    res.render('pages/profile/orders', {
        title: 'Mis Órdenes - ElBaul',
        page: 'orders'
    });
});

router.get("/checkout", verificarAuthFrontend, (req, res) => {
    res.render('pages/checkout/index', {
        title: 'Checkout - ElBaul',
        page: 'checkout'
    });
});

// Social pages (comunidad) 
router.get("/comunidad", (req, res) => {
    res.render('pages/social/feed', {
        title: 'Comunidad - ElBaul',
        page: 'comunidad'
    });
});

router.get("/usuario/:id", (req, res) => {
    res.render('pages/social/user-profile', {
        title: 'Perfil de Usuario - ElBaul',
        page: 'user-profile',
        userId: req.params.id
    });
});

module.exports = router;