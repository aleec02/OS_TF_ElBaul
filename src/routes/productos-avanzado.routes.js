const express = require('express');
const router = express.Router();
const productosAvanzadoController = require('../controllers/productos-avanzado.controller');
const { verificarAuth } = require('../middleware/auth.middleware');
const { optionalAuth } = require('../middleware/frontend-auth.middleware');

// ========================================
// RUTAS PÚBLICAS (sin autenticación)
// ========================================

// Comparación de productos
router.get('/comparar', optionalAuth, productosAvanzadoController.compararProductos);

// Recomendaciones de productos
router.get('/recomendaciones', optionalAuth, productosAvanzadoController.obtenerRecomendaciones);

// Búsqueda avanzada
router.get('/busqueda-avanzada', optionalAuth, productosAvanzadoController.busquedaAvanzada);

// Productos similares
router.get('/:producto_id/similares', optionalAuth, productosAvanzadoController.obtenerProductosSimilares);

// Historial de precios
router.get('/:producto_id/historial-precios', optionalAuth, productosAvanzadoController.obtenerHistorialPrecios);

// Estadísticas de producto
router.get('/:producto_id/estadisticas', optionalAuth, productosAvanzadoController.obtenerEstadisticasProducto);

module.exports = router; 