const express = require('express');
const router = express.Router();

// Middleware to check if user is authenticated (frontend session)
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        req.flash('error', 'Debes iniciar sesión para acceder a esta página');
        return res.redirect('/login');
    }
    next();
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.rol !== 'admin') {
        req.flash('error', 'Acceso denegado. Se requieren permisos de administrador.');
        return res.redirect('/');
    }
    next();
};

// ==========================================
// SESSION SYNC ROUTE (for JWT integration)
// ==========================================

router.post('/sync-session', express.json(), (req, res) => {
    if (req.body.user) {
        req.session.user = req.body.user;
        res.json({ success: true });
    } else {
        req.session.user = null;
        res.json({ success: false });
    }
});

router.post('/clear-session', (req, res) => {
    req.session.user = null;
    res.json({ success: true });
});

// ==========================================
// PUBLIC PAGES
// ==========================================

// Home page (handled in main index.js)
// router.get('/', ...) is already defined in index.js

// Auth pages
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('pages/auth/login', {
        title: 'Iniciar Sesión - ElBaul',
        page: 'login'
    });
});

router.get('/registro', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('pages/auth/register', {
        title: 'Registrarse - ElBaul',
        page: 'register'
    });
});

// Products pages
router.get('/productos', (req, res) => {
    res.render('pages/products/index', {
        title: 'Productos - ElBaul',
        page: 'products'
    });
});

router.get('/productos/:id', (req, res) => {
    res.render('pages/products/detail', {
        title: 'Detalle del Producto - ElBaul',
        page: 'product-detail',
        productId: req.params.id
    });
});

// Social features
router.get('/comunidad', (req, res) => {
    res.render('pages/social/feed', {
        title: 'Comunidad - ElBaul',
        page: 'social'
    });
});

// ==========================================
// PROTECTED PAGES (require authentication)
// ==========================================

// Cart pages
router.get('/carrito', requireAuth, (req, res) => {
    res.render('pages/cart/index', {
        title: 'Mi Carrito - ElBaul',
        page: 'cart'
    });
});

// Profile pages
router.get('/perfil', requireAuth, (req, res) => {
    res.render('pages/profile/index', {
        title: 'Mi Perfil - ElBaul',
        page: 'profile'
    });
});

router.get('/mis-ordenes', requireAuth, (req, res) => {
    res.render('pages/profile/orders', {
        title: 'Mis Órdenes - ElBaul',
        page: 'orders'
    });
});

router.get('/favoritos', requireAuth, (req, res) => {
    res.render('pages/profile/favorites', {
        title: 'Mis Favoritos - ElBaul',
        page: 'favorites'
    });
});

// ==========================================
// ADMIN PAGES (require admin role)
// ==========================================

router.get('/admin', requireAdmin, (req, res) => {
    res.render('admin/dashboard', {
        title: 'Panel de Administración - ElBaul',
        page: 'admin-dashboard'
    });
});

router.get('/admin/productos', requireAdmin, (req, res) => {
    res.render('admin/products', {
        title: 'Gestión de Productos - ElBaul',
        page: 'admin-products'
    });
});

router.get('/admin/categorias', requireAdmin, (req, res) => {
    res.render('admin/categories', {
        title: 'Gestión de Categorías - ElBaul',
        page: 'admin-categories'
    });
});

router.get('/admin/resenas', requireAdmin, (req, res) => {
    res.render('admin/reviews', {
        title: 'Gestión de Reseñas - ElBaul',
        page: 'admin-reviews'
    });
});

module.exports = router;