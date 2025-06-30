const ModeloPublicacion = require("../models/publicacion.model");
const ModeloComentario = require("../models/comentario.model");
const ModeloReaccion = require("../models/reaccion.model");
const ModeloUsuario = require("../models/usuario.model");
const ModeloProducto = require("../models/producto.model");

/**
 * Crear nueva publicación
 */
const crearPublicacion = async (req, res) => {
    try {
        const { contenido, imagenes = [], producto_id } = req.body;
        
        // Validar campos requeridos
        if (!contenido || contenido.trim().length === 0) {
            return res.status(400).json({
                exito: false,
                mensaje: "El contenido es requerido",
                codigo: "MISSING_CONTENT"
            });
        }
        
        // Verificar que el producto existe si se proporciona
        if (producto_id) {
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
        }
        
        // Crear publicación
        const nuevaPublicacion = new ModeloPublicacion({
            usuario_id: req.usuario.usuario_id,
            contenido: contenido.trim(),
            imagenes,
            producto_id
        });
        
        await nuevaPublicacion.save();
        
        res.status(201).json({
            exito: true,
            mensaje: "Publicación creada exitosamente",
            data: {
                publicacion: nuevaPublicacion.obtenerDatosPublicos()
            }
        });
        
    } catch (error) {
        console.error("Error en crearPublicacion:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Obtener feed de publicaciones
 */
const obtenerFeed = async (req, res) => {
    try {
        const { page = 1, limit = 10, usuario_id } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Construir filtros
        const filtros = {};
        if (usuario_id) {
            filtros.usuario_id = usuario_id;
        }
        
        // Obtener publicaciones con información del usuario
        const publicaciones = await ModeloPublicacion.aggregate([
            { $match: filtros },
            {
                $lookup: {
                    from: "usuarios",
                    localField: "usuario_id",
                    foreignField: "usuario_id",
                    as: "usuario"
                }
            },
            { $unwind: "$usuario" },
            {
                $lookup: {
                    from: "productos",
                    localField: "producto_id",
                    foreignField: "producto_id",
                    as: "producto"
                }
            },
            { $sort: { fecha: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
                $project: {
                    post_id: 1,
                    usuario_id: 1,
                    contenido: 1,
                    imagenes: 1,
                    fecha: 1,
                    likes: 1,
                    producto_id: 1,
                    "usuario.nombre": 1,
                    "usuario.apellido": 1,
                    "producto.titulo": 1,
                    "producto.precio": 1
                }
            }
        ]);
        
        // Obtener conteos de comentarios y reacciones para cada publicación
        for (let publicacion of publicaciones) {
            // Contar comentarios
            const comentarios = await ModeloComentario.countDocuments({
                post_id: publicacion.post_id
            });
            
            // Contar reacciones por tipo
            const reacciones = await ModeloReaccion.aggregate([
                { $match: { entidad: "post", entidad_id: publicacion.post_id } },
                {
                    $group: {
                        _id: "$tipo",
                        cantidad: { $sum: 1 }
                    }
                }
            ]);
            
            publicacion.comentarios_count = comentarios;
            publicacion.reacciones = reacciones.reduce((acc, r) => {
                acc[r._id] = r.cantidad;
                return acc;
            }, {});
        }
        
        // Contar total
        const total = await ModeloPublicacion.countDocuments(filtros);
        
        res.json({
            exito: true,
            mensaje: "Feed obtenido exitosamente",
            data: {
                publicaciones,
                paginacion: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
        
    } catch (error) {
        console.error("Error en obtenerFeed:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Obtener detalle de publicación específica
 */
const obtenerDetallePublicacion = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar publicación con información del usuario
        const publicacion = await ModeloPublicacion.aggregate([
            { $match: { post_id: id } },
            {
                $lookup: {
                    from: "usuarios",
                    localField: "usuario_id",
                    foreignField: "usuario_id",
                    as: "usuario"
                }
            },
            { $unwind: "$usuario" },
            {
                $lookup: {
                    from: "productos",
                    localField: "producto_id",
                    foreignField: "producto_id",
                    as: "producto"
                }
            },
            {
                $project: {
                    post_id: 1,
                    usuario_id: 1,
                    contenido: 1,
                    imagenes: 1,
                    fecha: 1,
                    likes: 1,
                    producto_id: 1,
                    "usuario.nombre": 1,
                    "usuario.apellido": 1,
                    "producto.titulo": 1,
                    "producto.precio": 1
                }
            }
        ]);
        
        if (publicacion.length === 0) {
            return res.status(404).json({
                exito: false,
                mensaje: "Publicación no encontrada",
                codigo: "POST_NOT_FOUND"
            });
        }
        
        // Obtener comentarios con información del usuario
        const comentarios = await ModeloComentario.aggregate([
            { $match: { post_id: id } },
            {
                $lookup: {
                    from: "usuarios",
                    localField: "usuario_id",
                    foreignField: "usuario_id",
                    as: "usuario"
                }
            },
            { $unwind: "$usuario" },
            { $sort: { fecha: -1 } },
            {
                $project: {
                    comentario_id: 1,
                    usuario_id: 1,
                    contenido: 1,
                    fecha: 1,
                    "usuario.nombre": 1,
                    "usuario.apellido": 1
                }
            }
        ]);
        
        // Obtener reacciones agrupadas por tipo
        const reacciones = await ModeloReaccion.aggregate([
            { $match: { entidad: "post", entidad_id: id } },
            {
                $group: {
                    _id: "$tipo",
                    cantidad: { $sum: 1 },
                    usuarios: { $push: "$usuario_id" }
                }
            }
        ]);
        
        res.json({
            exito: true,
            mensaje: "Detalle de publicación obtenido exitosamente",
            data: {
                publicacion: publicacion[0],
                comentarios,
                reacciones,
                resumen: {
                    total_comentarios: comentarios.length,
                    total_reacciones: reacciones.reduce((sum, r) => sum + r.cantidad, 0)
                }
            }
        });
        
    } catch (error) {
        console.error("Error en obtenerDetallePublicacion:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Editar publicación (solo el propietario)
 */
const editarPublicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { contenido, imagenes } = req.body;
        
        // Buscar publicación
        const publicacion = await ModeloPublicacion.findOne({ post_id: id });
        
        if (!publicacion) {
            return res.status(404).json({
                exito: false,
                mensaje: "Publicación no encontrada",
                codigo: "POST_NOT_FOUND"
            });
        }
        
        // Verificar que el usuario es el propietario
        if (publicacion.usuario_id !== req.usuario.usuario_id) {
            return res.status(403).json({
                exito: false,
                mensaje: "No tienes permisos para editar esta publicación",
                codigo: "ACCESS_DENIED"
            });
        }
        
        // Actualizar campos
        if (contenido !== undefined) {
            if (!contenido || contenido.trim().length === 0) {
                return res.status(400).json({
                    exito: false,
                    mensaje: "El contenido no puede estar vacío",
                    codigo: "EMPTY_CONTENT"
                });
            }
            publicacion.contenido = contenido.trim();
        }
        
        if (imagenes !== undefined) {
            publicacion.imagenes = imagenes;
        }
        
        await publicacion.save();
        
        res.json({
            exito: true,
            mensaje: "Publicación actualizada exitosamente",
            data: {
                publicacion: publicacion.obtenerDatosPublicos()
            }
        });
        
    } catch (error) {
        console.error("Error en editarPublicacion:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Eliminar publicación (solo el propietario)
 */
const eliminarPublicacion = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar publicación
        const publicacion = await ModeloPublicacion.findOne({ post_id: id });
        
        if (!publicacion) {
            return res.status(404).json({
                exito: false,
                mensaje: "Publicación no encontrada",
                codigo: "POST_NOT_FOUND"
            });
        }
        
        // Verificar que el usuario es el propietario
        if (publicacion.usuario_id !== req.usuario.usuario_id) {
            return res.status(403).json({
                exito: false,
                mensaje: "No tienes permisos para eliminar esta publicación",
                codigo: "ACCESS_DENIED"
            });
        }
        
        // Eliminar comentarios y reacciones asociadas
        await ModeloComentario.deleteMany({ post_id: id });
        await ModeloReaccion.deleteMany({ entidad: "post", entidad_id: id });
        
        // Eliminar publicación
        await ModeloPublicacion.deleteOne({ post_id: id });
        
        res.json({
            exito: true,
            mensaje: "Publicación eliminada exitosamente"
        });
        
    } catch (error) {
        console.error("Error en eliminarPublicacion:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

module.exports = {
    crearPublicacion,
    obtenerFeed,
    obtenerDetallePublicacion,
    editarPublicacion,
    eliminarPublicacion
};