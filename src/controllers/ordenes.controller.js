const ModeloOrden = require("../models/orden.model");
const ModeloItemOrden = require("../models/item-orden.model");
const ModeloPago = require("../models/pago.model");
const ModeloCarrito = require("../models/carrito.model");
const ModeloItemCarrito = require("../models/item-carrito.model");
const ModeloProducto = require("../models/producto.model");
const ModeloInventario = require("../models/inventario.model");

/**
 * Checkout - Procesar carrito y crear orden
 */
const checkout = async (req, res) => {
    try {
        const { direccion_envio, metodo_pago, notas } = req.body;
        
        // Validar campos requeridos
        if (!direccion_envio || !metodo_pago) {
            return res.status(400).json({
                exito: false,
                mensaje: "La dirección de envío y método de pago son requeridos",
                codigo: "MISSING_REQUIRED_FIELDS"
            });
        }
        
        // Buscar carrito activo del usuario
        const carrito = await ModeloCarrito.findOne({
            usuario_id: req.usuario.usuario_id,
            estado: "activo"
        });
        
        if (!carrito) {
            return res.status(400).json({
                exito: false,
                mensaje: "No tienes un carrito activo",
                codigo: "NO_ACTIVE_CART"
            });
        }
        
        // Obtener items del carrito
        const itemsCarrito = await ModeloItemCarrito.find({
            carrito_id: carrito.carrito_id
        });
        
        if (itemsCarrito.length === 0) {
            return res.status(400).json({
                exito: false,
                mensaje: "El carrito está vacío",
                codigo: "EMPTY_CART"
            });
        }
        
        // Validar stock final y calcular totales
        let total = 0;
        const itemsParaOrden = [];
        
        for (const item of itemsCarrito) {
            // Verificar que el producto aún existe
            const producto = await ModeloProducto.findOne({
                producto_id: item.producto_id,
                $or: [
                    { activo: true },
                    { activo: { $exists: false } }
                ]
            });
            
            if (!producto) {
                return res.status(400).json({
                    exito: false,
                    mensaje: `Producto ${item.producto_id} ya no está disponible`,
                    codigo: "PRODUCT_NOT_AVAILABLE"
                });
            }
            
            // Verificar stock disponible
            const inventario = await ModeloInventario.findOne({
                producto_id: item.producto_id
            });
            
            if (inventario && inventario.cantidad_disponible < item.cantidad) {
                return res.status(400).json({
                    exito: false,
                    mensaje: `Stock insuficiente para ${producto.titulo}. Disponible: ${inventario.cantidad_disponible}`,
                    codigo: "INSUFFICIENT_STOCK"
                });
            }
            
            // Preparar item para la orden
            itemsParaOrden.push({
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                precio_unitario: producto.precio,
                subtotal: item.cantidad * producto.precio
            });
            
            total += item.cantidad * producto.precio;
        }
        
        // Crear la orden
        const nuevaOrden = new ModeloOrden({
            usuario_id: req.usuario.usuario_id,
            total,
            estado: "pendiente",
            metodo_pago,
            direccion_envio
        });
        
        await nuevaOrden.save();
        
        // Crear items de la orden
        const itemsOrdenCreados = [];
        for (const itemData of itemsParaOrden) {
            const itemOrden = new ModeloItemOrden({
                orden_id: nuevaOrden.orden_id,
                ...itemData
            });
            await itemOrden.save();
            itemsOrdenCreados.push(itemOrden);
        }
        
        // Actualizar stock de productos
        for (const item of itemsCarrito) {
            // Actualizar stock en producto
            await ModeloProducto.updateOne(
                { producto_id: item.producto_id },
                { $inc: { stock: -item.cantidad } }
            );
            
            // Actualizar inventario
            await ModeloInventario.updateOne(
                { producto_id: item.producto_id },
                { 
                    $inc: { 
                        cantidad_disponible: -item.cantidad,
                        cantidad_reservada: -item.cantidad 
                    },
                    $set: { fecha_actualizacion: new Date().toISOString().replace('T', ' ').slice(0, 19) }
                }
            );
        }
        
        // Crear registro de pago
        const nuevoPago = new ModeloPago({
            orden_id: nuevaOrden.orden_id,
            monto: total,
            metodo: metodo_pago,
            estado: "aprobado"
        });
        
        await nuevoPago.save();
        
        // Vaciar carrito
        await ModeloItemCarrito.deleteMany({
            carrito_id: carrito.carrito_id
        });
        
        // Cambiar estado del carrito
        carrito.estado = "convertido";
        await carrito.save();
        
        res.status(201).json({
            exito: true,
            mensaje: "Orden creada exitosamente",
            data: {
                orden: nuevaOrden.obtenerDatosPublicos(),
                pago: nuevoPago.obtenerDatosPublicos(),
                items_count: itemsOrdenCreados.length
            }
        });
        
    } catch (error) {
        console.error("Error en checkout:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Obtener órdenes del usuario
 */
const obtenerOrdenes = async (req, res) => {
    try {
        const { page = 1, limit = 10, estado } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Construir filtros
        const filtros = { usuario_id: req.usuario.usuario_id };
        if (estado) {
            filtros.estado = estado;
        }
        
        // Obtener órdenes
        const ordenes = await ModeloOrden.find(filtros)
            .sort({ fecha_orden: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
        
        // Contar total
        const total = await ModeloOrden.countDocuments(filtros);
        
        res.json({
            exito: true,
            mensaje: "Órdenes obtenidas exitosamente",
            data: {
                ordenes,
                paginacion: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
        
    } catch (error) {
        console.error("Error en obtenerOrdenes:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Obtener detalle de una orden específica
 */
const obtenerDetalleOrden = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar orden
        const orden = await ModeloOrden.findOne({
            orden_id: id,
            usuario_id: req.usuario.usuario_id
        }).lean();
        
        if (!orden) {
            return res.status(404).json({
                exito: false,
                mensaje: "Orden no encontrada",
                codigo: "ORDER_NOT_FOUND"
            });
        }
        
        // Obtener items de la orden con información del producto
        const items = await ModeloItemOrden.aggregate([
            { $match: { orden_id: id } },
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
                $project: {
                    item_orden_id: 1,
                    producto_id: 1,
                    cantidad: 1,
                    precio_unitario: 1,
                    subtotal: 1,
                    "producto.titulo": 1,
                    "producto.marca": 1,
                    "producto.categoria_id": 1
                }
            }
        ]);
        
        // Obtener información del pago
        const pago = await ModeloPago.findOne({ orden_id: id }).lean();
        
        res.json({
            exito: true,
            mensaje: "Detalle de orden obtenido exitosamente",
            data: {
                orden,
                items,
                pago,
                resumen: {
                    total_items: items.length,
                    cantidad_productos: items.reduce((sum, item) => sum + item.cantidad, 0)
                }
            }
        });
        
    } catch (error) {
        console.error("Error en obtenerDetalleOrden:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Cancelar una orden
 */
const cancelarOrden = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;
        
        // Buscar orden
        const orden = await ModeloOrden.findOne({
            orden_id: id,
            usuario_id: req.usuario.usuario_id
        });
        
        if (!orden) {
            return res.status(404).json({
                exito: false,
                mensaje: "Orden no encontrada",
                codigo: "ORDER_NOT_FOUND"
            });
        }
        
        // Verificar si se puede cancelar
        if (!orden.puedeSerCancelada()) {
            return res.status(400).json({
                exito: false,
                mensaje: `No se puede cancelar una orden en estado: ${orden.estado}`,
                codigo: "CANNOT_CANCEL_ORDER"
            });
        }
        
        // Obtener items de la orden
        const items = await ModeloItemOrden.find({
            orden_id: orden.orden_id
        });
        
        // Restaurar stock
        for (const item of items) {
            // Restaurar stock en producto
            await ModeloProducto.updateOne(
                { producto_id: item.producto_id },
                { $inc: { stock: item.cantidad } }
            );
            
            // Restaurar inventario
            await ModeloInventario.updateOne(
                { producto_id: item.producto_id },
                { 
                    $inc: { cantidad_disponible: item.cantidad },
                    $set: { fecha_actualizacion: new Date().toISOString().replace('T', ' ').slice(0, 19) }
                }
            );
        }
        
        // Actualizar estado de la orden
        orden.estado = "cancelada";
        await orden.save();
        
        // Actualizar estado del pago
        await ModeloPago.updateOne(
            { orden_id: orden.orden_id },
            { estado: "reembolsado" }
        );
        
        res.json({
            exito: true,
            mensaje: "Orden cancelada exitosamente",
            data: {
                orden: orden.obtenerDatosPublicos()
            }
        });
        
    } catch (error) {
        console.error("Error en cancelarOrden:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

module.exports = {
    checkout,
    obtenerOrdenes,
    obtenerDetalleOrden,
    cancelarOrden
};