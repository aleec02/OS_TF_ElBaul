require('dotenv').config();

const express = require("express");
const cors = require("cors");

const app = express();

require("./config/database");

app.use(cors());
app.use(express.json());

// Rutas básicas
app.get("/", (req, res) => {
    res.json({
        mensaje: "Bienvenido a ElBaul API",
        version: "1.0.0",
        estado: "Operativo",
        descripcion: "E-commerce de productos de segunda mano",
        entorno: process.env.NODE_ENV || "development"
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


            // Panel de administración
            admin_panel: "GET /api/admin",
            admin_productos: "GET /api/admin/productos",
            admin_categorias: "GET /api/admin/categorias",

            // Admin reseñas
            admin_resenas: "GET /api/admin/resenas",
            admin_aprobar_resena: "PUT /api/admin/resenas/:id/aprobar",
            admin_eliminar_resena: "DELETE /api/admin/resenas/:id",

        },
        estado: "Round 7 - Sistema de reseñas implementado"
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
        bd_estado: "Conectado"
    });
});

// ========================================
// RUTAS PÚBLICAS (sin autenticación)
// ========================================
app.use("/api/categorias", require("./routes/categorias.routes"));
app.use("/api/productos", require("./routes/productos.routes"));


// ========================================
// RUTAS DE USUARIOS (con autenticación)
// ========================================
app.use("/api/usuarios", require("./routes/usuarios.routes"));
app.use("/api/carrito", require("./routes/carrito.routes"));
app.use("/api/favoritos", require("./routes/favoritos.routes"));
app.use("/api/ordenes", require("./routes/ordenes.routes"));
app.use("/api/envios", require("./routes/envios.routes"));
app.use("/api/devoluciones", require("./routes/devoluciones.routes"));



// ========================================
// RUTAS DE ADMINISTRACIÓN (solo admin)
// ========================================
app.use("/api/admin", require("./routes/admin/index.routes"));
app.use("/api/admin/productos", require("./routes/admin/productos.routes"));
app.use("/api/admin/categorias", require("./routes/admin/categorias.routes"));
app.use("/api/admin/resenas", require("./routes/admin/resenas.routes"));


// Puerto del Servicio Web
const puerto = process.env.PORT || 3000;
app.listen(puerto);
console.log("Server on port", puerto);