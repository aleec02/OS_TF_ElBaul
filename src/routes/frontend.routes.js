const express = require('express');
const router = express.Router();

// Import frontend authentication middleware
const { 
    requireAuth, 
    requireAdmin, 
    redirectIfAuthenticated, 
    optionalAuth 
} = require('../middleware/frontend-auth.middleware');

// ==========================================
// SESSION SYNC ROUTES (for JWT integration)
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

// About page
router.get('/acerca', (req, res) => {
    res.render('pages/about', {
        title: 'Acerca de ElBaul',
        page: 'about'
    });
});

// Contact page
router.get('/contacto', (req, res) => {
    res.render('pages/contact', {
        title: 'Contacto - ElBaul',
        page: 'contact'
    });
});

// Terms and Privacy
router.get('/terminos', (req, res) => {
    res.render('pages/terms', {
        title: 'Términos y Condiciones - ElBaul',
        page: 'terms'
    });
});

router.get('/privacidad', (req, res) => {
    res.render('pages/privacy', {
        title: 'Política de Privacidad - ElBaul',
        page: 'privacy'
    });
});

// ==========================================
// AUTHENTICATION PAGES
// ==========================================

// Auth pages
router.get('/login', redirectIfAuthenticated, (req, res) => {
    res.render('pages/auth/login', {
        title: 'Iniciar Sesión - ElBaul',
        page: 'login'
    });
});

router.get('/registro', redirectIfAuthenticated, (req, res) => {
    res.render('pages/auth/register', {
        title: 'Registrarse - ElBaul',
        page: 'register'
    });
});

router.get('/recuperar-password', redirectIfAuthenticated, (req, res) => {
    res.render('pages/auth/forgot-password', {
        title: 'Recuperar Contraseña - ElBaul',
        page: 'forgot-password'
    });
});

router.get('/logout', (req, res) => {
    try {
        // Clear session if it exists
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying session:', err);
                }
            });
        }
        
        // Clear session cookie
        res.clearCookie('connect.sid');
        
        // Clear any flash messages to avoid session dependency
        try {
            if (req.flash) {
                req.flash('success', 'Sesión cerrada exitosamente');
            }
        } catch (flashError) {
            console.log('Flash not available, proceeding without flash message');
        }
        
        // Redirect to home
        res.redirect('/');
        
    } catch (error) {
        console.error('Error in logout route:', error);
        // Fallback: just redirect to home
        res.redirect('/');
    }
});

// ==========================================
// PRODUCT PAGES
// ==========================================

// Products listing page
router.get('/productos', (req, res) => {
    res.render('pages/products/index', {
        title: 'Productos - ElBaul',
        page: 'products'
    });
});

// Product detail page
router.get('/productos/:id', (req, res) => {
    res.render('pages/products/detail', {
        title: 'Detalle del Producto - ElBaul',
        page: 'product-detail',
        productId: req.params.id
    });
});

// Product search results
router.get('/buscar', (req, res) => {
    const query = req.query.q || '';
    res.render('pages/products/search', {
        title: `Buscar: ${query} - ElBaul`,
        page: 'search',
        searchQuery: query
    });
});

// Category products
router.get('/categoria/:id', (req, res) => {
    res.render('pages/products/category', {
        title: 'Productos por Categoría - ElBaul',
        page: 'category',
        categoryId: req.params.id
    });
});

// ==========================================
// SOCIAL FEATURES
// ==========================================

// Community/Social feed
router.get('/comunidad', (req, res) => {
    res.render('pages/social/feed', {
        title: 'Comunidad - ElBaul',
        page: 'social'
    });
});

// User profile (public view)
router.get('/usuario/:id', (req, res) => {
    res.render('pages/social/user-profile', {
        title: 'Perfil de Usuario - ElBaul',
        page: 'user-profile',
        userId: req.params.id
    });
});

// ==========================================
// PROTECTED PAGES (require authentication)
// ==========================================

// User Dashboard
router.get('/dashboard', requireAuth, (req, res) => {
    res.render('pages/user/dashboard', {
        title: 'Dashboard - ElBaul',
        page: 'dashboard'
    });
});

// Cart pages
router.get('/carrito', requireAuth, (req, res) => {
    res.render('pages/cart/index', {
        title: 'Mi Carrito - ElBaul',
        page: 'cart'
    });
});

router.get('/checkout', requireAuth, (req, res) => {
    res.render('pages/cart/checkout', {
        title: 'Checkout - ElBaul',
        page: 'checkout'
    });
});

