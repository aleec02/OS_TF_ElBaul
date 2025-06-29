const express = require("express");
const router = express.Router();

const {
    registrarUsuario,
    loginUsuario,
    logoutUsuario,  // AGREGADO
    obtenerPerfil,
    actualizarPerfil,
    cambiarContrasena
} = require("../controllers/usuarios.controller");

const { verificarAuth } = require("../middleware/auth.middleware");

// Rutas públicas
router.post("/registro", registrarUsuario);
router.post("/login", loginUsuario);

// Rutas protegidas
router.post("/logout", logoutUsuario);
router.get("/perfil", verificarAuth, obtenerPerfil);
router.put("/perfil", verificarAuth, actualizarPerfil);
router.put("/cambiar-contrasena", verificarAuth, cambiarContrasena);

module.exports = router;