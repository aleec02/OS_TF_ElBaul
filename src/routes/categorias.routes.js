const express = require("express");
const router = express.Router();

const {
    obtenerCategorias,
    obtenerCategoriaPorId
} = require("../controllers/categorias.controller");

// Rutas públicas (sin autenticación)
router.get("/", obtenerCategorias);
router.get("/:id", obtenerCategoriaPorId);

module.exports = router;