// Profile pages
router.get('/perfil', requireAuth, (req, res) => {
    res.render('pages/profile/index', {
        title: 'Mi Perfil - ElBaul',
        page: 'profile'
    });
});

router.get('/perfil/editar', requireAuth, (req, res) => {
    res.render('pages/profile/edit', {
        title: 'Editar Perfil - ElBaul',
        page: 'profile-edit'
    });
});

router.get('/perfil/seguridad', requireAuth, (req, res) => {
    res.render('pages/profile/security', {
        title: 'Seguridad - ElBaul',
        page: 'profile-security'
    });
});

// Orders pages
router.get('/mis-ordenes', requireAuth, (req, res) => {
    res.render('pages/profile/orders', {
        title: 'Mis Órdenes - ElBaul',
        page: 'orders'
    });
});

router.get('/orden/:id', requireAuth, (req, res) => {
    res.render('pages/profile/order-detail', {
        title: 'Detalle de Orden - ElBaul',
        page: 'order-detail',
        orderId: req.params.id
    });
});

// Favorites page
router.get('/favoritos', requireAuth, (req, res) => {
    res.render('pages/profile/favorites', {
        title: 'Mis Favoritos - ElBaul',
        page: 'favorites'
    });
});

// Reviews pages
router.get('/mis-resenas', requireAuth, (req, res) => {
    res.render('pages/profile/reviews', {
        title: 'Mis Reseñas - ElBaul',
        page: 'reviews'
    });
});

// Shipping and Returns
router.get('/mis-envios', requireAuth, (req, res) => {
    res.render('pages/profile/shipping', {
        title: 'Mis Envíos - ElBaul',
        page: 'shipping'
    });
});

router.get('/envio/:id', requireAuth, (req, res) => {
    res.render('pages/profile/shipping-detail', {
        title: 'Detalle de Envío - ElBaul',
        page: 'shipping-detail',
        shipmentId: req.params.id
    });
});

router.get('/devoluciones', requireAuth, (req, res) => {
    res.render('pages/profile/returns', {
        title: 'Devoluciones - ElBaul',
        page: 'returns'
    });
});

router.get('/devolucion/:id', requireAuth, (req, res) => {
    res.render('pages/profile/return-detail', {
        title: 'Detalle de Devolución - ElBaul',
        page: 'return-detail',
        returnId: req.params.id
    });
});

