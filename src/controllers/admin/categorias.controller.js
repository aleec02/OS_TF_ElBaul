const ModeloCategoria = require("../../models/categoria.model");
const ModeloProducto = require("../../models/producto.model");

/**
 * Obtener todas las categorías incluyendo inactivas (ADMIN)
 */
const obtenerTodasLasCategorias = async (req, res) => {
    try {
        const { activa } = req.query;
        
        // Filtros para admin (puede ver inactivas también)
        const filtros = {};
        if (activa !== undefined) {
            filtros.activa = activa === 'true';
        }
        
        const categorias = await ModeloCategoria.find(filtros).sort({ nombre: 1 });
        
        res.json({
            exito: true,
            mensaje: "Categorías obtenidas exitosamente (Admin)",
            data: {
                categorias: categorias.map(cat => ({
                    categoria_id: cat.categoria_id,
                    nombre: cat.nombre,
                    descripcion: cat.descripcion,
                    imagen_url: cat.imagen_url,
                    activa: cat.activa !== false
                })),
                total: categorias.length
            }
        });
        
    } catch (error) {
        console.error("Error en obtenerTodasLasCategorias:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Crear nueva categoría (ADMIN)
 */
const crearCategoria = async (req, res) => {
    try {
        const { nombre, descripcion, imagen_url } = req.body;
        
        if (!nombre) {
            return res.status(400).json({
                exito: false,
                mensaje: "El nombre de la categoría es requerido",
                codigo: "MISSING_NAME"
            });
        }
        
        // Verificar si ya existe una categoría con el mismo nombre
        const categoriaExistente = await ModeloCategoria.findOne({ 
            nombre: { $regex: new RegExp(`^${nombre}$`, 'i') }
        });
        
        if (categoriaExistente) {
            return res.status(400).json({
                exito: false,
                mensaje: "Ya existe una categoría con este nombre",
                codigo: "CATEGORY_EXISTS"
            });
        }
        
        const nuevaCategoria = new ModeloCategoria({
            nombre,
            descripcion,
            imagen_url,
            activa: true
        });
        
        await nuevaCategoria.save();
        
        res.status(201).json({
            exito: true,
            mensaje: "Categoría creada exitosamente",
            data: {
                categoria: nuevaCategoria.obtenerDatosPublicos()
            }
        });
        
    } catch (error) {
        console.error("Error en crearCategoria:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Actualizar categoría (ADMIN)
 */
const actualizarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, imagen_url, activa } = req.body;
        
        const categoria = await ModeloCategoria.findOne({ categoria_id: id });
        
        if (!categoria) {
            return res.status(404).json({
                exito: false,
                mensaje: "Categoría no encontrada",
                codigo: "CATEGORY_NOT_FOUND"
            });
        }
        
        // Verificar nombre duplicado si se está cambiando
        if (nombre && nombre !== categoria.nombre) {
            const categoriaExistente = await ModeloCategoria.findOne({ 
                nombre: { $regex: new RegExp(`^${nombre}$`, 'i') },
                categoria_id: { $ne: id }
            });
            
            if (categoriaExistente) {
                return res.status(400).json({
                    exito: false,
                    mensaje: "Ya existe una categoría con este nombre",
                    codigo: "CATEGORY_EXISTS"
                });
            }
        }
        
        // Actualizar campos
        if (nombre) categoria.nombre = nombre;
        if (descripcion !== undefined) categoria.descripcion = descripcion;
        if (imagen_url !== undefined) categoria.imagen_url = imagen_url;
        if (activa !== undefined) categoria.activa = activa;
        
        await categoria.save();
        
        res.json({
            exito: true,
            mensaje: "Categoría actualizada exitosamente",
            data: {
                categoria: categoria.obtenerDatosPublicos()
            }
        });
        
    } catch (error) {
        console.error("Error en actualizarCategoria:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Eliminar categoría (ADMIN)
 */
const eliminarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        
        const categoria = await ModeloCategoria.findOne({ categoria_id: id });
        
        if (!categoria) {
            return res.status(404).json({
                exito: false,
                mensaje: "Categoría no encontrada",
                codigo: "CATEGORY_NOT_FOUND"
            });
        }
        
        // Verificar si hay productos asociados
        const productosAsociados = await ModeloProducto.countDocuments({ 
            categoria_id: id,
            $or: [
                { activo: true },
                { activo: { $exists: false } }
            ]
        });
        
        if (productosAsociados > 0) {
            return res.status(400).json({
                exito: false,
                mensaje: `No se puede eliminar la categoría. Tiene ${productosAsociados} productos asociados`,
                codigo: "CATEGORY_HAS_PRODUCTS"
            });
        }
        
        // Marcar como inactiva
        categoria.activa = false;
        await categoria.save();
        
        res.json({
            exito: true,
            mensaje: "Categoría eliminada exitosamente"
        });
        
    } catch (error) {
        console.error("Error en eliminarCategoria:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

module.exports = {
    obtenerTodasLasCategorias,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria
};