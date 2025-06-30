const express = require("express");
const router = express.Router();

const { verificarAuth } = require("../middleware/auth.middleware");
const {
    solicitarDevolucion,
    obtenerMisDevoluciones,
    obtenerDetalleDevolucion
} = require("../controllers/devoluciones.controller");

// RUTAS DE DEVOLUCIONES (requieren autenticación)

/**
 * @route   POST /api/devoluciones
 * @desc    Solicitar devolución de un producto
 * @access  Private (Usuario autenticado)
 * @body    {
 *            orden_id: string (requerido),
 *            producto_id: string (requerido),
 *            motivo: string (requerido)
 *          }
 */
router.post("/", verificarAuth, solicitarDevolucion);

/**
 * @route   GET /api/devoluciones
 * @desc    Obtener devoluciones del usuario con paginación y filtros
 * @access  Private (Usuario autenticado)
 * @query   {
 *            page?: number,
 *            limit?: number,
 *            estado?: string
 *          }
 */
router.get("/", verificarAuth, obtenerMisDevoluciones);

/**
 * @route   GET /api/devoluciones/:id
 * @desc    Obtener detalle completo de una devolución específica
 * @access  Private (Usuario autenticado - solo sus devoluciones)
 * @params  id: devolucion_id
 */
router.get("/:id", verificarAuth, obtenerDetalleDevolucion);

module.exports = router;