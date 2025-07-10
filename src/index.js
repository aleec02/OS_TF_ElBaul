require('dotenv').config();

const express = require("express");
const cors = require("cors");
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const expressLayouts = require('express-ejs-layouts'); 

const app = express();

require("./config/database");

// EJS Configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// EJS Layouts Configuration
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Session configuration (for frontend user state only)
app.use(session({
    secret: process.env.SESSION_SECRET || 'elbaul-frontend-secret-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true
    },
    name: 'connect.sid'
}));

app.use(flash());

// Global variables for templates with error handling
app.use((req, res, next) => {
    try {
        res.locals.success_messages = req.flash ? req.flash('success') : [];
        res.locals.error_messages = req.flash ? req.flash('error') : [];
        res.locals.user = req.session && req.session.user ? req.session.user : null;
        res.locals.currentPath = req.path;
    } catch (error) {
        console.error('Error setting template locals:', error);
        res.locals.success_messages = [];
        res.locals.error_messages = [];
        res.locals.user = null;
        res.locals.currentPath = req.path;
    }
    next();
});

app.use(cors());
app.use(express.json());

// Endpoint to sync user session from frontend
app.post('/sync-session', (req, res) => {
    try {
        const { user } = req.body;
        if (user && req.session) {
            req.session.user = user;
            res.json({ success: true });
        } else if (req.session) {
            req.session.user = null;
            res.json({ success: true });
        } else {
            res.json({ success: false, error: 'Session not available' });
        }
    } catch (error) {
        console.error('Error syncing session:', error);
        res.json({ success: false, error: error.message });
    }
});

