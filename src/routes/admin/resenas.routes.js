const express = require("express");
const router = express.Router();

const { verificarAuthYAdmin } = require("../../middleware/admin.middleware");
const {
    obtenerResenasModeracion,
    aprobarResena,
    eliminarResena,
    obtenerEstadisticasResenas
} = require("../../controllers/admin/resenas.controller");

// RUTAS ADMIN DE RESEÑAS (requieren admin)

/**
 * @route   GET /api/admin/resenas
 * @desc    Obtener todas las reseñas para moderación
 * @access  Private (Solo Admin)
 * @query   {
 *            page?: number,
 *            limit?: number,
 *            estado?: 'pendientes' | 'aprobadas',
 *            producto_id?: string,
 *            puntuacion?: number (1-5)
 *          }
 */
router.get("/", verificarAuthYAdmin, obtenerResenasModeracion);

/**
 * @route   GET /api/admin/resenas/estadisticas
 * @desc    Obtener estadísticas detalladas de reseñas
 * @access  Private (Solo Admin)
 */
router.get("/estadisticas", verificarAuthYAdmin, obtenerEstadisticasResenas);

/**
 * @route   PUT /api/admin/resenas/:id/aprobar
 * @desc    Aprobar una reseña específica
 * @access  Private (Solo Admin)
 * @params  id: resena_id
 */
router.put("/:id/aprobar", verificarAuthYAdmin, aprobarResena);

/**
 * @route   DELETE /api/admin/resenas/:id
 * @desc    Eliminar/rechazar una reseña específica
 * @access  Private (Solo Admin)
 * @params  id: resena_id
 * @body    {
 *            motivo?: string
 *          }
 */
router.delete("/:id", verificarAuthYAdmin, eliminarResena);

module.exports = router;