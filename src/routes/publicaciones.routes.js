const express = require("express");
const router = express.Router();

const {
    crearPublicacion,
    obtenerFeed,
    obtenerDetallePublicacion,
    editarPublicacion,
    eliminarPublicacion
} = require("../controllers/publicaciones.controller");

const {
    anadirComentario,
    obtenerComentarios
} = require("../controllers/comentarios.controller");

const {
    reaccionarPublicacion,
    obtenerReaccionesPublicacion
} = require("../controllers/reacciones.controller");

const { verificarAuth } = require("../middleware/auth.middleware");

// Rutas públicas (no requieren autenticación)
router.get("/", obtenerFeed);
router.get("/:id", obtenerDetallePublicacion);
router.get("/:id/comentarios", obtenerComentarios);
router.get("/:id/reacciones", obtenerReaccionesPublicacion);

// Rutas que requieren autenticación
router.use(verificarAuth);

// CRUD de publicaciones
router.post("/", crearPublicacion);
router.put("/:id", editarPublicacion);
router.delete("/:id", eliminarPublicacion);

// Comentarios
router.post("/:id/comentarios", anadirComentario);

// Reacciones
router.post("/:id/reacciones", reaccionarPublicacion);

module.exports = router;