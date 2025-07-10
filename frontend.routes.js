const express = require("express");
const router = express.Router();
const { verificarAuth, verificarAuthFrontend } = require("../middleware/frontend-auth.middleware");

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

// Social pages
router.get("/social", (req, res) => {
    res.render('pages/social/feed', {
        title: 'Red Social - ElBaul',
        page: 'social'
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