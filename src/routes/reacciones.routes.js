const express = require("express");
const router = express.Router();

const {
    reaccionarPublicacion,
    reaccionarComentario,
    obtenerReaccionesPublicacion,
    obtenerReaccionesComentario
} = require("../controllers/reacciones.controller");

const { verificarAuth } = require("../middleware/auth.middleware");

// Todas las rutas de reacciones requieren autenticación
router.use(verificarAuth);

// Reacciones a publicaciones
router.post("/publicaciones/:id", reaccionarPublicacion);
router.get("/publicaciones/:id", obtenerReaccionesPublicacion);

// Reacciones a comentarios
router.post("/comentarios/:id", reaccionarComentario);
router.get("/comentarios/:id", obtenerReaccionesComentario);

module.exports = router;