const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin, redirectIfAuthenticated, optionalAuth } = require('../middleware/frontend-auth.middleware');

// ========================================
// RUTAS PÚBLICAS (sin autenticación)
// ========================================

// Página de inicio
router.get('/', (req, res) => {
    res.render('pages/home', {
        title: 'ElBaul - Marketplace de Segunda Mano',
        page: 'home'
    });
});

// Página de productos
router.get('/productos', optionalAuth, (req, res) => {
    res.render('pages/products/index', {
        title: 'Productos - ElBaul',
        page: 'products'
    });
});

// Detalle de producto
router.get('/productos/:id', optionalAuth, (req, res) => {
    res.render('pages/products/detail', {
        title: 'Detalle de Producto - ElBaul',
        page: 'product-detail',
        productId: req.params.id
    });
});

// Página de categorías
router.get('/categorias', (req, res) => {
    res.render('pages/categories/index', {
        title: 'Categorías - ElBaul',
        page: 'categories'
    });
});

// Página de categoría específica
router.get('/categorias/:id', optionalAuth, (req, res) => {
    res.render('pages/categories/detail', {
        title: 'Categoría - ElBaul',
        page: 'category-detail',
        categoryId: req.params.id
    });
});

// ========================================
// RUTAS DE AUTENTICACIÓN
// ========================================

// Login
router.get('/login', redirectIfAuthenticated, (req, res) => {
    res.render('pages/auth/login', {
        title: 'Iniciar Sesión - ElBaul',
        page: 'login'
    });
});

// Registro
router.get('/register', redirectIfAuthenticated, (req, res) => {
    res.render('pages/auth/register', {
        title: 'Registrarse - ElBaul',
        page: 'register'
    });
});

// ========================================
// RUTAS PRIVADAS (requiere autenticación)
// ========================================

// Dashboard del usuario
router.get('/dashboard', requireAuth, (req, res) => {
    res.render('pages/user/dashboard', {
        title: 'Mi Dashboard - ElBaul',
        page: 'dashboard'
    });
});

// Perfil del usuario
router.get('/perfil', requireAuth, (req, res) => {
    res.render('pages/profile/index', {
        title: 'Mi Perfil - ElBaul',
        page: 'profile'
    });
});

// Favoritos del usuario
router.get('/favoritos', requireAuth, (req, res) => {
    res.render('pages/profile/favorites', {
        title: 'Mis Favoritos - ElBaul',
        page: 'favorites'
    });
});

// Carrito del usuario
router.get('/carrito', requireAuth, (req, res) => {
    res.render('pages/cart/index', {
        title: 'Mi Carrito - ElBaul',
        page: 'cart'
    });
});

// Historial de órdenes
router.get('/ordenes', requireAuth, (req, res) => {
    res.render('pages/orders/index', {
        title: 'Mis Órdenes - ElBaul',
        page: 'orders'
    });
});

// Detalle de orden
router.get('/ordenes/:id', requireAuth, (req, res) => {
    res.render('pages/orders/detail', {
        title: 'Detalle de Orden - ElBaul',
        page: 'order-detail',
        orderId: req.params.id
    });
});

// ========================================
// RUTAS SOCIALES
// ========================================

// Feed social (público)
router.get('/social', optionalAuth, (req, res) => {
    res.render('pages/social/feed', {
        title: 'Feed Social - ElBaul',
        page: 'social-feed'
    });
});

// Detalle de publicación (público)
router.get('/social/post/:id', optionalAuth, (req, res) => {
    res.render('pages/social/post-detail', {
        title: 'Publicación - ElBaul',
        page: 'post-detail',
        postId: req.params.id
    });
});

// Perfil de usuario (público)
router.get('/social/usuario/:id', optionalAuth, (req, res) => {
    res.render('pages/social/user-profile', {
        title: 'Perfil de Usuario - ElBaul',
        page: 'user-profile',
        userId: req.params.id
    });
});

// ========================================
// RUTAS DE ADMINISTRACIÓN
// ========================================

