const express = require("express");
const cors = require("cors");

const app = express();

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
        descripcion: "E-commerce de productos de segunda mano"
    });
});

app.get("/api", (req, res) => {
    res.json({
        nombre: "ElBaul API",
        version: "1.0.0",
        endpoints_disponibles: {
            principal: "GET /",
            health: "GET /api/health",
            api_info: "GET /api"
        },
        estado: "Round 1 - Fundación completa"
    });
});

app.get("/api/health", (req, res) => {
    const tiempoActividad = process.uptime();
    const usoMemoria = process.memoryUsage();
    
    res.json({
        estado: "OK",
        timestamp: new Date().toISOString(),
        entorno: "development",
        version: "1.0.0",
        tiempo_actividad: Math.floor(tiempoActividad / 60) + " minutos",
        uso_memoria: {
            rss: Math.round(usoMemoria.rss / 1024 / 1024) + " MB",
            heap_usado: Math.round(usoMemoria.heapUsed / 1024 / 1024) + " MB"
        },
        bd_estado: "Conectado"
    });
});

// TODO: Aquí se agregarán las rutas en rounds posteriores
// app.use("/api/usuarios", require("./routes/usuarios.routes"));
// app.use("/api/productos", require("./routes/productos.routes"));


// Puerto del Servicio Web
app.listen(3000);
console.log("Server on port", 3000);
