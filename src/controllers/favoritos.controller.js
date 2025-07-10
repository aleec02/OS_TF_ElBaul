const ModeloFavorito = require("../models/favorito.model");
const ModeloProducto = require("../models/producto.model");

/**
 * Obtener favoritos del usuario
 */
const obtenerFavoritos = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Obtener favoritos con información del producto e imágenes
        const favoritos = await ModeloFavorito.aggregate([
            { $match: { usuario_id: req.usuario.usuario_id } },
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
                $match: {
                    $or: [
                        { "producto.activo": true },
                        { "producto.activo": { $exists: false } }
                    ]
                }
            },
            {
                $lookup: {
                    from: "imagen_productos",
                    localField: "producto_id",
                    foreignField: "producto_id",
                    as: "imagenes"
                }
            },
            { $sort: { fecha_agregado: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
                $project: {
                    favorito_id: 1,
                    producto_id: 1,
                    fecha_agregado: 1,
                    "producto.producto_id": 1,
                    "producto.titulo": 1,
                    "producto.descripcion": 1,
                    "producto.precio": 1,
                    "producto.estado": 1,
                    "producto.marca": 1,
                    "producto.categoria_id": 1,
                    "producto.stock": 1,
                    "producto.fecha_publicacion": 1,
                    "imagenes": {
                        $map: {
                            input: "$imagenes",
                            as: "img",
                            in: "$$img.url_imagen"
                        }
                    }
                }
            }
        ]);
        
        // Contar total de favoritos
        const total = await ModeloFavorito.countDocuments({
            usuario_id: req.usuario.usuario_id
        });
        
        res.json({
            exito: true,
            mensaje: "Favoritos obtenidos exitosamente",
            data: {
                favoritos,
                paginacion: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
        
    } catch (error) {
        console.error("Error en obtenerFavoritos:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Agregar producto a favoritos
 */
const agregarFavorito = async (req, res) => {
    try {
        const { producto_id } = req.body;
        
        if (!producto_id) {
            return res.status(400).json({
                exito: false,
                mensaje: "El producto_id es requerido",
                codigo: "MISSING_PRODUCT_ID"
            });
        }
        
        // Verificar que el producto existe y está activo
        const producto = await ModeloProducto.findOne({
            producto_id,
            $or: [
                { activo: true },
                { activo: { $exists: false } }
            ]
        });
        
        if (!producto) {
            return res.status(404).json({
                exito: false,
                mensaje: "Producto no encontrado",
                codigo: "PRODUCT_NOT_FOUND"
            });
        }
        
        // Verificar si ya está en favoritos
        const favoritoExistente = await ModeloFavorito.findOne({
            usuario_id: req.usuario.usuario_id,
            producto_id
        });
        
        if (favoritoExistente) {
            return res.status(400).json({
                exito: false,
                mensaje: "El producto ya está en tus favoritos",
                codigo: "ALREADY_IN_FAVORITES"
            });
        }
        
        // Crear nuevo favorito
        const nuevoFavorito = new ModeloFavorito({
            usuario_id: req.usuario.usuario_id,
            producto_id
        });
        
        await nuevoFavorito.save();
        
        res.status(201).json({
            exito: true,
            mensaje: "Producto agregado a favoritos exitosamente",
            data: {
                favorito: nuevoFavorito.obtenerDatosPublicos()
            }
        });
        
    } catch (error) {
        console.error("Error en agregarFavorito:", error);
        
        // Manejar error de duplicado
        if (error.code === 11000) {
            return res.status(400).json({
                exito: false,
                mensaje: "El producto ya está en tus favoritos",
                codigo: "ALREADY_IN_FAVORITES"
            });
        }
        
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Eliminar producto de favoritos
 */
const eliminarFavorito = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar favorito
        const favorito = await ModeloFavorito.findOne({
            favorito_id: id,
            usuario_id: req.usuario.usuario_id
        });
        
        if (!favorito) {
            return res.status(404).json({
                exito: false,
                mensaje: "Favorito no encontrado",
                codigo: "FAVORITE_NOT_FOUND"
            });
        }
        
        // Eliminar favorito
        await ModeloFavorito.deleteOne({ favorito_id: id });
        
        res.json({
            exito: true,
            mensaje: "Producto eliminado de favoritos exitosamente"
        });
        
    } catch (error) {
        console.error("Error en eliminarFavorito:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Eliminar favorito por producto_id
 */
const eliminarFavoritoPorProducto = async (req, res) => {
    try {
        const { producto_id } = req.params;
        
        // Buscar y eliminar favorito
        const resultado = await ModeloFavorito.deleteOne({
            usuario_id: req.usuario.usuario_id,
            producto_id
        });
        
        if (resultado.deletedCount === 0) {
            return res.status(404).json({
                exito: false,
                mensaje: "El producto no está en tus favoritos",
                codigo: "FAVORITE_NOT_FOUND"
            });
        }
        
        res.json({
            exito: true,
            mensaje: "Producto eliminado de favoritos exitosamente"
        });
        
    } catch (error) {
        console.error("Error en eliminarFavoritoPorProducto:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Verificar si un producto está en favoritos
 */
const verificarFavorito = async (req, res) => {
    try {
        const { producto_id } = req.params;
        
        const favorito = await ModeloFavorito.findOne({
            usuario_id: req.usuario.usuario_id,
            producto_id
        });
        
        res.json({
            exito: true,
            mensaje: "Verificación completada",
            data: {
                es_favorito: !!favorito,
                favorito_id: favorito ? favorito.favorito_id : null
            }
        });
        
    } catch (error) {
        console.error("Error en verificarFavorito:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

module.exports = {
    obtenerFavoritos,
    agregarFavorito,
    eliminarFavorito,
    eliminarFavoritoPorProducto,
    verificarFavorito
};