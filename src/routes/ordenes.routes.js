const express = require("express");
const router = express.Router();

const { verificarAuth } = require("../middleware/auth.middleware");
const {
    checkout,
    obtenerOrdenes,
    obtenerDetalleOrden,
    cancelarOrden
} = require("../controllers/ordenes.controller");

// RUTAS DE ÓRDENES (requieren autenticación)

/**
 * @route   POST /api/ordenes/checkout
 * @desc    Procesar checkout del carrito y crear orden
 * @access  Private (Usuario autenticado)
 * @body    {
 *            direccion_envio: string (requerido),
 *            metodo_pago: string (requerido),
 *            notas?: string
 *          }
 */
router.post("/checkout", verificarAuth, checkout);

/**
 * @route   GET /api/ordenes
 * @desc    Obtener órdenes del usuario con paginación y filtros
 * @access  Private (Usuario autenticado)
 * @query   {
 *            page?: number,
 *            limit?: number,
 *            estado?: string
 *          }
 */
router.get("/", verificarAuth, obtenerOrdenes);

/**
 * @route   GET /api/ordenes/:id
 * @desc    Obtener detalle completo de una orden específica
 * @access  Private (Usuario autenticado - solo sus órdenes)
 * @params  id: orden_id
 */
router.get("/:id", verificarAuth, obtenerDetalleOrden);

/**
 * @route   PUT /api/ordenes/:id/cancelar
 * @desc    Cancelar una orden (solo si está pendiente/confirmada)
 * @access  Private (Usuario autenticado - solo sus órdenes)
 * @params  id: orden_id
 * @body    {
 *            motivo?: string
 *          }
 */
router.put("/:id/cancelar", verificarAuth, cancelarOrden);

module.exports = router;