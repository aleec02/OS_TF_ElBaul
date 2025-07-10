const express = require('express');
const router = express.Router();
const publicacionesController = require('../controllers/publicaciones.controller');
const { verificarAuth } = require('../middleware/auth.middleware');
const { optionalAuth } = require('../middleware/frontend-auth.middleware');

// ========================================
// RUTAS PÚBLICAS (sin autenticación)
// ========================================

// Obtener feed de publicaciones (público)
router.get('/', optionalAuth, publicacionesController.obtenerPublicaciones);

// Obtener publicación específica (público)
router.get('/:id', optionalAuth, publicacionesController.obtenerPublicacionPorId);

// Obtener tendencias (público)
router.get('/tendencias', publicacionesController.obtenerTendencias);

// ========================================
// RUTAS PRIVADAS (requiere autenticación)
// ========================================

// Crear publicación
router.post('/', verificarAuth, publicacionesController.crearPublicacion);

// Actualizar publicación
router.put('/:id', verificarAuth, publicacionesController.actualizarPublicacion);

// Eliminar publicación
router.delete('/:id', verificarAuth, publicacionesController.eliminarPublicacion);

// ========================================
// COMENTARIOS
// ========================================

// Obtener comentarios de una publicación (público)
router.get('/:id/comentarios', optionalAuth, publicacionesController.obtenerComentarios);

// Crear comentario
router.post('/:id/comentarios', verificarAuth, publicacionesController.crearComentario);

// ========================================
// REACCIONES
// ========================================

// Obtener reacciones de una publicación (público)
router.get('/:id/reacciones', optionalAuth, publicacionesController.obtenerReacciones);

// Reaccionar a una publicación
router.post('/:id/reacciones', verificarAuth, publicacionesController.reaccionarPublicacion);

// ========================================
// FUNCIONALIDADES SOCIALES
// ========================================

// Reportar publicación
router.post('/:id/reportar', verificarAuth, publicacionesController.reportarPublicacion);

// Compartir publicación
router.post('/:id/compartir', verificarAuth, publicacionesController.compartirPublicacion);

// Obtener publicaciones de un usuario específico
router.get('/usuario/:usuarioId', optionalAuth, publicacionesController.obtenerPublicacionesUsuario);

// Obtener publicaciones relacionadas
router.get('/:id/relacionadas', optionalAuth, publicacionesController.obtenerPublicacionesRelacionadas);

module.exports = router;