// Endpoint to clear session
app.post('/clear-session', (req, res) => {
    try {
        if (req.session) {
            req.session.user = null;
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing session:', error);
        res.json({ success: false, error: error.message });
    }
});

// Rutas básicas
app.get("/", (req, res) => {
    res.render('pages/home', {
        title: 'ElBaul - Productos de Segunda Mano',
        page: 'home'
    });
});

app.get("/api", (req, res) => {
    res.json({
        nombre: "ElBaul API",
        version: "1.0.0",
        endpoints_disponibles: {
            principal: "GET /",
            health: "GET /api/health",
            
            // Endpoints públicos
            categorias: "GET /api/categorias",
            categoria_detalle: "GET /api/categorias/:id",
            productos: "GET /api/productos",
            producto_detalle: "GET /api/productos/:id",
            buscar_productos: "GET /api/productos/buscar?q=termino",
            rastrear_envio: "GET /api/envios/rastrear/:numero_seguimiento",
            resenas_producto: "GET /api/productos/:id/resenas",

            // Autenticación
            registro: "POST /api/usuarios/registro",
            login: "POST /api/usuarios/login",
            perfil: "GET /api/usuarios/perfil",
            
            // Carrito (requiere auth)
            carrito: "GET /api/carrito",
            agregar_carrito: "POST /api/carrito/items",
            
            // Favoritos (requiere auth)
            favoritos: "GET /api/favoritos",
            agregar_favorito: "POST /api/favoritos",

            // Órdenes (requiere auth)
            checkout: "POST /api/ordenes/checkout",
            mis_ordenes: "GET /api/ordenes",
            detalle_orden: "GET /api/ordenes/:id",
            cancelar_orden: "PUT /api/ordenes/:id/cancelar",

            // Envíos (requiere auth)
            mis_envios: "GET /api/envios",
            detalle_envio: "GET /api/envios/:id",

            // Devoluciones (requiere auth)
            solicitar_devolucion: "POST /api/devoluciones",
            mis_devoluciones: "GET /api/devoluciones",
            detalle_devolucion: "GET /api/devoluciones/:id",

            // Reseñas (requiere auth)
            crear_resena: "POST /api/productos/:id/resenas",
            mi_resena: "GET /api/productos/:id/resenas/mi-resena",
            eliminar_mi_resena: "DELETE /api/productos/:id/resenas/mi-resena",

            // Publicaciones (mixto público/privado)
            feed_publicaciones: "GET /api/publicaciones",
            detalle_publicacion: "GET /api/publicaciones/:id",
            crear_publicacion: "POST /api/publicaciones",
            editar_publicacion: "PUT /api/publicaciones/:id",
            eliminar_publicacion: "DELETE /api/publicaciones/:id",

            // Comentarios en publicaciones
            comentarios_publicacion: "GET /api/publicaciones/:id/comentarios",
            crear_comentario: "POST /api/publicaciones/:id/comentarios",
            editar_comentario: "PUT /api/comentarios/:id",
            eliminar_comentario: "DELETE /api/comentarios/:id",

            // Reacciones
            reacciones_publicacion: "GET /api/publicaciones/:id/reacciones",
            reaccionar_publicacion: "POST /api/publicaciones/:id/reacciones",
            reacciones_comentario: "GET /api/comentarios/:id/reacciones",
            reaccionar_comentario: "POST /api/comentarios/:id/reacciones",

            // Panel de administración
            admin_panel: "GET /api/admin",
            admin_productos: "GET /api/admin/productos",
            admin_categorias: "GET /api/admin/categorias",

            // Admin reseñas
            admin_resenas: "GET /api/admin/resenas",
            admin_aprobar_resena: "PUT /api/admin/resenas/:id/aprobar",
            admin_eliminar_resena: "DELETE /api/admin/resenas/:id",

        },
        estado: "Round 1 - Frontend integrado con EJS"
    });
});

app.get("/api/health", (req, res) => {
    const tiempoActividad = process.uptime();
    const usoMemoria = process.memoryUsage();
    
    res.json({
        estado: "OK",
        timestamp: new Date().toISOString(),
        entorno: process.env.NODE_ENV || "development",
        version: "1.0.0",
        tiempo_actividad: Math.floor(tiempoActividad / 60) + " minutos",
        uso_memoria: {
            rss: Math.round(usoMemoria.rss / 1024 / 1024) + " MB",
            heap_usado: Math.round(usoMemoria.heapUsed / 1024 / 1024) + " MB"
        },
        bd_estado: "Conectado",
        frontend: "EJS integrado"
    });
});

// ========================================
// RUTAS PÚBLICAS (sin autenticación)
// ========================================
app.use("/api/categorias", require("./routes/categorias.routes"));
app.use("/api/productos", require("./routes/productos.routes"));
app.use("/api/publicaciones", require("./routes/publicaciones.routes"));  // <-- ESTA LÍNEA DEBE EXISTIR

// ========================================
// RUTAS DE USUARIOS (con autenticación)
// ========================================
app.use("/api/usuarios", require("./routes/usuarios.routes"));
app.use("/api/carrito", require("./routes/carrito.routes"));
app.use("/api/favoritos", require("./routes/favoritos.routes"));
app.use("/api/ordenes", require("./routes/ordenes.routes"));
app.use("/api/envios", require("./routes/envios.routes"));
app.use("/api/devoluciones", require("./routes/devoluciones.routes"));
app.use("/api/comentarios", require("./routes/comentarios.routes"));
app.use("/api/reacciones", require("./routes/reacciones.routes"));


// ========================================
// RUTAS DE ADMINISTRACIÓN (solo admin)
// ========================================
app.use("/api/admin", require("./routes/admin/index.routes"));
app.use("/api/admin/productos", require("./routes/admin/productos.routes"));
app.use("/api/admin/categorias", require("./routes/admin/categorias.routes"));
app.use("/api/admin/resenas", require("./routes/admin/resenas.routes"));

// ========================================
// FRONTEND ROUTES (NEW)
// ========================================
app.use('/', require('./routes/frontend.routes'));

// Error handling middleware
app.use((req, res, next) => {
    res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>404 - Página no encontrada</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body>
            <div class="container mt-5 text-center">
                <h1>404 - Página no encontrada</h1>
                <p>La página que buscas no existe.</p>
                <a href="/" class="btn btn-primary">Volver al inicio</a>
            </div>
        </body>
        </html>
    `);
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>500 - Error del servidor</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body>
            <div class="container mt-5 text-center">
                <h1>500 - Error del servidor</h1>
                <p>Algo salió mal. Por favor, intenta de nuevo más tarde.</p>
                <a href="/" class="btn btn-primary">Volver al inicio</a>
            </div>
        </body>
        </html>
    `);
});

// Puerto del Servicio Web
const puerto = process.env.PORT || 3000;

// Improved server startup with error handling
const server = app.listen(puerto, () => {
    console.log("✅ Server ElBaul started successfully on port", puerto);
    console.log(`🌐 Frontend: http://localhost:${puerto}`);
    console.log(`🔌 API: http://localhost:${puerto}/api`);
    console.log(`📊 Health Check: http://localhost:${puerto}/api/health`);
}).on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${puerto} is already in use!`);
        console.error('💡 Try one of these solutions:');
        console.error('   1. Kill the process using the port:');
        console.error(`      netstat -ano | findstr :${puerto}`);
        console.error(`      taskkill /PID <PID> /F`);
        console.error('   2. Use a different port:');
        console.error(`      set PORT=3001 && npm run dev`);
        console.error('   3. Wait a moment and try again');
        process.exit(1);
    } else {
        console.error('❌ Server startup error:', error);
        process.exit(1);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});