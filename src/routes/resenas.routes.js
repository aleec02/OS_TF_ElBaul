const express = require("express");
const router = express.Router();

const { verificarAuth } = require("../middleware/auth.middleware");
const {
    crearEditarResena,
    obtenerResenasProducto,
    obtenerMiResena,
    eliminarMiResena
} = require("../controllers/resenas.controller");

// RUTAS DE RESEÑAS

/**
 * @route   GET /api/productos/:id/resenas
 * @desc    Obtener reseñas aprobadas de un producto específico
 * @access  Public
 * @params  id: producto_id
 * @query   {
 *            page?: number,
 *            limit?: number,
 *            puntuacion?: number (1-5)
 *          }
 */
router.get("/:id/resenas", obtenerResenasProducto);

/**
 * @route   POST /api/productos/:id/resenas
 * @desc    Crear o editar reseña para un producto
 * @access  Private (Usuario autenticado)
 * @params  id: producto_id
 * @body    {
 *            puntuacion: number (1-5, requerido),
 *            comentario: string (requerido)
 *          }
 */
router.post("/:id/resenas", verificarAuth, crearEditarResena);

/**
 * @route   GET /api/productos/:id/resenas/mi-resena
 * @desc    Obtener mi reseña para un producto específico
 * @access  Private (Usuario autenticado)
 * @params  id: producto_id
 */
router.get("/:id/resenas/mi-resena", verificarAuth, obtenerMiResena);

/**
 * @route   DELETE /api/productos/:id/resenas/mi-resena
 * @desc    Eliminar mi reseña para un producto específico
 * @access  Private (Usuario autenticado)
 * @params  id: producto_id
 */
router.delete("/:id/resenas/mi-resena", verificarAuth, eliminarMiResena);

module.exports = router;