// Panel de administración
router.get('/admin', requireAdmin, (req, res) => {
    res.render('pages/admin/dashboard', {
        title: 'Panel de Administración - ElBaul',
        page: 'admin-dashboard'
    });
});

// Gestión de productos (admin)
router.get('/admin/productos', requireAdmin, (req, res) => {
    res.render('pages/admin/products', {
        title: 'Gestión de Productos - ElBaul',
        page: 'admin-products'
    });
});

// Gestión de categorías (admin)
router.get('/admin/categorias', requireAdmin, (req, res) => {
    res.render('pages/admin/categories', {
        title: 'Gestión de Categorías - ElBaul',
        page: 'admin-categories'
    });
});

// Gestión de reseñas (admin)
router.get('/admin/resenas', requireAdmin, (req, res) => {
    res.render('pages/admin/reviews', {
        title: 'Gestión de Reseñas - ElBaul',
        page: 'admin-reviews'
    });
});

// Gestión de usuarios (admin)
router.get('/admin/usuarios', requireAdmin, (req, res) => {
    res.render('pages/admin/users', {
        title: 'Gestión de Usuarios - ElBaul',
        page: 'admin-users'
    });
});

// ========================================
// RUTAS DE BÚSQUEDA Y EXPLORACIÓN
// ========================================

// Búsqueda de productos
router.get('/buscar', optionalAuth, (req, res) => {
    const query = req.query.q || '';
    res.render('pages/search/results', {
        title: `Búsqueda: ${query} - ElBaul`,
        page: 'search',
        searchQuery: query
    });
});

// Página de ofertas
router.get('/ofertas', optionalAuth, (req, res) => {
    res.render('pages/deals/index', {
        title: 'Ofertas Especiales - ElBaul',
        page: 'deals'
    });
});

// Página de productos nuevos
router.get('/nuevos', optionalAuth, (req, res) => {
    res.render('pages/products/new', {
        title: 'Productos Nuevos - ElBaul',
        page: 'new-products'
    });
});

// Página de productos populares
router.get('/populares', optionalAuth, (req, res) => {
    res.render('pages/products/popular', {
        title: 'Productos Populares - ElBaul',
        page: 'popular-products'
    });
});

// ========================================
// RUTAS DE INFORMACIÓN Y AYUDA
// ========================================

// Acerca de nosotros
router.get('/acerca-de', (req, res) => {
    res.render('pages/info/about', {
        title: 'Acerca de ElBaul',
        page: 'about'
    });
});

// Política de privacidad
router.get('/privacidad', (req, res) => {
    res.render('pages/info/privacy', {
        title: 'Política de Privacidad - ElBaul',
        page: 'privacy'
    });
});

// Términos y condiciones
router.get('/terminos', (req, res) => {
    res.render('pages/info/terms', {
        title: 'Términos y Condiciones - ElBaul',
        page: 'terms'
    });
});

// Página de contacto
router.get('/contacto', (req, res) => {
    res.render('pages/info/contact', {
        title: 'Contacto - ElBaul',
        page: 'contact'
    });
});

// Página de ayuda
router.get('/ayuda', (req, res) => {
    res.render('pages/info/help', {
        title: 'Centro de Ayuda - ElBaul',
        page: 'help'
    });
});

// ========================================
// RUTAS DE ERRORES
// ========================================

// Página 404 personalizada
router.get('/404', (req, res) => {
    res.status(404).render('pages/errors/404', {
        title: 'Página no encontrada - ElBaul',
        page: 'error-404'
    });
});

// Página 500 personalizada
router.get('/500', (req, res) => {
    res.status(500).render('pages/errors/500', {
        title: 'Error del servidor - ElBaul',
        page: 'error-500'
    });
});

// ========================================
// RUTAS DE UTILIDADES
// ========================================

// Página de mantenimiento
router.get('/mantenimiento', (req, res) => {
    res.render('pages/maintenance', {
        title: 'Sitio en Mantenimiento - ElBaul',
        page: 'maintenance'
    });
});

// Página de construcción
router.get('/en-construccion', (req, res) => {
    res.render('pages/construction', {
        title: 'Página en Construcción - ElBaul',
        page: 'construction'
    });
});

module.exports = router;