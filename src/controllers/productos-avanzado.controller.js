const ModeloProducto = require("../models/producto.model");
const ModeloCategoria = require("../models/categoria.model");

/**
 * Comparar productos
 */
const compararProductos = async (req, res) => {
    try {
        const { productos } = req.query;
        const usuario_id = req.usuario?.usuario_id;

        if (!productos) {
            return res.status(400).json({
                exito: false,
                mensaje: "Se requiere especificar productos para comparar",
                codigo: "MISSING_PRODUCTS"
            });
        }

        const productoIds = productos.split(',');
        
        if (productoIds.length < 2) {
            return res.status(400).json({
                exito: false,
                mensaje: "Se requieren al menos 2 productos para comparar",
                codigo: "INSUFFICIENT_PRODUCTS"
            });
        }

        if (productoIds.length > 4) {
            return res.status(400).json({
                exito: false,
                mensaje: "Máximo 4 productos para comparar",
                codigo: "TOO_MANY_PRODUCTS"
            });
        }

        const productosData = await ModeloProducto.find({
            producto_id: { $in: productoIds },
            estado: true
        })
        .populate('categoria_id', 'nombre');

        if (productosData.length !== productoIds.length) {
            return res.status(404).json({
                exito: false,
                mensaje: "Algunos productos no fueron encontrados",
                codigo: "PRODUCTS_NOT_FOUND"
            });
        }

        // Obtener características comparables
        const caracteristicas = obtenerCaracteristicasComparables(productosData);

        const comparacion = {
            productos: productosData.map(producto => ({
                producto_id: producto.producto_id,
                titulo: producto.titulo,
                imagen_principal: producto.imagen_principal,
                precio: producto.precio,
                precio_original: producto.precio_original,
                calificacion_promedio: producto.calificacion_promedio,
                numero_resenas: producto.numero_resenas,
                stock_disponible: producto.stock_disponible,
                marca: producto.marca,
                modelo: producto.modelo,
                categoria: producto.categoria_id?.nombre,
                estado: producto.estado_producto,
                garantia: producto.garantia,
                dimensiones: producto.dimensiones,
                peso: producto.peso,
                color: producto.color,
                caracteristicas: producto.caracteristicas,
                incluye: producto.incluye,
                ubicacion: producto.ubicacion
            })),
            caracteristicas_comparables: caracteristicas
        };

        res.json({
            exito: true,
            mensaje: "Comparación generada exitosamente",
            data: comparacion
        });

    } catch (error) {
        console.error("Error en compararProductos:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Obtener recomendaciones de productos
 */
const obtenerRecomendaciones = async (req, res) => {
    try {
        const { productos, categoria_id, precio_max, limit = 10 } = req.query;
        const usuario_id = req.usuario?.usuario_id;

        let filtros = { estado: true };
        let pipeline = [];

        // Si se proporcionan productos específicos, buscar similares
        if (productos) {
            const productoIds = productos.split(',');
            const productosReferencia = await ModeloProducto.find({
                producto_id: { $in: productoIds }
            });

            if (productosReferencia.length > 0) {
                const categoriasReferencia = productosReferencia.map(p => p.categoria_id);
                const marcasReferencia = productosReferencia.map(p => p.marca).filter(Boolean);
                const rangosPrecio = productosReferencia.map(p => p.precio);

                pipeline = [
                    { $match: { 
                        estado: true,
                        producto_id: { $nin: productoIds }
                    }},
                    {
                        $addFields: {
                            score: {
                                $add: [
                                    // Puntuación por categoría
                                    { $cond: [
                                        { $in: ["$categoria_id", categoriasReferencia] },
                                        3,
                                        0
                                    ]},
                                    // Puntuación por marca
                                    { $cond: [
                                        { $in: ["$marca", marcasReferencia] },
                                        2,
                                        0
                                    ]},
                                    // Puntuación por rango de precio
                                    { $cond: [
                                        { $and: [
                                            { $gte: ["$precio", Math.min(...rangosPrecio) * 0.7] },
                                            { $lte: ["$precio", Math.max(...rangosPrecio) * 1.3] }
                                        ]},
                                        1,
                                        0
                                    ]}
                                ]
                            }
                        }
                    },
                    { $match: { score: { $gt: 0 } } },
                    { $sort: { score: -1, calificacion_promedio: -1 } },
                    { $limit: parseInt(limit) }
                ];
            }
        } else {
            // Recomendaciones basadas en popularidad y calificación
            pipeline = [
                { $match: filtros },
                { $sort: { 
                    calificacion_promedio: -1, 
                    numero_resenas: -1,
                    fecha_creacion: -1 
                }},
                { $limit: parseInt(limit) }
            ];
        }

        // Aplicar filtros adicionales
        if (categoria_id) {
            pipeline[0].$match.categoria_id = categoria_id;
        }
        if (precio_max) {
            pipeline[0].$match.precio = { $lte: parseFloat(precio_max) };
        }

        const recomendaciones = await ModeloProducto.aggregate(pipeline);

        // Populate referencias
        await ModeloProducto.populate(recomendaciones, [
            { path: 'categoria_id', select: 'nombre' }
        ]);

        const productosProcesados = recomendaciones.map(producto => ({
            producto_id: producto.producto_id,
            titulo: producto.titulo,
            imagen_principal: producto.imagen_principal,
            precio: producto.precio,
            precio_original: producto.precio_original,
            calificacion_promedio: producto.calificacion_promedio,
            numero_resenas: producto.numero_resenas,
            stock_disponible: producto.stock_disponible,
            marca: producto.marca,
            modelo: producto.modelo,
            categoria: producto.categoria_id?.nombre,
            estado: producto.estado_producto,
            garantia: producto.garantia,
            dimensiones: producto.dimensiones,
            peso: producto.peso,
            color: producto.color,
            caracteristicas: producto.caracteristicas,
            incluye: producto.incluye,
            ubicacion: producto.ubicacion,
            score: producto.score || 0
        }));

        res.json({
            exito: true,
            mensaje: "Recomendaciones obtenidas exitosamente",
            data: {
                productos: productosProcesados,
                total: productosProcesados.length,
                filtros_aplicados: {
                    productos_referencia: productos ? productos.split(',').length : 0,
                    categoria_id,
                    precio_max
                }
            }
        });

    } catch (error) {
        console.error("Error en obtenerRecomendaciones:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Búsqueda avanzada de productos
 */
const busquedaAvanzada = async (req, res) => {
    try {
        const {
            q,
            categoria_id,
            precio_min,
            precio_max,
            marca,
            estado_producto,
            calificacion_min,
            ubicacion,
            ordenar_por = 'relevancia',
            orden = 'desc',
            page = 1,
            limit = 20
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        let filtros = { estado: true };

        // Filtro de búsqueda por texto
        if (q) {
            filtros.$or = [
                { titulo: { $regex: q, $options: 'i' } },
                { descripcion: { $regex: q, $options: 'i' } },
                { marca: { $regex: q, $options: 'i' } },
                { modelo: { $regex: q, $options: 'i' } }
            ];
        }

        // Filtros adicionales
        if (categoria_id) filtros.categoria_id = categoria_id;
        if (marca) filtros.marca = { $regex: marca, $options: 'i' };
        if (estado_producto) filtros.estado_producto = estado_producto;
        if (ubicacion) filtros.ubicacion = { $regex: ubicacion, $options: 'i' };

        // Filtro de precio
        if (precio_min || precio_max) {
            filtros.precio = {};
            if (precio_min) filtros.precio.$gte = parseFloat(precio_min);
            if (precio_max) filtros.precio.$lte = parseFloat(precio_max);
        }

        // Filtro de calificación
        if (calificacion_min) {
            filtros.calificacion_promedio = { $gte: parseFloat(calificacion_min) };
        }

        // Ordenamiento
        let ordenamiento = {};
        switch (ordenar_por) {
            case 'precio':
                ordenamiento.precio = orden === 'asc' ? 1 : -1;
                break;
            case 'calificacion':
                ordenamiento.calificacion_promedio = orden === 'asc' ? 1 : -1;
                break;
            case 'fecha':
                ordenamiento.fecha_creacion = orden === 'asc' ? 1 : -1;
                break;
            case 'relevancia':
            default:
                ordenamiento = { score: { $meta: 'textScore' } };
                break;
        }

        const pipeline = [
            { $match: filtros },
            {
                $lookup: {
                    from: 'categorias',
                    localField: 'categoria_id',
                    foreignField: 'categoria_id',
                    as: 'categoria'
                }
            },
            { $unwind: { path: '$categoria', preserveNullAndEmptyArrays: true } },
            { $sort: ordenamiento },
            { $skip: skip },
            { $limit: parseInt(limit) }
        ];

        const productos = await ModeloProducto.aggregate(pipeline);
        const total = await ModeloProducto.countDocuments(filtros);

        const productosProcesados = productos.map(producto => ({
            producto_id: producto.producto_id,
            titulo: producto.titulo,
            imagen_principal: producto.imagen_principal,
            precio: producto.precio,
            precio_original: producto.precio_original,
            calificacion_promedio: producto.calificacion_promedio,
            numero_resenas: producto.numero_resenas,
            stock_disponible: producto.stock_disponible,
            marca: producto.marca,
            modelo: producto.modelo,
            categoria: producto.categoria?.nombre,
            estado: producto.estado_producto,
            garantia: producto.garantia,
            dimensiones: producto.dimensiones,
            peso: producto.peso,
            color: producto.color,
            caracteristicas: producto.caracteristicas,
            incluye: producto.incluye,
            ubicacion: producto.ubicacion
        }));

        res.json({
            exito: true,
            mensaje: "Búsqueda realizada exitosamente",
            data: {
                productos: productosProcesados,
                paginacion: {
                    pagina_actual: parseInt(page),
                    total_paginas: Math.ceil(total / parseInt(limit)),
                    total_productos: total,
                    productos_por_pagina: parseInt(limit)
                },
                filtros_aplicados: {
                    termino_busqueda: q,
                    categoria_id,
                    precio_min,
                    precio_max,
                    marca,
                    estado_producto,
                    calificacion_min,
                    ubicacion,
                    ordenar_por,
                    orden
                }
            }
        });

    } catch (error) {
        console.error("Error en busquedaAvanzada:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Obtener productos similares
 */
const obtenerProductosSimilares = async (req, res) => {
    try {
        const { producto_id } = req.params;
        const { limit = 6 } = req.query;

        const producto = await ModeloProducto.findOne({ producto_id });
        if (!producto) {
            return res.status(404).json({
                exito: false,
                mensaje: "Producto no encontrado",
                codigo: "PRODUCT_NOT_FOUND"
            });
        }

        const pipeline = [
            {
                $match: {
                    estado: true,
                    producto_id: { $ne: producto_id }
                }
            },
            {
                $addFields: {
                    score: {
                        $add: [
                            // Puntuación por categoría
                            { $cond: [
                                { $eq: ["$categoria_id", producto.categoria_id] },
                                3,
                                0
                            ]},
                            // Puntuación por marca
                            { $cond: [
                                { $eq: ["$marca", producto.marca] },
                                2,
                                0
                            ]},
                            // Puntuación por rango de precio
                            { $cond: [
                                { $and: [
                                    { $gte: ["$precio", producto.precio * 0.7] },
                                    { $lte: ["$precio", producto.precio * 1.3] }
                                ]},
                                1,
                                0
                            ]}
                        ]
                    }
                }
            },
            { $match: { score: { $gt: 0 } } },
            { $sort: { score: -1, calificacion_promedio: -1 } },
            { $limit: parseInt(limit) }
        ];

        const productosSimilares = await ModeloProducto.aggregate(pipeline);

        // Populate referencias
        await ModeloProducto.populate(productosSimilares, [
            { path: 'categoria_id', select: 'nombre' }
        ]);

        const productosProcesados = productosSimilares.map(producto => ({
            producto_id: producto.producto_id,
            titulo: producto.titulo,
            imagen_principal: producto.imagen_principal,
            precio: producto.precio,
            precio_original: producto.precio_original,
            calificacion_promedio: producto.calificacion_promedio,
            numero_resenas: producto.numero_resenas,
            stock_disponible: producto.stock_disponible,
            marca: producto.marca,
            modelo: producto.modelo,
            categoria: producto.categoria_id?.nombre,
            estado: producto.estado_producto,
            garantia: producto.garantia,
            dimensiones: producto.dimensiones,
            peso: producto.peso,
            color: producto.color,
            caracteristicas: producto.caracteristicas,
            incluye: producto.incluye,
            ubicacion: producto.ubicacion,
            score: producto.score
        }));

        res.json({
            exito: true,
            mensaje: "Productos similares obtenidos exitosamente",
            data: {
                producto_original: {
                    producto_id: producto.producto_id,
                    titulo: producto.titulo,
                    categoria: producto.categoria_id
                },
                productos_similares: productosProcesados,
                total: productosProcesados.length
            }
        });

    } catch (error) {
        console.error("Error en obtenerProductosSimilares:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Obtener historial de precios (simulado)
 */
const obtenerHistorialPrecios = async (req, res) => {
    try {
        const { producto_id } = req.params;
        const { dias = 30 } = req.query;

        const producto = await ModeloProducto.findOne({ producto_id });
        if (!producto) {
            return res.status(404).json({
                exito: false,
                mensaje: "Producto no encontrado",
                codigo: "PRODUCT_NOT_FOUND"
            });
        }

        // Generar historial simulado
        const historial = generarHistorialPrecios(producto.precio, parseInt(dias));

        res.json({
            exito: true,
            mensaje: "Historial de precios obtenido exitosamente",
            data: {
                producto_id: producto.producto_id,
                titulo: producto.titulo,
                precio_actual: producto.precio,
                historial: historial,
                estadisticas: {
                    precio_minimo: Math.min(...historial.map(h => h.precio)),
                    precio_maximo: Math.max(...historial.map(h => h.precio)),
                    precio_promedio: historial.reduce((sum, h) => sum + h.precio, 0) / historial.length,
                    tendencia: historial[historial.length - 1].precio > historial[0].precio ? 'ascendente' : 'descendente'
                }
            }
        });

    } catch (error) {
        console.error("Error en obtenerHistorialPrecios:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Obtener estadísticas del producto
 */
const obtenerEstadisticasProducto = async (req, res) => {
    try {
        const { producto_id } = req.params;

        const producto = await ModeloProducto.findOne({ producto_id });
        if (!producto) {
            return res.status(404).json({
                exito: false,
                mensaje: "Producto no encontrado",
                codigo: "PRODUCT_NOT_FOUND"
            });
        }

        // Estadísticas básicas del producto
        const estadisticas = {
            producto_id: producto.producto_id,
            titulo: producto.titulo,
            precio_actual: producto.precio,
            precio_original: producto.precio_original,
            descuento: producto.precio_original ? 
                Math.round(((producto.precio_original - producto.precio) / producto.precio_original) * 100) : 0,
            calificacion_promedio: producto.calificacion_promedio || 0,
            numero_resenas: producto.numero_resenas || 0,
            stock_disponible: producto.stock_disponible || 0,
            estado_producto: producto.estado_producto,
            garantia: producto.garantia,
            ubicacion: producto.ubicacion,
            fecha_creacion: producto.fecha_creacion,
            ultima_actualizacion: producto.fecha_actualizacion
        };

        res.json({
            exito: true,
            mensaje: "Estadísticas obtenidas exitosamente",
            data: estadisticas
        });

    } catch (error) {
        console.error("Error en obtenerEstadisticasProducto:", error);
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
 * Obtener características comparables entre productos
 */
const obtenerCaracteristicasComparables = (productos) => {
    const caracteristicas = new Set();
    
    productos.forEach(producto => {
        if (producto.caracteristicas) {
            producto.caracteristicas.forEach(car => caracteristicas.add(car));
        }
    });

    return Array.from(caracteristicas);
};

/**
 * Generar historial de precios simulado
 */
const generarHistorialPrecios = (precioActual, dias) => {
    const historial = [];
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);

    for (let i = 0; i < dias; i++) {
        const fecha = new Date(fechaInicio);
        fecha.setDate(fechaInicio.getDate() + i);
        
        // Simular variación de precio (±10%)
        const variacion = (Math.random() - 0.5) * 0.2;
        const precio = precioActual * (1 + variacion);
        
        historial.push({
            fecha: fecha.toISOString().split('T')[0],
            precio: Math.round(precio * 100) / 100
        });
    }

    return historial;
};

module.exports = {
    compararProductos,
    obtenerRecomendaciones,
    busquedaAvanzada,
    obtenerProductosSimilares,
    obtenerHistorialPrecios,
    obtenerEstadisticasProducto
}; 