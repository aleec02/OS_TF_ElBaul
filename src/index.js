// Cargar variables de entorno PRIMERO
require('dotenv').config();

// Importamos express
const express = require("express");
const cors = require("cors");

// Generando la app web
const app = express();

// Conectar a la base de datos
require("./config/database");

// Middleware básico
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
            api_info: "GET /api",
            
            // Usuarios
            registro: "POST /api/usuarios/registro",
            login: "POST /api/usuarios/login",
            perfil: "GET /api/usuarios/perfil",
            
            // Categorías
            categorias: "GET /api/categorias",
            categoria_detalle: "GET /api/categorias/:id",
            
            // Productos
            productos: "GET /api/productos",
            producto_detalle: "GET /api/productos/:id",
            buscar_productos: "GET /api/productos/buscar?q=termino",
            crear_producto: "POST /api/productos",
            mis_productos: "GET /api/productos/usuario/mis-productos"
        },
        estado: "Round 3 - Sistema de productos y categorías implementado"
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

// Rutas de la aplicación
app.use("/api/usuarios", require("./routes/usuarios.routes"));
app.use("/api/categorias", require("./routes/categorias.routes"));
app.use("/api/productos", require("./routes/productos.routes"));

// TODO: Próximas rutas en rounds posteriores
// app.use("/api/carrito", require("./routes/carrito.routes"));
// app.use("/api/favoritos", require("./routes/favoritos.routes"));

// Puerto del Servicio Web
const puerto = process.env.PORT || 3000;
app.listen(puerto);
console.log("Server on port", puerto);
