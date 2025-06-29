const express = require("express");
const router = express.Router();

const {
    obtenerCarrito,
    agregarItemCarrito,
    actualizarItemCarrito,
    eliminarItemCarrito,
    vaciarCarrito
} = require("../controllers/carrito.controller");

const { verificarAuth } = require("../middleware/auth.middleware");

// Todas las rutas requieren autenticación
router.use(verificarAuth);

// Rutas del carrito
router.get("/", obtenerCarrito);
router.post("/items", agregarItemCarrito);
router.put("/items/:id", actualizarItemCarrito);
router.delete("/items/:id", eliminarItemCarrito);
router.delete("/", vaciarCarrito);

module.exports = router;