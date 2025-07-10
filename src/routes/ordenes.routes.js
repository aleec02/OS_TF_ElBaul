const express = require('express');
const router = express.Router();
const ordenesController = require('../controllers/ordenes.controller');
const { verificarAuth } = require('../middleware/auth.middleware');
const { optionalAuth } = require('../middleware/frontend-auth.middleware');

// ========================================
// RUTAS PÚBLICAS (sin autenticación)
// ========================================

// Obtener orden por código (público para seguimiento)
router.get('/seguimiento/:codigo', ordenesController.obtenerOrdenPorCodigo);

// ========================================
// RUTAS PRIVADAS (requiere autenticación)
// ========================================

// Checkout y creación de orden
router.post('/checkout', verificarAuth, ordenesController.procesarCheckout);

// Obtener órdenes del usuario
router.get('/', verificarAuth, ordenesController.obtenerOrdenesUsuario);

// Obtener orden específica del usuario
router.get('/:id', verificarAuth, ordenesController.obtenerOrdenPorId);

// Cancelar orden
router.post('/:id/cancelar', verificarAuth, ordenesController.cancelarOrden);

// Confirmar recepción de orden
router.post('/:id/confirmar-recepcion', verificarAuth, ordenesController.confirmarRecepcion);

// ========================================
// PROCESAMIENTO DE PAGOS
// ========================================

// Procesar pago con tarjeta
router.post('/:id/pagar-tarjeta', verificarAuth, ordenesController.procesarPagoTarjeta);

// Procesar pago con transferencia
router.post('/:id/pagar-transferencia', verificarAuth, ordenesController.procesarPagoTransferencia);

// ========================================
// GESTIÓN DE ENVÍOS
// ========================================

// Obtener opciones de envío
router.get('/opciones-envio', verificarAuth, ordenesController.obtenerOpcionesEnvio);

// Calcular costo de envío
router.post('/calcular-envio', verificarAuth, ordenesController.calcularCostoEnvio);

// ========================================
// RESEÑAS Y CALIFICACIONES
// ========================================

// Crear reseña para orden
router.post('/:id/resena', verificarAuth, ordenesController.crearResenaOrden);

module.exports = router;