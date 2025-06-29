const ModeloProducto = require("../models/producto.model");
const ModeloCategoria = require("../models/categoria.model");
const ModeloInventario = require("../models/inventario.model");

/**
 * Obtener todos los productos con filtros (PÚBLICO)
 */
const obtenerProductos = async (req, res) => {
    try {
        const { 
            categoria_id, 
            precio_min, 
            precio_max, 
            estado, 
            buscar,
            page = 1, 
            limit = 10,
            orden = 'recientes'
        } = req.query;
        
        // Filtros para productos activos (sin verificar usuario_id)
        const filtros = { 
            $or: [
                { activo: true },
                { activo: { $exists: false } }
            ]
        };
        
        if (categoria_id) {
            filtros.categoria_id = categoria_id;
        }
        
        if (precio_min || precio_max) {
            filtros.precio = {};
            if (precio_min) filtros.precio.$gte = parseFloat(precio_min);
            if (precio_max) filtros.precio.$lte = parseFloat(precio_max);
        }
        
        if (estado) {
            filtros.estado = estado;
        }
        
        // Búsqueda por texto
        if (buscar) {
            filtros.$and = filtros.$and || [];
            filtros.$and.push({
                $or: [
                    { titulo: { $regex: buscar, $options: 'i' } },
                    { descripcion: { $regex: buscar, $options: 'i' } },
                    { marca: { $regex: buscar, $options: 'i' } }
                ]
            });
        }
        
        // Configurar ordenamiento
        let ordenamiento = {};
        switch (orden) {
            case 'precio_asc':
                ordenamiento = { precio: 1 };
                break;
            case 'precio_desc':
                ordenamiento = { precio: -1 };
                break;
            case 'antiguos':
                ordenamiento = { fecha_publicacion: 1 };
                break;
            case 'recientes':
            default:
                ordenamiento = { fecha_publicacion: -1 };
                break;
        }
        
        // Paginación
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);
        
        // Ejecutar consultas
        const [productos, total] = await Promise.all([
            ModeloProducto.find(filtros)
                .sort(ordenamiento)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            ModeloProducto.countDocuments(filtros)
        ]);
        
        res.json({
            exito: true,
            mensaje: "Productos obtenidos exitosamente",
            data: {
                productos,
                paginacion: {
                    total,
                    page: parseInt(page),
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum)
                },
                filtros_aplicados: {
                    categoria_id,
                    precio_min,
                    precio_max,
                    estado,
                    buscar,
                    orden
                }
            }
        });
        
    } catch (error) {
        console.error("Error en obtenerProductos:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Obtener producto por ID (PÚBLICO)
 */
const obtenerProductoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        
        const producto = await ModeloProducto.findOne({ 
            producto_id: id,
            $or: [
                { activo: true },
                { activo: { $exists: false } }
            ]
        }).lean();
        
        if (!producto) {
            return res.status(404).json({
                exito: false,
                mensaje: "Producto no encontrado",
                codigo: "PRODUCT_NOT_FOUND"
            });
        }
        
        // Obtener información adicional
        const [categoria, inventario] = await Promise.all([
            ModeloCategoria.findOne({ categoria_id: producto.categoria_id }).lean(),
            ModeloInventario.findOne({ producto_id: id }).lean()
        ]);
        
        res.json({
            exito: true,
            mensaje: "Producto obtenido exitosamente",
            data: {
                producto: {
                    ...producto,
                    categoria: categoria ? categoria.nombre : null,
                    stock_disponible: inventario ? inventario.cantidad_disponible : 0
                }
            }
        });
        
    } catch (error) {
        console.error("Error en obtenerProductoPorId:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Buscar productos por término (PÚBLICO)
 */
const buscarProductos = async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;
        
        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                exito: false,
                mensaje: "El término de búsqueda debe tener al menos 2 caracteres",
                codigo: "INVALID_SEARCH_TERM"
            });
        }
        
        const termino = q.trim();
        
        const productos = await ModeloProducto.find({
            $or: [
                { activo: true },
                { activo: { $exists: false } }
            ],
            $and: [
                {
                    $or: [
                        { titulo: { $regex: termino, $options: 'i' } },
                        { descripcion: { $regex: termino, $options: 'i' } },
                        { marca: { $regex: termino, $options: 'i' } }
                    ]
                }
            ]
        })
        .sort({ fecha_publicacion: -1 })
        .limit(parseInt(limit))
        .lean();
        
        res.json({
            exito: true,
            mensaje: "Búsqueda completada exitosamente",
            data: {
                productos,
                total: productos.length,
                termino_busqueda: termino
            }
        });
        
    } catch (error) {
        console.error("Error en buscarProductos:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

module.exports = {
    obtenerProductos,
    obtenerProductoPorId,
    buscarProductos
};