const express = require("express");
const router = express.Router();

// Importar controladores
const {
    obtenerTodasLasCategorias,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria
} = require("../../controllers/admin/categorias.controller");

// Importar middleware
const { verificarAuthYAdmin } = require("../../middleware/admin.middleware");

// Todas las rutas requieren autenticación y rol admin
router.use(verificarAuthYAdmin);

// Rutas CRUD para categorías (ADMIN)
router.get("/", obtenerTodasLasCategorias);
router.post("/", crearCategoria);
router.put("/:id", actualizarCategoria);
router.delete("/:id", eliminarCategoria);

module.exports = router;