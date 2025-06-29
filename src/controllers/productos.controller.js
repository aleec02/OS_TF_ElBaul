const ModeloProducto = require("../models/producto.model");
const ModeloCategoria = require("../models/categoria.model");
const ModeloInventario = require("../models/inventario.model");

/**
 * Obtener todos los productos con filtros
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
        
        // Construir filtros

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
            filtros.$or = [
                { titulo: { $regex: buscar, $options: 'i' } },
                { descripcion: { $regex: buscar, $options: 'i' } },
                { marca: { $regex: buscar, $options: 'i' } }
            ];
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
 * Obtener producto por ID
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
 * Buscar productos por término
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

/**
 * Crear nuevo producto (requiere autenticación)
 */
const crearProducto = async (req, res) => {
    try {
        const {
            titulo,
            descripcion,
            precio,
            estado,
            stock,
            ubicacion_almacen,
            marca,
            modelo,
            año_fabricacion,
            categoria_id
        } = req.body;
        
        // Validaciones básicas
        if (!titulo || !descripcion || !precio || !estado || !categoria_id) {
            return res.status(400).json({
                exito: false,
                mensaje: "Título, descripción, precio, estado y categoría son requeridos",
                codigo: "MISSING_FIELDS"
            });
        }
        
        // Verificar que la categoría existe
        const categoria = await ModeloCategoria.findOne({ 
            categoria_id, 
            activa: true 
        });
        
        if (!categoria) {
            return res.status(400).json({
                exito: false,
                mensaje: "La categoría especificada no existe",
                codigo: "INVALID_CATEGORY"
            });
        }
        
        // Crear producto
        const nuevoProducto = new ModeloProducto({
            titulo,
            descripcion,
            precio: parseFloat(precio),
            estado,
            stock: stock || 1,
            ubicacion_almacen,
            marca,
            modelo,
            año_fabricacion: año_fabricacion ? parseInt(año_fabricacion) : undefined,
            categoria_id,
            usuario_id: req.usuario.usuario_id
        });
        
        await nuevoProducto.save();
        
        // Crear registro de inventario
        const nuevoInventario = new ModeloInventario({
            producto_id: nuevoProducto.producto_id,
            cantidad_disponible: nuevoProducto.stock,
            cantidad_reservada: 0,
            ubicacion: ubicacion_almacen
        });
        
        await nuevoInventario.save();
        
        res.status(201).json({
            exito: true,
            mensaje: "Producto creado exitosamente",
            data: {
                producto: nuevoProducto.obtenerDatosPublicos()
            }
        });
        
    } catch (error) {
        console.error("Error en crearProducto:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Actualizar producto (solo propietario o admin)
 */
const actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            titulo,
            descripcion,
            precio,
            estado,
            stock,
            ubicacion_almacen,
            marca,
            modelo,
            año_fabricacion,
            categoria_id
        } = req.body;
        
        const producto = await ModeloProducto.findOne({ producto_id: id });
        
        if (!producto) {
            return res.status(404).json({
                exito: false,
                mensaje: "Producto no encontrado",
                codigo: "PRODUCT_NOT_FOUND"
            });
        }
        
        // Verificar permisos (propietario o admin)
        if (producto.usuario_id !== req.usuario.usuario_id && req.usuario.rol !== 'admin') {
            return res.status(403).json({
                exito: false,
                mensaje: "No tienes permisos para modificar este producto",
                codigo: "ACCESS_DENIED"
            });
        }
        
        // Verificar categoría si se está cambiando
        if (categoria_id && categoria_id !== producto.categoria_id) {
            const categoria = await ModeloCategoria.findOne({ 
                categoria_id, 
                activa: true 
            });
            
            if (!categoria) {
                return res.status(400).json({
                    exito: false,
                    mensaje: "La categoría especificada no existe",
                    codigo: "INVALID_CATEGORY"
                });
            }
        }
        
        // Actualizar campos
        if (titulo) producto.titulo = titulo;
        if (descripcion) producto.descripcion = descripcion;
        if (precio) producto.precio = parseFloat(precio);
        if (estado) producto.estado = estado;
        if (stock !== undefined) producto.stock = parseInt(stock);
        if (ubicacion_almacen !== undefined) producto.ubicacion_almacen = ubicacion_almacen;
        if (marca !== undefined) producto.marca = marca;
        if (modelo !== undefined) producto.modelo = modelo;
        if (año_fabricacion) producto.año_fabricacion = parseInt(año_fabricacion);
        if (categoria_id) producto.categoria_id = categoria_id;
        
        await producto.save();
        
        // Actualizar inventario si cambió el stock
        if (stock !== undefined) {
            await ModeloInventario.findOneAndUpdate(
                { producto_id: id },
                { cantidad_disponible: parseInt(stock) }
            );
        }
        
        res.json({
            exito: true,
            mensaje: "Producto actualizado exitosamente",
            data: {
                producto: producto.obtenerDatosPublicos()
            }
        });
        
    } catch (error) {
        console.error("Error en actualizarProducto:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Eliminar producto (solo propietario o admin)
 */
const eliminarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        
        const producto = await ModeloProducto.findOne({ producto_id: id });
        
        if (!producto) {
            return res.status(404).json({
                exito: false,
                mensaje: "Producto no encontrado",
                codigo: "PRODUCT_NOT_FOUND"
            });
        }
        
        // Verificar permisos
        if (producto.usuario_id !== req.usuario.usuario_id && req.usuario.rol !== 'admin') {
            return res.status(403).json({
                exito: false,
                mensaje: "No tienes permisos para eliminar este producto",
                codigo: "ACCESS_DENIED"
            });
        }
        
        // Marcar como inactivo en lugar de eliminar
        producto.activo = false;
        await producto.save();
        
        res.json({
            exito: true,
            mensaje: "Producto eliminado exitosamente"
        });
        
    } catch (error) {
        console.error("Error en eliminarProducto:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Obtener productos del usuario autenticado
 */
const obtenerMisProductos = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [productos, total] = await Promise.all([
            ModeloProducto.find({ 
                usuario_id: req.usuario.usuario_id,
                activo: true 
            })
            .sort({ fecha_publicacion: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean(),
            ModeloProducto.countDocuments({ 
                usuario_id: req.usuario.usuario_id,
                activo: true 
            })
        ]);
        
        res.json({
            exito: true,
            mensaje: "Mis productos obtenidos exitosamente",
            data: {
                productos,
                paginacion: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
        
    } catch (error) {
        console.error("Error en obtenerMisProductos:", error);
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
    buscarProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    obtenerMisProductos
};