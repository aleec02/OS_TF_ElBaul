const express = require("express");
const router = express.Router();

const { verificarAuth } = require("../middleware/auth.middleware");
const {
    rastrearEnvio,
    obtenerMisEnvios,
    obtenerDetalleEnvio
} = require("../controllers/envios.controller");

// ==========================================
// RUTAS DE ENVÍOS
// ==========================================

/**
 * @route   GET /api/envios/rastrear/:numero_seguimiento
 * @desc    Rastrear envío por número de seguimiento (público)
 * @access  Public
 * @params  numero_seguimiento: string
 */
router.get("/rastrear/:numero_seguimiento", rastrearEnvio);

/**
 * @route   GET /api/envios
 * @desc    Obtener envíos del usuario autenticado
 * @access  Private (Usuario autenticado)
 * @query   {
 *            page?: number,
 *            limit?: number,
 *            estado?: string
 *          }
 */
router.get("/", verificarAuth, obtenerMisEnvios);

/**
 * @route   GET /api/envios/:id
 * @desc    Obtener detalle específico de un envío
 * @access  Private (Usuario autenticado - solo sus envíos)
 * @params  id: envio_id
 */
router.get("/:id", verificarAuth, obtenerDetalleEnvio);

module.exports = router;