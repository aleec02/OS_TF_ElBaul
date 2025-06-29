const express = require("express");
const router = express.Router();

// Importar controladores
const {
    obtenerProductos,
    obtenerProductoPorId,
    buscarProductos
} = require("../controllers/productos.controller");

// Todas las rutas son PÚBLICAS (no requieren autenticación)
router.get("/", obtenerProductos);
router.get("/buscar", buscarProductos);
router.get("/:id", obtenerProductoPorId);

module.exports = router;