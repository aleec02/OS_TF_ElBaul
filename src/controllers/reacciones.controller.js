const ModeloReaccion = require("../models/reaccion.model");
const ModeloPublicacion = require("../models/publicacion.model");
const ModeloComentario = require("../models/comentario.model");

/**
 * Añadir/quitar/cambiar reacción a una publicación
 */
const reaccionarPublicacion = async (req, res) => {
    try {
        const { id: post_id } = req.params;
        const { tipo } = req.body;
        
        // Validar tipo de reacción
        const tiposValidos = ["like", "love", "genial", "wow", "sad", "angry"];
        if (!tipo || !tiposValidos.includes(tipo)) {
            return res.status(400).json({
                exito: false,
                mensaje: `El tipo de reacción debe ser uno de: ${tiposValidos.join(", ")}`,
                codigo: "INVALID_REACTION_TYPE"
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
        
        // Buscar reacción existente del usuario
        const reaccionExistente = await ModeloReaccion.findOne({
            usuario_id: req.usuario.usuario_id,
            entidad: "post",
            entidad_id: post_id
        });
        
        let mensaje;
        let reaccion;
        
        if (reaccionExistente) {
            if (reaccionExistente.tipo === tipo) {
                // Mismo tipo -> Eliminar reacción
                await ModeloReaccion.deleteOne({ reaccion_id: reaccionExistente.reaccion_id });
                
                // Actualizar contador de likes en la publicación
                await ModeloPublicacion.updateOne(
                    { post_id },
                    { $inc: { likes: -1 } }
                );
                
                mensaje = "Reacción eliminada exitosamente";
                reaccion = null;
            } else {
                // Diferente tipo -> Cambiar reacción
                reaccionExistente.tipo = tipo;
                reaccionExistente.fecha = new Date().toISOString().replace('T', ' ').slice(0, 19);
                await reaccionExistente.save();
                
                mensaje = "Reacción actualizada exitosamente";
                reaccion = reaccionExistente.obtenerDatosPublicos();
            }
        } else {
            // No existe -> Crear nueva reacción
            const nuevaReaccion = new ModeloReaccion({
                usuario_id: req.usuario.usuario_id,
                tipo,
                entidad: "post",
                entidad_id: post_id
            });
            
            await nuevaReaccion.save();
            
            // Actualizar contador de likes en la publicación
            await ModeloPublicacion.updateOne(
                { post_id },
                { $inc: { likes: 1 } }
            );
            
            // TODO: Crear notificación para el dueño del post
            
            mensaje = "Reacción añadida exitosamente";
            reaccion = nuevaReaccion.obtenerDatosPublicos();
        }
        
        res.json({
            exito: true,
            mensaje,
            data: {
                reaccion
            }
        });
        
    } catch (error) {
        console.error("Error en reaccionarPublicacion:", error);
        
        // Manejar error de duplicado
        if (error.code === 11000) {
            return res.status(400).json({
                exito: false,
                mensaje: "Ya tienes una reacción para esta publicación",
                codigo: "REACTION_ALREADY_EXISTS"
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
 * Añadir/quitar/cambiar reacción a un comentario
 */
const reaccionarComentario = async (req, res) => {
    try {
        const { id: comentario_id } = req.params;
        const { tipo } = req.body;
        
        // Validar tipo de reacción
        const tiposValidos = ["like", "love", "genial", "wow", "sad", "angry"];
        if (!tipo || !tiposValidos.includes(tipo)) {
            return res.status(400).json({
                exito: false,
                mensaje: `El tipo de reacción debe ser uno de: ${tiposValidos.join(", ")}`,
                codigo: "INVALID_REACTION_TYPE"
            });
        }
        
        // Verificar que el comentario existe
        const comentario = await ModeloComentario.findOne({ comentario_id });
        
        if (!comentario) {
            return res.status(404).json({
                exito: false,
                mensaje: "Comentario no encontrado",
                codigo: "COMMENT_NOT_FOUND"
            });
        }
        
        // Buscar reacción existente del usuario
        const reaccionExistente = await ModeloReaccion.findOne({
            usuario_id: req.usuario.usuario_id,
            entidad: "comentario",
            entidad_id: comentario_id
        });
        
        let mensaje;
        let reaccion;
        
        if (reaccionExistente) {
            if (reaccionExistente.tipo === tipo) {
                // Mismo tipo -> Eliminar reacción
                await ModeloReaccion.deleteOne({ reaccion_id: reaccionExistente.reaccion_id });
                mensaje = "Reacción eliminada exitosamente";
                reaccion = null;
            } else {
                // Diferente tipo -> Cambiar reacción
                reaccionExistente.tipo = tipo;
                reaccionExistente.fecha = new Date().toISOString().replace('T', ' ').slice(0, 19);
                await reaccionExistente.save();
                mensaje = "Reacción actualizada exitosamente";
                reaccion = reaccionExistente.obtenerDatosPublicos();
            }
        } else {
            // No existe -> Crear nueva reacción
            const nuevaReaccion = new ModeloReaccion({
                usuario_id: req.usuario.usuario_id,
                tipo,
                entidad: "comentario",
                entidad_id: comentario_id
            });
            
            await nuevaReaccion.save();
            
            // TODO: Crear notificación para el dueño del comentario
            
            mensaje = "Reacción añadida exitosamente";
            reaccion = nuevaReaccion.obtenerDatosPublicos();
        }
        
        res.json({
            exito: true,
            mensaje,
            data: {
                reaccion
            }
        });
        
    } catch (error) {
        console.error("Error en reaccionarComentario:", error);
        
        // Manejar error de duplicado
        if (error.code === 11000) {
            return res.status(400).json({
                exito: false,
                mensaje: "Ya tienes una reacción para este comentario",
                codigo: "REACTION_ALREADY_EXISTS"
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
 * Obtener reacciones de una publicación
 */
const obtenerReaccionesPublicacion = async (req, res) => {
    try {
        const { id: post_id } = req.params;
        
        // Verificar que la publicación existe
        const publicacion = await ModeloPublicacion.findOne({ post_id });
        
        if (!publicacion) {
            return res.status(404).json({
                exito: false,
                mensaje: "Publicación no encontrada",
                codigo: "POST_NOT_FOUND"
            });
        }
        
        // Obtener reacciones agrupadas por tipo
        const reacciones = await ModeloReaccion.aggregate([
            { $match: { entidad: "post", entidad_id: post_id } },
            {
                $group: {
                    _id: "$tipo",
                    cantidad: { $sum: 1 },
                    usuarios: { 
                        $push: {
                            usuario_id: "$usuario_id",
                            fecha: "$fecha"
                        }
                    }
                }
            },
            { $sort: { cantidad: -1 } }
        ]);
        
        // Obtener mi reacción si estoy autenticado
        let miReaccion = null;
        if (req.usuario) {
            miReaccion = await ModeloReaccion.findOne({
                usuario_id: req.usuario.usuario_id,
                entidad: "post",
                entidad_id: post_id
            });
        }
        
        res.json({
            exito: true,
            mensaje: "Reacciones obtenidas exitosamente",
            data: {
                reacciones,
                mi_reaccion: miReaccion ? miReaccion.obtenerDatosPublicos() : null,
                resumen: {
                    total_reacciones: reacciones.reduce((sum, r) => sum + r.cantidad, 0),
                    tipos_disponibles: ["like", "love", "genial", "wow", "sad", "angry"]
                }
            }
        });
        
    } catch (error) {
        console.error("Error en obtenerReaccionesPublicacion:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Obtener reacciones de un comentario
 */
const obtenerReaccionesComentario = async (req, res) => {
    try {
        const { id: comentario_id } = req.params;
        
        // Verificar que el comentario existe
        const comentario = await ModeloComentario.findOne({ comentario_id });
        
        if (!comentario) {
            return res.status(404).json({
                exito: false,
                mensaje: "Comentario no encontrado",
                codigo: "COMMENT_NOT_FOUND"
            });
        }
        
        // Obtener reacciones agrupadas por tipo
        const reacciones = await ModeloReaccion.aggregate([
            { $match: { entidad: "comentario", entidad_id: comentario_id } },
            {
                $group: {
                    _id: "$tipo",
                    cantidad: { $sum: 1 },
                    usuarios: { 
                        $push: {
                            usuario_id: "$usuario_id",
                            fecha: "$fecha"
                        }
                    }
                }
            },
            { $sort: { cantidad: -1 } }
        ]);
        
        // Obtener mi reacción si estoy autenticado
        let miReaccion = null;
        if (req.usuario) {
            miReaccion = await ModeloReaccion.findOne({
                usuario_id: req.usuario.usuario_id,
                entidad: "comentario",
                entidad_id: comentario_id
            });
        }
        
        res.json({
            exito: true,
            mensaje: "Reacciones obtenidas exitosamente",
            data: {
                reacciones,
                mi_reaccion: miReaccion ? miReaccion.obtenerDatosPublicos() : null,
                resumen: {
                    total_reacciones: reacciones.reduce((sum, r) => sum + r.cantidad, 0),
                    tipos_disponibles: ["like", "love", "genial", "wow", "sad", "angry"]
                }
            }
        });
        
    } catch (error) {
        console.error("Error en obtenerReaccionesComentario:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

module.exports = {
    reaccionarPublicacion,
    reaccionarComentario,
    obtenerReaccionesPublicacion,
    obtenerReaccionesComentario
};