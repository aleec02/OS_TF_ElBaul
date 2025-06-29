const express = require("express");
const router = express.Router();

// Importar controladores
const {
    obtenerProductos,
    obtenerProductoPorId,
    buscarProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    obtenerMisProductos
} = require("../controllers/productos.controller");

// Importar middleware
const { verificarAuth } = require("../middleware/auth.middleware");

// Rutas públicas
router.get("/", obtenerProductos);
router.get("/buscar", buscarProductos);
router.get("/:id", obtenerProductoPorId);

// Rutas protegidas (requieren autenticación)
router.use(verificarAuth); // Aplicar autenticación a todas las rutas siguientes

router.get("/usuario/mis-productos", obtenerMisProductos);
router.post("/", crearProducto);
router.put("/:id", actualizarProducto);
router.delete("/:id", eliminarProducto);

module.exports = router;