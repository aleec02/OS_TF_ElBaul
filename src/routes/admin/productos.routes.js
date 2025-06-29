const express = require("express");
const router = express.Router();

const {
    obtenerTodosLosProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto
} = require("../../controllers/admin/productos.controller");

const { verificarAuthYAdmin } = require("../../middleware/admin.middleware");

router.use(verificarAuthYAdmin);

router.get("/", obtenerTodosLosProductos);
router.post("/", crearProducto);
router.put("/:id", actualizarProducto);
router.delete("/:id", eliminarProducto);

module.exports = router;