const ModeloOrden = require("../models/orden.model");
const ModeloProducto = require("../models/producto.model");
const ModeloUsuario = require("../models/usuario.model");
const ModeloCarrito = require("../models/carrito.model");
const ModeloResena = require("../models/resena.model");
const ModeloNotificacion = require("../models/notificacion.model");

/**
 * Procesar checkout y crear orden
 */
const procesarCheckout = async (req, res) => {
    try {
        const {
            nombre, apellido, direccion, ciudad, codigoPostal, telefono,
            metodo_envio, metodo_pago, numero_tarjeta, fecha_vencimiento,
            cvv, nombre_tarjeta, notas, codigo_cupon, descuento, items
        } = req.body;

        const usuario_id = req.usuario.usuario_id;

        // Validar campos requeridos
        if (!nombre || !apellido || !direccion || !ciudad || !telefono) {
            return res.status(400).json({
                exito: false,
                mensaje: "Información de envío incompleta",
                codigo: "MISSING_SHIPPING_INFO"
            });
        }

        if (!metodo_envio || !metodo_pago) {
            return res.status(400).json({
                exito: false,
                mensaje: "Método de envío y pago son requeridos",
                codigo: "MISSING_PAYMENT_METHOD"
            });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({
                exito: false,
                mensaje: "No hay productos en la orden",
                codigo: "EMPTY_ORDER"
            });
        }

        // Verificar stock de productos
        for (const item of items) {
            const producto = await ModeloProducto.findOne({ 
                producto_id: item.producto_id,
                estado: true 
            });

            if (!producto) {
                return res.status(404).json({
                    exito: false,
                    mensaje: `Producto ${item.producto_id} no encontrado`,
                    codigo: "PRODUCT_NOT_FOUND"
                });
            }

            if (producto.stock_disponible < item.cantidad) {
                return res.status(400).json({
                    exito: false,
                    mensaje: `Stock insuficiente para ${producto.titulo}`,
                    codigo: "INSUFFICIENT_STOCK"
                });
            }
        }

        // Calcular totales
        const subtotal = items.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);
        const costoEnvio = metodo_envio === 'express' ? 25 : 15;
        const igv = (subtotal + costoEnvio) * 0.18;
        const total = subtotal + costoEnvio + igv - (descuento || 0);

        // Crear orden
        const nuevaOrden = new ModeloOrden({
            usuario_id,
            codigo_orden: generarCodigoOrden(),
            estado: 'pendiente',
            metodo_pago,
            metodo_envio,
            direccion_envio: {
                nombre: `${nombre} ${apellido}`,
                direccion,
                ciudad,
                codigo_postal: codigoPostal,
                telefono
            },
            items: items.map(item => ({
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                precio_unitario: item.precio_unitario,
                subtotal: item.precio_unitario * item.cantidad
            })),
            subtotal,
            costo_envio: costoEnvio,
            igv,
            descuento: descuento || 0,
            total,
            notas: notas || '',
            codigo_cupon: codigo_cupon || null
        });

        await nuevaOrden.save();

        // Actualizar stock de productos
        for (const item of items) {
            await ModeloProducto.updateOne(
                { producto_id: item.producto_id },
                { $inc: { stock_disponible: -item.cantidad } }
            );
        }

        // Limpiar carrito del usuario
        await ModeloCarrito.deleteMany({ usuario_id });

        // Crear notificación
        await crearNotificacionOrden(nuevaOrden.orden_id, usuario_id, 'orden_creada');

        // Procesar pago según método
        let resultadoPago;
        if (metodo_pago === 'tarjeta_credito') {
            resultadoPago = await procesarPagoTarjeta(nuevaOrden.orden_id, {
                numero_tarjeta,
                fecha_vencimiento,
                cvv,
                nombre_tarjeta
            });
        } else if (metodo_pago === 'transferencia') {
            resultadoPago = await procesarPagoTransferencia(nuevaOrden.orden_id, {
                comprobante: 'simulado' // Simulado para el ejemplo
            });
        }

        // Actualizar estado de la orden según resultado del pago
        if (resultadoPago && resultadoPago.exito) {
            nuevaOrden.estado = 'pagada';
            nuevaOrden.fecha_pago = new Date();
            await nuevaOrden.save();
        }

        res.status(201).json({
            exito: true,
            mensaje: "Orden creada exitosamente",
            data: {
                orden: {
                    orden_id: nuevaOrden.orden_id,
                    codigo_orden: nuevaOrden.codigo_orden,
                    estado: nuevaOrden.estado,
                    total: nuevaOrden.total,
                    fecha_creacion: nuevaOrden.fecha_creacion
                },
                pago: resultadoPago
            }
        });

    } catch (error) {
        console.error("Error en procesarCheckout:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Obtener órdenes del usuario
 */
const obtenerOrdenesUsuario = async (req, res) => {
    try {
        const usuario_id = req.usuario.usuario_id;
        const { page = 1, limit = 10, estado } = req.query;
        const skip = (page - 1) * limit;

        const filtros = { usuario_id };
        if (estado) filtros.estado = estado;

        const ordenes = await ModeloOrden.find(filtros)
            .populate('items.producto_id', 'titulo imagen_principal precio')
            .sort({ fecha_creacion: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await ModeloOrden.countDocuments(filtros);

        const ordenesProcesadas = ordenes.map(orden => ({
            orden_id: orden.orden_id,
            codigo_orden: orden.codigo_orden,
            estado: orden.estado,
            total: orden.total,
            fecha_creacion: orden.fecha_creacion,
            fecha_pago: orden.fecha_pago,
            items_count: orden.items.length,
            items: orden.items.map(item => ({
                producto_id: item.producto_id.producto_id,
                titulo: item.producto_id.titulo,
                imagen: item.producto_id.imagen_principal,
                cantidad: item.cantidad,
                precio_unitario: item.precio_unitario
            }))
        }));

        res.json({
            exito: true,
            mensaje: "Órdenes obtenidas exitosamente",
            data: {
                ordenes: ordenesProcesadas,
                paginacion: {
                    pagina_actual: parseInt(page),
                    total_paginas: Math.ceil(total / limit),
                    total_elementos: total,
                    elementos_por_pagina: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error("Error en obtenerOrdenesUsuario:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Obtener orden específica del usuario
 */
const obtenerOrdenPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario_id = req.usuario.usuario_id;

        const orden = await ModeloOrden.findOne({ 
            orden_id: id, 
            usuario_id 
        })
        .populate('items.producto_id', 'titulo imagen_principal precio descripcion')
        .populate('usuario_id', 'nombre apellido email');

        if (!orden) {
            return res.status(404).json({
                exito: false,
                mensaje: "Orden no encontrada",
                codigo: "ORDER_NOT_FOUND"
            });
        }

        const ordenProcesada = {
            orden_id: orden.orden_id,
            codigo_orden: orden.codigo_orden,
            estado: orden.estado,
            metodo_pago: orden.metodo_pago,
            metodo_envio: orden.metodo_envio,
            direccion_envio: orden.direccion_envio,
            items: orden.items.map(item => ({
                producto_id: item.producto_id.producto_id,
                titulo: item.producto_id.titulo,
                imagen: item.producto_id.imagen_principal,
                descripcion: item.producto_id.descripcion,
                cantidad: item.cantidad,
                precio_unitario: item.precio_unitario,
                subtotal: item.subtotal
            })),
            subtotal: orden.subtotal,
            costo_envio: orden.costo_envio,
            igv: orden.igv,
            descuento: orden.descuento,
            total: orden.total,
            notas: orden.notas,
            fecha_creacion: orden.fecha_creacion,
            fecha_pago: orden.fecha_pago,
            fecha_envio: orden.fecha_envio,
            fecha_entrega: orden.fecha_entrega,
            codigo_cupon: orden.codigo_cupon,
            usuario: {
                nombre: `${orden.usuario_id.nombre} ${orden.usuario_id.apellido}`,
                email: orden.usuario_id.email
            }
        };

        res.json({
            exito: true,
            mensaje: "Orden obtenida exitosamente",
            data: {
                orden: ordenProcesada
            }
        });

    } catch (error) {
        console.error("Error en obtenerOrdenPorId:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Obtener orden por código de seguimiento (público)
 */
const obtenerOrdenPorCodigo = async (req, res) => {
    try {
        const { codigo } = req.params;

        const orden = await ModeloOrden.findOne({ codigo_orden: codigo })
            .populate('items.producto_id', 'titulo imagen_principal')
            .populate('usuario_id', 'nombre apellido');

        if (!orden) {
            return res.status(404).json({
                exito: false,
                mensaje: "Orden no encontrada",
                codigo: "ORDER_NOT_FOUND"
            });
        }

        const ordenProcesada = {
            codigo_orden: orden.codigo_orden,
            estado: orden.estado,
            fecha_creacion: orden.fecha_creacion,
            fecha_envio: orden.fecha_envio,
            fecha_entrega: orden.fecha_entrega,
            items_count: orden.items.length,
            total: orden.total,
            direccion_envio: {
                nombre: orden.direccion_envio.nombre,
                ciudad: orden.direccion_envio.ciudad
            }
        };

        res.json({
            exito: true,
            mensaje: "Información de seguimiento obtenida",
            data: {
                orden: ordenProcesada
            }
        });

    } catch (error) {
        console.error("Error en obtenerOrdenPorCodigo:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Cancelar orden
 */
const cancelarOrden = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario_id = req.usuario.usuario_id;

        const orden = await ModeloOrden.findOne({ 
            orden_id: id, 
            usuario_id,
            estado: { $in: ['pendiente', 'pagada'] }
        });

        if (!orden) {
            return res.status(404).json({
                exito: false,
                mensaje: "Orden no encontrada o no se puede cancelar",
                codigo: "ORDER_NOT_FOUND"
            });
        }

        // Restaurar stock
        for (const item of orden.items) {
            await ModeloProducto.updateOne(
                { producto_id: item.producto_id },
                { $inc: { stock_disponible: item.cantidad } }
            );
        }

        orden.estado = 'cancelada';
        orden.fecha_cancelacion = new Date();
        await orden.save();

        // Crear notificación
        await crearNotificacionOrden(orden.orden_id, usuario_id, 'orden_cancelada');

        res.json({
            exito: true,
            mensaje: "Orden cancelada exitosamente"
        });

    } catch (error) {
        console.error("Error en cancelarOrden:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Confirmar recepción de orden
 */
const confirmarRecepcion = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario_id = req.usuario.usuario_id;

        const orden = await ModeloOrden.findOne({ 
            orden_id: id, 
            usuario_id,
            estado: 'enviada'
        });

        if (!orden) {
            return res.status(404).json({
                exito: false,
                mensaje: "Orden no encontrada o no se puede confirmar",
                codigo: "ORDER_NOT_FOUND"
            });
        }

        orden.estado = 'entregada';
        orden.fecha_entrega = new Date();
        await orden.save();

        // Crear notificación
        await crearNotificacionOrden(orden.orden_id, usuario_id, 'orden_entregada');

        res.json({
            exito: true,
            mensaje: "Recepción confirmada exitosamente"
        });

    } catch (error) {
        console.error("Error en confirmarRecepcion:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Procesar pago con tarjeta
 */
const procesarPagoTarjeta = async (orden_id, datos) => {
    try {
        const { numero_tarjeta, fecha_vencimiento, cvv, nombre_tarjeta } = datos;
        const usuario_id = req.usuario.usuario_id; // This line was not in the original file, but should be added for context

        const orden = await ModeloOrden.findOne({ 
            orden_id: orden_id, 
            usuario_id,
            estado: 'pendiente'
        });

        if (!orden) {
            return res.status(404).json({
                exito: false,
                mensaje: "Orden no encontrada",
                codigo: "ORDER_NOT_FOUND"
            });
        }

        // Aquí se integraría con el gateway de pago real
        // Por ahora simulamos el procesamiento
        const resultadoPago = await simularPagoTarjeta({
            numero_tarjeta,
            fecha_vencimiento,
            cvv,
            nombre_tarjeta,
            monto: orden.total
        });

        if (resultadoPago.exito) {
            orden.estado = 'pagada';
            orden.fecha_pago = new Date();
            orden.datos_pago = {
                metodo: 'tarjeta_credito',
                referencia: resultadoPago.referencia,
                ultimos_digitos: numero_tarjeta.slice(-4)
            };
            await orden.save();

            // Crear notificación
            await crearNotificacionOrden(orden.orden_id, usuario_id, 'pago_exitoso');
        }

        return resultadoPago;

    } catch (error) {
        console.error("Error en procesarPagoTarjeta:", error);
        return {
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        };
    }
};

/**
 * Procesar pago con transferencia
 */
const procesarPagoTransferencia = async (orden_id, datos) => {
    try {
        const { comprobante } = datos;
        const usuario_id = req.usuario.usuario_id; // This line was not in the original file, but should be added for context

        const orden = await ModeloOrden.findOne({ 
            orden_id: orden_id, 
            usuario_id,
            estado: 'pendiente'
        });

        if (!orden) {
            return res.status(404).json({
                exito: false,
                mensaje: "Orden no encontrada",
                codigo: "ORDER_NOT_FOUND"
            });
        }

        // Guardar comprobante y marcar como pendiente de verificación
        orden.estado = 'pendiente_verificacion';
        orden.datos_pago = {
            metodo: 'transferencia',
            comprobante: comprobante,
            fecha_subida: new Date()
        };
        await orden.save();

        // Crear notificación
        await crearNotificacionOrden(orden.orden_id, usuario_id, 'pago_pendiente_verificacion');

        return {
            exito: true,
            mensaje: "Comprobante de transferencia recibido. Será verificado en las próximas 24 horas."
        };

    } catch (error) {
        console.error("Error en procesarPagoTransferencia:", error);
        return {
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        };
    }
};

/**
 * Obtener opciones de envío
 */
const obtenerOpcionesEnvio = async (req, res) => {
    try {
        const opciones = [
            {
                id: 'estandar',
                nombre: 'Envío Estándar',
                descripcion: '5-7 días hábiles',
                precio: 15,
                icono: 'truck'
            },
            {
                id: 'express',
                nombre: 'Envío Express',
                descripcion: '2-3 días hábiles',
                precio: 25,
                icono: 'rocket'
            },
            {
                id: 'gratis',
                nombre: 'Envío Gratis',
                descripcion: 'Para compras mayores a S/ 200',
                precio: 0,
                icono: 'gift',
                condicion: 'minimo_compra',
                valor_condicion: 200
            }
        ];

        res.json({
            exito: true,
            mensaje: "Opciones de envío obtenidas",
            data: {
                opciones
            }
        });

    } catch (error) {
        console.error("Error en obtenerOpcionesEnvio:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Calcular costo de envío
 */
const calcularCostoEnvio = async (req, res) => {
    try {
        const { metodo_envio, subtotal, direccion } = req.body;

        let costoEnvio = 0;

        switch (metodo_envio) {
            case 'estandar':
                costoEnvio = 15;
                break;
            case 'express':
                costoEnvio = 25;
                break;
            case 'gratis':
                costoEnvio = subtotal >= 200 ? 0 : 15;
                break;
            default:
                costoEnvio = 15;
        }

        res.json({
            exito: true,
            mensaje: "Costo de envío calculado",
            data: {
                costo_envio: costoEnvio,
                metodo_envio,
                tiempo_estimado: metodo_envio === 'express' ? '2-3 días' : '5-7 días'
            }
        });

    } catch (error) {
        console.error("Error en calcularCostoEnvio:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Crear reseña para orden
 */
const crearResenaOrden = async (req, res) => {
    try {
        const { id } = req.params;
        const { producto_id, calificacion, comentario } = req.body;
        const usuario_id = req.usuario.usuario_id;

        // Verificar que la orden pertenece al usuario y está entregada
        const orden = await ModeloOrden.findOne({
            orden_id: id,
            usuario_id,
            estado: 'entregada'
        });

        if (!orden) {
            return res.status(404).json({
                exito: false,
                mensaje: "Orden no encontrada o no se puede reseñar",
                codigo: "ORDER_NOT_FOUND"
            });
        }

        // Verificar que el producto está en la orden
        const itemEnOrden = orden.items.find(item => item.producto_id.toString() === producto_id);
        if (!itemEnOrden) {
            return res.status(400).json({
                exito: false,
                mensaje: "Producto no encontrado en la orden",
                codigo: "PRODUCT_NOT_IN_ORDER"
            });
        }

        // Crear reseña
        const nuevaResena = new ModeloResena({
            producto_id,
            usuario_id,
            orden_id: id,
            calificacion,
            comentario
        });

        await nuevaResena.save();

        // Actualizar calificación promedio del producto
        await actualizarCalificacionProducto(producto_id);

        res.status(201).json({
            exito: true,
            mensaje: "Reseña creada exitosamente",
            data: {
                resena: {
                    resena_id: nuevaResena.resena_id,
                    calificacion: nuevaResena.calificacion,
                    comentario: nuevaResena.comentario,
                    fecha_creacion: nuevaResena.fecha_creacion
                }
            }
        });

    } catch (error) {
        console.error("Error en crearResenaOrden:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

// ========================================
// MÉTODOS AUXILIARES
// ========================================

/**
 * Generar código único de orden
 */
const generarCodigoOrden = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `ELB-${timestamp}-${random}`.toUpperCase();
};

/**
 * Simular procesamiento de pago con tarjeta
 */
const simularPagoTarjeta = async (datos) => {
    // Simulación de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simular éxito en 90% de los casos
    const exito = Math.random() > 0.1;
    
    if (exito) {
        return {
            exito: true,
            referencia: `TXN-${Date.now()}`,
            mensaje: "Pago procesado exitosamente"
        };
    } else {
        throw new Error("Tarjeta rechazada");
    }
};

/**
 * Crear notificación para orden
 */
const crearNotificacionOrden = async (orden_id, usuario_id, tipo) => {
    const mensajes = {
        'orden_creada': 'Tu orden ha sido creada exitosamente',
        'pago_exitoso': 'El pago de tu orden ha sido procesado',
        'orden_enviada': 'Tu orden ha sido enviada',
        'orden_entregada': 'Tu orden ha sido entregada',
        'orden_cancelada': 'Tu orden ha sido cancelada',
        'pago_pendiente_verificacion': 'Tu comprobante de pago está siendo verificado'
    };

    const notificacion = new ModeloNotificacion({
        usuario_id,
        tipo: tipo,
        titulo: 'Actualización de Orden',
        mensaje: mensajes[tipo] || 'Tu orden ha sido actualizada',
        datos_adicionales: { orden_id, tipo },
        leida: false
    });

    await notificacion.save();
};

/**
 * Actualizar calificación promedio de producto
 */
const actualizarCalificacionProducto = async (producto_id) => {
    const resenas = await ModeloResena.find({ producto_id, estado: true });
    
    if (resenas.length > 0) {
        const promedio = resenas.reduce((sum, resena) => sum + resena.calificacion, 0) / resenas.length;
        
        await ModeloProducto.updateOne(
            { producto_id },
            { 
                calificacion_promedio: promedio,
                numero_resenas: resenas.length
            }
        );
    }
};

module.exports = {
    procesarCheckout,
    obtenerOrdenesUsuario,
    obtenerOrdenPorId,
    obtenerOrdenPorCodigo,
    cancelarOrden,
    confirmarRecepcion,
    procesarPagoTarjeta,
    procesarPagoTransferencia,
    obtenerOpcionesEnvio,
    calcularCostoEnvio,
    crearResenaOrden
};