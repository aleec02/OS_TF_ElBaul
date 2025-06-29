const express = require("express");
const router = express.Router();

const {
    obtenerFavoritos,
    agregarFavorito,
    eliminarFavorito,
    eliminarFavoritoPorProducto,
    verificarFavorito
} = require("../controllers/favoritos.controller");

const { verificarAuth } = require("../middleware/auth.middleware");

router.use(verificarAuth);

// Rutas de favoritos
router.get("/", obtenerFavoritos);
router.post("/", agregarFavorito);
router.get("/verificar/:producto_id", verificarFavorito);
router.delete("/:id", eliminarFavorito);
router.delete("/producto/:producto_id", eliminarFavoritoPorProducto);

module.exports = router;