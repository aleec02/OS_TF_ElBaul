const ModeloEnvio = require("../models/envio.model");
const ModeloOrden = require("../models/orden.model");

/**
 * Rastrear envío por número de seguimiento
 */
const rastrearEnvio = async (req, res) => {
    try {
        const { numero_seguimiento } = req.params;
        
        // Buscar envío
        const envio = await ModeloEnvio.findOne({ numero_seguimiento });
        
        if (!envio) {
            return res.status(404).json({
                exito: false,
                mensaje: "Número de seguimiento no encontrado",
                codigo: "TRACKING_NOT_FOUND"
            });
        }
        
        // Obtener información de la orden
        const orden = await ModeloOrden.findOne({ orden_id: envio.orden_id }).lean();
        
        res.json({
            exito: true,
            mensaje: "Información de envío obtenida exitosamente",
            data: {
                envio: envio.obtenerDatosPublicos(),
                orden: orden ? {
                    orden_id: orden.orden_id,
                    total: orden.total,
                    fecha_orden: orden.fecha_orden
                } : null
            }
        });
        
    } catch (error) {
        console.error("Error en rastrearEnvio:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Obtener envíos del usuario autenticado
 */
const obtenerMisEnvios = async (req, res) => {
    try {
        const { page = 1, limit = 10, estado } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Buscar órdenes del usuario para obtener sus envíos
        const ordenes = await ModeloOrden.find({
            usuario_id: req.usuario.usuario_id
        }).select('orden_id').lean();
        
        const ordenIds = ordenes.map(orden => orden.orden_id);
        
        const filtros = { orden_id: { $in: ordenIds } };
        if (estado) {
            filtros.estado = estado;
        }
        
        const envios = await ModeloEnvio.aggregate([
            { $match: filtros },
            {
                $lookup: {
                    from: "ordenes",
                    localField: "orden_id",
                    foreignField: "orden_id",
                    as: "orden"
                }
            },
            { $unwind: "$orden" },
            { $sort: { fecha_envio: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
                $project: {
                    envio_id: 1,
                    orden_id: 1,
                    transportista: 1,
                    numero_seguimiento: 1,
                    fecha_envio: 1,
                    fecha_estimada: 1,
                    estado: 1,
                    costo_envio: 1,
                    "orden.total": 1,
                    "orden.fecha_orden": 1
                }
            }
        ]);
        
        const total = await ModeloEnvio.countDocuments(filtros);
        
        res.json({
            exito: true,
            mensaje: "Envíos obtenidos exitosamente",
            data: {
                envios,
                paginacion: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
        
    } catch (error) {
        console.error("Error en obtenerMisEnvios:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Obtener detalle específico de un envío
 */
const obtenerDetalleEnvio = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar envío
        const envio = await ModeloEnvio.findOne({ envio_id: id });
        
        if (!envio) {
            return res.status(404).json({
                exito: false,
                mensaje: "Envío no encontrado",
                codigo: "SHIPPING_NOT_FOUND"
            });
        }
        
        // Verificar que el envío pertenece a una orden del usuario
        const orden = await ModeloOrden.findOne({
            orden_id: envio.orden_id,
            usuario_id: req.usuario.usuario_id
        }).lean();
        
        if (!orden) {
            return res.status(403).json({
                exito: false,
                mensaje: "No tienes permisos para ver este envío",
                codigo: "ACCESS_DENIED"
            });
        }
        
        res.json({
            exito: true,
            mensaje: "Detalle de envío obtenido exitosamente",
            data: {
                envio: envio.obtenerDatosPublicos(),
                orden: {
                    orden_id: orden.orden_id,
                    total: orden.total,
                    fecha_orden: orden.fecha_orden,
                    estado: orden.estado
                }
            }
        });
        
    } catch (error) {
        console.error("Error en obtenerDetalleEnvio:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

module.exports = {
    rastrearEnvio,
    obtenerMisEnvios,
    obtenerDetalleEnvio
};