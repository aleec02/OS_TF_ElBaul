const express = require('express');
const router = express.Router();
const comentariosController = require('../controllers/comentarios.controller');
const { verificarAuth } = require('../middleware/auth.middleware');
const { optionalAuth } = require('../middleware/frontend-auth.middleware');

// ========================================
// RUTAS PÚBLICAS (sin autenticación)
// ========================================

// Obtener comentarios de una publicación (público)
router.get('/publicacion/:publicacionId', optionalAuth, comentariosController.obtenerComentariosPublicacion);

// ========================================
// RUTAS PRIVADAS (requiere autenticación)
// ========================================

// Crear comentario
router.post('/', verificarAuth, comentariosController.crearComentario);

// Actualizar comentario
router.put('/:id', verificarAuth, comentariosController.actualizarComentario);

// Eliminar comentario
router.delete('/:id', verificarAuth, comentariosController.eliminarComentario);

// ========================================
// REACCIONES EN COMENTARIOS
// ========================================

// Obtener reacciones de un comentario (público)
router.get('/:id/reacciones', optionalAuth, comentariosController.obtenerReaccionesComentario);

// Reaccionar a un comentario
router.post('/:id/reacciones', verificarAuth, comentariosController.reaccionarComentario);

// ========================================
// FUNCIONALIDADES SOCIALES
// ========================================

// Reportar comentario
router.post('/:id/reportar', verificarAuth, comentariosController.reportarComentario);

// Obtener comentarios de un usuario
router.get('/usuario/:usuarioId', optionalAuth, comentariosController.obtenerComentariosUsuario);

module.exports = router;