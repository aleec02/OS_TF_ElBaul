const ModeloComentario = require("../models/comentario.model");
const ModeloPublicacion = require("../models/publicacion.model");
const ModeloReaccion = require("../models/reaccion.model");

/**
 * Añadir comentario a una publicación
 */
const anadirComentario = async (req, res) => {
    try {
        const { id: post_id } = req.params;
        const { contenido } = req.body;
        
        // Validar campos requeridos
        if (!contenido || contenido.trim().length === 0) {
            return res.status(400).json({
                exito: false,
                mensaje: "El contenido del comentario es requerido",
                codigo: "MISSING_CONTENT"
            });
        }
        
        // Verificar que la publicación existe
        const publicacion = await ModeloPublicacion.findOne({ post_id });
        
        if (!publicacion) {
            return res.status(404).json({
                exito: false,
                mensaje: "Publicación no encontrada",
                codigo: "POST_NOT_FOUND"
            });
        }
        
        // Crear comentario
        const nuevoComentario = new ModeloComentario({
            usuario_id: req.usuario.usuario_id,
            post_id,
            contenido: contenido.trim()
        });
        
        await nuevoComentario.save();
        
        // TODO: Crear notificación para el dueño del post
        
        res.status(201).json({
            exito: true,
            mensaje: "Comentario añadido exitosamente",
            data: {
                comentario: nuevoComentario.obtenerDatosPublicos()
            }
        });
        
    } catch (error) {
        console.error("Error en anadirComentario:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Obtener comentarios de una publicación
 */
const obtenerComentarios = async (req, res) => {
    try {
        const { id: post_id } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Verificar que la publicación existe
        const publicacion = await ModeloPublicacion.findOne({ post_id });
        
        if (!publicacion) {
            return res.status(404).json({
                exito: false,
                mensaje: "Publicación no encontrada",
                codigo: "POST_NOT_FOUND"
            });
        }
        
        // Obtener comentarios con información del usuario
        const comentarios = await ModeloComentario.aggregate([
            { $match: { post_id } },
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
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
                $project: {
                    comentario_id: 1,
                    usuario_id: 1,
                    post_id: 1,
                    contenido: 1,
                    fecha: 1,
                    "usuario.nombre": 1,
                    "usuario.apellido": 1
                }
            }
        ]);
        
        // Obtener reacciones para cada comentario
        for (let comentario of comentarios) {
            const reacciones = await ModeloReaccion.aggregate([
                { $match: { entidad: "comentario", entidad_id: comentario.comentario_id } },
                {
                    $group: {
                        _id: "$tipo",
                        cantidad: { $sum: 1 }
                    }
                }
            ]);
            
            comentario.reacciones = reacciones.reduce((acc, r) => {
                acc[r._id] = r.cantidad;
                return acc;
            }, {});
        }
        
        // Contar total
        const total = await ModeloComentario.countDocuments({ post_id });
        
        res.json({
            exito: true,
            mensaje: "Comentarios obtenidos exitosamente",
            data: {
                comentarios,
                paginacion: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
        
    } catch (error) {
        console.error("Error en obtenerComentarios:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Editar comentario (solo el propietario)
 */
const editarComentario = async (req, res) => {
    try {
        const { id } = req.params;
        const { contenido } = req.body;
        
        // Validar contenido
        if (!contenido || contenido.trim().length === 0) {
            return res.status(400).json({
                exito: false,
                mensaje: "El contenido del comentario es requerido",
                codigo: "MISSING_CONTENT"
            });
        }
        
        // Buscar comentario
        const comentario = await ModeloComentario.findOne({ comentario_id: id });
        
        if (!comentario) {
            return res.status(404).json({
                exito: false,
                mensaje: "Comentario no encontrado",
                codigo: "COMMENT_NOT_FOUND"
            });
        }
        
        // Verificar que el usuario es el propietario
        if (comentario.usuario_id !== req.usuario.usuario_id) {
            return res.status(403).json({
                exito: false,
                mensaje: "No tienes permisos para editar este comentario",
                codigo: "ACCESS_DENIED"
            });
        }
        
        // Actualizar comentario
        comentario.contenido = contenido.trim();
        comentario.fecha = new Date().toISOString().replace('T', ' ').slice(0, 19);
        await comentario.save();
        
        res.json({
            exito: true,
            mensaje: "Comentario actualizado exitosamente",
            data: {
                comentario: comentario.obtenerDatosPublicos()
            }
        });
        
    } catch (error) {
        console.error("Error en editarComentario:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Eliminar comentario (solo el propietario)
 */
const eliminarComentario = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar comentario
        const comentario = await ModeloComentario.findOne({ comentario_id: id });
        
        if (!comentario) {
            return res.status(404).json({
                exito: false,
                mensaje: "Comentario no encontrado",
                codigo: "COMMENT_NOT_FOUND"
            });
        }
        
        // Verificar que el usuario es el propietario
        if (comentario.usuario_id !== req.usuario.usuario_id) {
            return res.status(403).json({
                exito: false,
                mensaje: "No tienes permisos para eliminar este comentario",
                codigo: "ACCESS_DENIED"
            });
        }
        
        // Eliminar reacciones asociadas al comentario
        await ModeloReaccion.deleteMany({ 
            entidad: "comentario", 
            entidad_id: id 
        });
        
        // Eliminar comentario
        await ModeloComentario.deleteOne({ comentario_id: id });
        
        res.json({
            exito: true,
            mensaje: "Comentario eliminado exitosamente"
        });
        
    } catch (error) {
        console.error("Error en eliminarComentario:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

module.exports = {
    anadirComentario,
    obtenerComentarios,
    editarComentario,
    eliminarComentario
};