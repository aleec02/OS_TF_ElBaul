const ModeloDevolucion = require("../models/devolucion.model");
const ModeloOrden = require("../models/orden.model");
const ModeloItemOrden = require("../models/item-orden.model");
const ModeloProducto = require("../models/producto.model");

/**
 * Solicitar devolución
 */
const solicitarDevolucion = async (req, res) => {
    try {
        const { orden_id, producto_id, motivo } = req.body;
        
        // Validar campos requeridos
        if (!orden_id || !producto_id || !motivo) {
            return res.status(400).json({
                exito: false,
                mensaje: "Los campos orden_id, producto_id y motivo son requeridos",
                codigo: "MISSING_REQUIRED_FIELDS"
            });
        }
        
        // Verificar que la orden pertenece al usuario
        const orden = await ModeloOrden.findOne({
            orden_id,
            usuario_id: req.usuario.usuario_id
        });
        
        if (!orden) {
            return res.status(404).json({
                exito: false,
                mensaje: "Orden no encontrada",
                codigo: "ORDER_NOT_FOUND"
            });
        }
        
        // Verificar que la orden puede ser devuelta (enviada o entregada)
        if (!["enviada", "entregada"].includes(orden.estado)) {
            return res.status(400).json({
                exito: false,
                mensaje: `No se puede solicitar devolución para una orden en estado: ${orden.estado}`,
                codigo: "INVALID_ORDER_STATUS"
            });
        }
        
        // Verificar que el producto está en la orden
        const itemOrden = await ModeloItemOrden.findOne({
            orden_id,
            producto_id
        });
        
        if (!itemOrden) {
            return res.status(404).json({
                exito: false,
                mensaje: "El producto no se encuentra en esta orden",
                codigo: "PRODUCT_NOT_IN_ORDER"
            });
        }
        
        // Verificar si ya existe una devolución para este producto
        const devolucionExistente = await ModeloDevolucion.findOne({
            orden_id,
            producto_id,
            usuario_id: req.usuario.usuario_id
        });
        
        if (devolucionExistente) {
            return res.status(400).json({
                exito: false,
                mensaje: "Ya existe una devolución para este producto en esta orden",
                codigo: "RETURN_ALREADY_EXISTS"
            });
        }
        
        // Calcular monto de reembolso basado en el item de la orden
        const montoReembolso = itemOrden.subtotal;
        
        // Generar fecha de solicitud en formato string
        const fechaSolicitud = new Date().toISOString().replace('T', ' ').slice(0, 19);
        
        // Crear devolución
        const nuevaDevolucion = new ModeloDevolucion({
            orden_id,
            producto_id,
            usuario_id: req.usuario.usuario_id,
            motivo,
            estado: "solicitada",
            fecha_solicitud: fechaSolicitud,
            monto_reembolso: montoReembolso
        });
        
        await nuevaDevolucion.save();
        
        res.status(201).json({
            exito: true,
            mensaje: "Solicitud de devolución creada exitosamente",
            data: {
                devolucion: nuevaDevolucion.obtenerDatosPublicos()
            }
        });
        
    } catch (error) {
        console.error("Error en solicitarDevolucion:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Obtener devoluciones del usuario
 */
const obtenerMisDevoluciones = async (req, res) => {
    try {
        const { page = 1, limit = 10, estado } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Construir filtros
        const filtros = { usuario_id: req.usuario.usuario_id };
        if (estado) {
            filtros.estado = estado;
        }
        
        // Obtener devoluciones con información del producto y orden
        const devoluciones = await ModeloDevolucion.aggregate([
            { $match: filtros },
            {
                $lookup: {
                    from: "productos",
                    localField: "producto_id",
                    foreignField: "producto_id",
                    as: "producto"
                }
            },
            { $unwind: "$producto" },
            {
                $lookup: {
                    from: "ordenes",
                    localField: "orden_id",
                    foreignField: "orden_id",
                    as: "orden"
                }
            },
            { $unwind: "$orden" },
            { $sort: { fecha_solicitud: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
                $project: {
                    devolucion_id: 1,
                    orden_id: 1,
                    producto_id: 1,
                    motivo: 1,
                    estado: 1,
                    fecha_solicitud: 1,
                    monto_reembolso: 1,
                    "producto.titulo": 1,
                    "producto.precio": 1,
                    "orden.fecha_orden": 1
                }
            }
        ]);
        
        const total = await ModeloDevolucion.countDocuments(filtros);
        
        res.json({
            exito: true,
            mensaje: "Devoluciones obtenidas exitosamente",
            data: {
                devoluciones,
                paginacion: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
        
    } catch (error) {
        console.error("Error en obtenerMisDevoluciones:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Obtener detalle de una devolución específica
 */
const obtenerDetalleDevolucion = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar devolución
        const devolucion = await ModeloDevolucion.findOne({
            devolucion_id: id,
            usuario_id: req.usuario.usuario_id
        });
        
        if (!devolucion) {
            return res.status(404).json({
                exito: false,
                mensaje: "Devolución no encontrada",
                codigo: "RETURN_NOT_FOUND"
            });
        }
        
        // Obtener información adicional
        const producto = await ModeloProducto.findOne({
            producto_id: devolucion.producto_id
        }).lean();
        
        const orden = await ModeloOrden.findOne({
            orden_id: devolucion.orden_id
        }).lean();
        
        res.json({
            exito: true,
            mensaje: "Detalle de devolución obtenido exitosamente",
            data: {
                devolucion: devolucion.obtenerDatosPublicos(),
                producto: producto ? {
                    titulo: producto.titulo,
                    precio: producto.precio,
                    marca: producto.marca
                } : null,
                orden: orden ? {
                    fecha_orden: orden.fecha_orden,
                    total: orden.total
                } : null
            }
        });
        
    } catch (error) {
        console.error("Error en obtenerDetalleDevolucion:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

module.exports = {
    solicitarDevolucion,
    obtenerMisDevoluciones,
    obtenerDetalleDevolucion
};