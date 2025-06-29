const ModeloProducto = require("../../models/producto.model");
const ModeloCategoria = require("../../models/categoria.model");
const ModeloInventario = require("../../models/inventario.model");

const obtenerTodosLosProductos = async (req, res) => {
    try {
        const { page = 1, limit = 10, activo } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const filtros = {};
        if (activo !== undefined) {
            filtros.activo = activo === 'true';
        }
        
        const [productos, total] = await Promise.all([
            ModeloProducto.find(filtros)
                .sort({ fecha_publicacion: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            ModeloProducto.countDocuments(filtros)
        ]);
        
        res.json({
            exito: true,
            mensaje: "Productos obtenidos exitosamente (Admin)",
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
        console.error("Error en obtenerTodosLosProductos:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

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
        
        if (!titulo || !descripcion || !precio || !estado || !categoria_id) {
            return res.status(400).json({
                exito: false,
                mensaje: "Título, descripción, precio, estado y categoría son requeridos",
                codigo: "MISSING_FIELDS"
            });
        }
        
        const categoria = await ModeloCategoria.findOne({ 
            categoria_id,
            $or: [
                { activa: true },
                { activa: { $exists: false } }
            ]
        });
        
        if (!categoria) {
            return res.status(400).json({
                exito: false,
                mensaje: "La categoría especificada no existe",
                codigo: "INVALID_CATEGORY"
            });
        }
        
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
            categoria_id
        });
        
        await nuevoProducto.save();
        
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

const actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, descripcion, precio, estado, stock, marca, modelo, categoria_id, activo } = req.body;
        
        const producto = await ModeloProducto.findOne({ producto_id: id });
        
        if (!producto) {
            return res.status(404).json({
                exito: false,
                mensaje: "Producto no encontrado",
                codigo: "PRODUCT_NOT_FOUND"
            });
        }
        
        if (titulo) producto.titulo = titulo;
        if (descripcion) producto.descripcion = descripcion;
        if (precio) producto.precio = parseFloat(precio);
        if (estado) producto.estado = estado;
        if (stock !== undefined) producto.stock = parseInt(stock);
        if (marca !== undefined) producto.marca = marca;
        if (modelo !== undefined) producto.modelo = modelo;
        if (categoria_id) producto.categoria_id = categoria_id;
        if (activo !== undefined) producto.activo = activo;
        
        await producto.save();
        
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

module.exports = {
    obtenerTodosLosProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto
};