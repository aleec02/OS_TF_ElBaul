const express = require("express");
const router = express.Router();

const { verificarAuth } = require("../middleware/auth.middleware");
const {
    editarComentario,
    eliminarComentario
} = require("../controllers/comentarios.controller");

const {
    reaccionarComentario,
    obtenerReaccionesComentario
} = require("../controllers/reacciones.controller");

// ==========================================
// RUTAS DE COMENTARIOS INDIVIDUALES
// ==========================================

/**
 * @route   PUT /api/comentarios/:id
 * @desc    Editar comentario específico (solo el propietario)
 * @access  Private (Usuario autenticado - solo propietario)
 * @params  id: comentario_id
 * @body    {
 *            contenido: string (requerido)
 *          }
 */
router.put("/:id", verificarAuth, editarComentario);

/**
 * @route   DELETE /api/comentarios/:id
 * @desc    Eliminar comentario específico (solo el propietario)
 * @access  Private (Usuario autenticado - solo propietario)
 * @params  id: comentario_id
 */
router.delete("/:id", verificarAuth, eliminarComentario);

// ==========================================
// RUTAS DE REACCIONES EN COMENTARIOS
// ==========================================

/**
 * @route   GET /api/comentarios/:id/reacciones
 * @desc    Obtener reacciones de un comentario específico
 * @access  Public (con datos adicionales si está autenticado)
 * @params  id: comentario_id
 */
router.get("/:id/reacciones", obtenerReaccionesComentario);

/**
 * @route   POST /api/comentarios/:id/reacciones
 * @desc    Añadir/quitar/cambiar reacción a un comentario
 * @access  Private (Usuario autenticado)
 * @params  id: comentario_id
 * @body    {
 *            tipo: string (requerido: like, love, genial, wow, sad, angry)
 *          }
 */
router.post("/:id/reacciones", verificarAuth, reaccionarComentario);

module.exports = router;