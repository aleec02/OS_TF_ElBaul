const express = require("express");
const router = express.Router();

// Importar controladores
const {
    obtenerCategorias,
    obtenerCategoriaPorId,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria
} = require("../controllers/categorias.controller");

// Importar middleware
const { verificarAuth } = require("../middleware/auth.middleware");

// Rutas públicas
router.get("/", obtenerCategorias);
router.get("/:id", obtenerCategoriaPorId);

// Rutas protegidas (requieren autenticación y rol admin)
router.post("/", verificarAuth, crearCategoria);
router.put("/:id", verificarAuth, actualizarCategoria);
router.delete("/:id", verificarAuth, eliminarCategoria);

module.exports = router;