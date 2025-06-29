const express = require("express");
const router = express.Router();

const {
    registrarUsuario,
    loginUsuario,
    obtenerPerfil,
    actualizarPerfil,
    cambiarContrasena
} = require("../controllers/usuarios.controller");

const { verificarAuth } = require("../middleware/auth.middleware");



// rutas públicas (sin autenticación)
router.post("/registro", registrarUsuario);
router.post("/login", loginUsuario);

// rutas protegidas (requieren autenticación)
router.get("/perfil", verificarAuth, obtenerPerfil);
router.put("/perfil", verificarAuth, actualizarPerfil);
router.put("/cambiar-contrasena", verificarAuth, cambiarContrasena);

module.exports = router;
