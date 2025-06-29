const ModeloCategoria = require("../models/categoria.model");

/**
 * Obtener todas las categorías activas
 */
const obtenerCategorias = async (req, res) => {
    try {
        const categorias = await ModeloCategoria.find({
            $or: [
                { activa: true },
                { activa: { $exists: false } }
            ]
        }).sort({ nombre: 1 });
        
        res.json({
            exito: true,
            mensaje: "Categorías obtenidas exitosamente",
            data: {
                categorias: categorias.map(cat => ({
                    categoria_id: cat.categoria_id,
                    nombre: cat.nombre,
                    descripcion: cat.descripcion,
                    imagen_url: cat.imagen_url,
                    activa: cat.activa !== false // true por defecto si no existe
                })),
                total: categorias.length
            }
        });
        
    } catch (error) {
        console.error("Error en obtenerCategorias:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Obtener categoría por ID
 */
const obtenerCategoriaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        
        const categoria = await ModeloCategoria.findOne({ 
            categoria_id: id,
            $or: [
                { activa: true },
                { activa: { $exists: false } }
            ]
        });
        
        if (!categoria) {
            return res.status(404).json({
                exito: false,
                mensaje: "Categoría no encontrada",
                codigo: "CATEGORY_NOT_FOUND"
            });
        }
        
        res.json({
            exito: true,
            mensaje: "Categoría obtenida exitosamente",
            data: {
                categoria: {
                    categoria_id: categoria.categoria_id,
                    nombre: categoria.nombre,
                    descripcion: categoria.descripcion,
                    imagen_url: categoria.imagen_url,
                    activa: categoria.activa !== false
                }
            }
        });
        
    } catch (error) {
        console.error("Error en obtenerCategoriaPorId:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};


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
            imagen_url
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

const actualizarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, imagen_url } = req.body;
        
        const categoria = await ModeloCategoria.findOne({ categoria_id: id });
        
        if (!categoria) {
            return res.status(404).json({
                exito: false,
                mensaje: "Categoría no encontrada",
                codigo: "CATEGORY_NOT_FOUND"
            });
        }
        
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
        
        if (nombre) categoria.nombre = nombre;
        if (descripcion !== undefined) categoria.descripcion = descripcion;
        if (imagen_url !== undefined) categoria.imagen_url = imagen_url;
        
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
        
        const ModeloProducto = require("../models/producto.model");
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
    obtenerCategorias,
    obtenerCategoriaPorId,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria
};