// Notifications
router.get('/notificaciones', requireAuth, (req, res) => {
    res.render('pages/profile/notifications', {
        title: 'Notificaciones - ElBaul',
        page: 'notifications'
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

router.get('/admin/productos/crear', requireAdmin, (req, res) => {
    res.render('admin/products-create', {
        title: 'Crear Producto - ElBaul',
        page: 'admin-products-create'
    });
});

router.get('/admin/productos/:id/editar', requireAdmin, (req, res) => {
    res.render('admin/products-edit', {
        title: 'Editar Producto - ElBaul',
        page: 'admin-products-edit',
        productId: req.params.id
    });
});

router.get('/admin/categorias', requireAdmin, (req, res) => {
    res.render('admin/categories', {
        title: 'Gestión de Categorías - ElBaul',
        page: 'admin-categories'
    });
});

router.get('/admin/usuarios', requireAdmin, (req, res) => {
    res.render('admin/users', {
        title: 'Gestión de Usuarios - ElBaul',
        page: 'admin-users'
    });
});

router.get('/admin/ordenes', requireAdmin, (req, res) => {
    res.render('admin/orders', {
        title: 'Gestión de Órdenes - ElBaul',
        page: 'admin-orders'
    });
});

router.get('/admin/resenas', requireAdmin, (req, res) => {
    res.render('admin/reviews', {
        title: 'Gestión de Reseñas - ElBaul',
        page: 'admin-reviews'
    });
});

router.get('/admin/reportes', requireAdmin, (req, res) => {
    res.render('admin/reports', {
        title: 'Reportes - ElBaul',
        page: 'admin-reports'
    });
});

router.get('/admin/configuracion', requireAdmin, (req, res) => {
    res.render('admin/settings', {
        title: 'Configuración - ElBaul',
        page: 'admin-settings'
    });
});

// ==========================================
// HELP AND SUPPORT PAGES
// ==========================================

router.get('/ayuda', (req, res) => {
    res.render('pages/help/index', {
        title: 'Centro de Ayuda - ElBaul',
        page: 'help'
    });
});

router.get('/ayuda/faq', (req, res) => {
    res.render('pages/help/faq', {
        title: 'Preguntas Frecuentes - ElBaul',
        page: 'help-faq'
    });
});

router.get('/ayuda/guias', (req, res) => {
    res.render('pages/help/guides', {
        title: 'Guías de Usuario - ElBaul',
        page: 'help-guides'
    });
});

router.get('/soporte', requireAuth, (req, res) => {
    res.render('pages/help/support', {
        title: 'Soporte Técnico - ElBaul',
        page: 'support'
    });
});

// ==========================================
// TEST AND DEBUG ROUTES
// ==========================================

// Test routes (remove in production)
router.get('/test/productos', (req, res) => {
    res.render('pages/products/simple-test', {
        title: 'Products Test - ElBaul',
        page: 'products-test'
    });
});

router.get('/test/basic', (req, res) => {
    res.render('pages/products/basic-test', {
        title: 'Basic Test - ElBaul',
        page: 'basic-test'
    });
});

router.get('/test/standalone', (req, res) => {
    res.render('pages/products/standalone', {
        title: 'Products Standalone - ElBaul',
        page: 'products-standalone'
    });
});

// Debug route for API testing
router.get('/debug-api', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Quick API Debug</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body>
            <div class="container py-4">
                <h1>Quick API Debug</h1>
                <div class="row">
                    <div class="col-md-6">
                        <h3>API Tests</h3>
                        <div id="results"></div>
                    </div>
                    <div class="col-md-6">
                        <h3>Raw Response</h3>
                        <pre id="raw-response" style="background: #f8f9fa; padding: 1rem; border-radius: 0.5rem; max-height: 400px; overflow-y: auto;"></pre>
                    </div>
                </div>
            </div>
            <script>
                async function testAPI() {
                    const results = document.getElementById('results');
                    const rawDiv = document.getElementById('raw-response');
                    results.innerHTML = '<div class="spinner-border"></div> Testing...';
                    
                    try {
                        // Test products API
                        const response = await fetch('/api/productos');
                        const data = await response.json();
                        
                        rawDiv.textContent = JSON.stringify(data, null, 2);
                        
                        if (response.ok && data.exito) {
                            const count = data.data.productos ? data.data.productos.length : 0;
                            results.innerHTML = \`
                                <div class="alert alert-success">
                                    ✅ Products API OK: Found \${count} products
                                </div>
                                <div class="alert alert-info">
                                    📊 Total: \${data.data.paginacion?.total || 0}
                                </div>
                            \`;
                        } else {
                            results.innerHTML = \`
                                <div class="alert alert-warning">
                                    ⚠️ API Response: \${data.mensaje || 'Unknown error'}
                                </div>
                            \`;
                        }
                    } catch (error) {
                        results.innerHTML = \`
                            <div class="alert alert-danger">
                                ❌ Error: \${error.message}
                            </div>
                        \`;
                    }
                }
                
                document.addEventListener('DOMContentLoaded', testAPI);
            </script>
        </body>
        </html>
    `);
});

// Debug route for product detail testing
router.get('/debug-product/:id', (req, res) => {
    const productId = req.params.id;
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Product Debug - ${productId}</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body>
            <div class="container py-4">
                <h1>Product Debug: ${productId}</h1>
                <div id="results"></div>
            </div>
            <script>
                async function testProductAPI() {
                    const results = document.getElementById('results');
                    results.innerHTML = '<div class="spinner-border"></div> Testing product API...';
                    
                    try {
                        const response = await fetch('/api/productos/${productId}');
                        const data = await response.json();
                        
                        if (response.ok && data.exito) {
                            const product = data.data.producto;
                            results.innerHTML = \`
                                <div class="alert alert-success">
                                     Product found: \${product.titulo}
                                </div>
                                <div class="card">
                                    <div class="card-body">
                                        <h5>\${product.titulo}</h5>
                                        <p>\${product.descripcion}</p>
                                        <p><strong>Price:</strong> S/ \${product.precio}</p>
                                        <p><strong>Status:</strong> \${product.estado}</p>
                                        <p><strong>Stock:</strong> \${product.stock}</p>
                                    </div>
                                </div>
                                <details class="mt-3">
                                    <summary>Full Response</summary>
                                    <pre>\${JSON.stringify(data, null, 2)}</pre>
                                </details>
                            \`;
                        } else {
                            results.innerHTML = \`
                                <div class="alert alert-danger">
                                     Error: \${data.mensaje || 'Product not found'}
                                </div>
                            \`;
                        }
                    } catch (error) {
                        results.innerHTML = \`
                            <div class="alert alert-danger">
                                 Network Error: \${error.message}
                            </div>
                        \`;
                    }
                }
                
                document.addEventListener('DOMContentLoaded', testProductAPI);
            </script>
        </body>
        </html>
    `);
});

module.exports = router;