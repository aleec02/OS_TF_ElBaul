const ModeloComentario = require("../models/comentario.model");
const ModeloPublicacion = require("../models/publicacion.model");
const ModeloReaccion = require("../models/reaccion.model");
const ModeloUsuario = require("../models/usuario.model");

/**
 * Obtener comentarios de una publicación específica
 */
const obtenerComentariosPublicacion = async (req, res) => {
    try {
        const { publicacionId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        // Verificar que la publicación existe
        const publicacion = await ModeloPublicacion.findOne({ 
            publicacion_id: publicacionId, 
            estado: true 
        });

        if (!publicacion) {
            return res.status(404).json({
                exito: false,
                mensaje: "Publicación no encontrada",
                codigo: "POST_NOT_FOUND"
            });
        }

        const comentarios = await ModeloComentario.find({ 
            publicacion_id: publicacionId,
            estado: true 
        })
        .populate('usuario_id', 'nombre apellido avatar_url')
        .populate({
            path: 'reacciones',
            populate: { path: 'usuario_id', select: 'nombre apellido' }
        })
        .sort({ fecha_creacion: -1 })
        .skip(skip)
        .limit(parseInt(limit));

        const total = await ModeloComentario.countDocuments({ 
            publicacion_id: publicacionId, 
            estado: true 
        });

        const comentariosProcesados = comentarios.map(com => ({
            comentario_id: com.comentario_id,
            contenido: com.contenido,
            fecha_creacion: com.fecha_creacion,
            fecha_actualizacion: com.fecha_actualizacion,
            usuario: {
                usuario_id: com.usuario_id.usuario_id,
                nombre: `${com.usuario_id.nombre} ${com.usuario_id.apellido}`,
                avatar_url: com.usuario_id.avatar_url
            },
            reacciones: com.reacciones?.map(reac => ({
                reaccion_id: reac.reaccion_id,
                tipo: reac.tipo,
                usuario: {
                    usuario_id: reac.usuario_id.usuario_id,
                    nombre: `${reac.usuario_id.nombre} ${reac.usuario_id.apellido}`
                }
            })) || []
        }));

        res.json({
            exito: true,
            mensaje: "Comentarios obtenidos exitosamente",
            data: {
                comentarios: comentariosProcesados,
                paginacion: {
                    pagina_actual: parseInt(page),
                    total_paginas: Math.ceil(total / limit),
                    total_elementos: total,
                    elementos_por_pagina: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error("Error en obtenerComentariosPublicacion:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Crear nuevo comentario
 */
const crearComentario = async (req, res) => {
    try {
        const { publicacion_id, contenido, comentario_padre_id } = req.body;
        const usuario_id = req.usuario.usuario_id;

        if (!publicacion_id || !contenido || contenido.trim().length === 0) {
            return res.status(400).json({
                exito: false,
                mensaje: "Publicación ID y contenido son requeridos",
                codigo: "MISSING_FIELDS"
            });
        }

        // Verificar que la publicación existe
        const publicacion = await ModeloPublicacion.findOne({ 
            publicacion_id, 
            estado: true 
        });

        if (!publicacion) {
            return res.status(404).json({
                exito: false,
                mensaje: "Publicación no encontrada",
                codigo: "POST_NOT_FOUND"
            });
        }

        // Verificar comentario padre si se proporciona
        if (comentario_padre_id) {
            const comentarioPadre = await ModeloComentario.findOne({ 
                comentario_id: comentario_padre_id,
                estado: true 
            });

            if (!comentarioPadre) {
                return res.status(404).json({
                    exito: false,
                    mensaje: "Comentario padre no encontrado",
                    codigo: "PARENT_COMMENT_NOT_FOUND"
                });
            }
        }

        const nuevoComentario = new ModeloComentario({
            publicacion_id,
            usuario_id,
            contenido: contenido.trim(),
            comentario_padre_id: comentario_padre_id || null
        });

        await nuevoComentario.save();

        // Populate para respuesta
        await nuevoComentario.populate('usuario_id', 'nombre apellido avatar_url');

        res.status(201).json({
            exito: true,
            mensaje: "Comentario creado exitosamente",
            data: {
                comentario: {
                    comentario_id: nuevoComentario.comentario_id,
                    contenido: nuevoComentario.contenido,
                    fecha_creacion: nuevoComentario.fecha_creacion,
                    comentario_padre_id: nuevoComentario.comentario_padre_id,
                    usuario: {
                        usuario_id: nuevoComentario.usuario_id.usuario_id,
                        nombre: `${nuevoComentario.usuario_id.nombre} ${nuevoComentario.usuario_id.apellido}`,
                        avatar_url: nuevoComentario.usuario_id.avatar_url
                    },
                    reacciones: []
                }
            }
        });

    } catch (error) {
        console.error("Error en crearComentario:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Actualizar comentario
 */
const actualizarComentario = async (req, res) => {
    try {
        const { id } = req.params;
        const { contenido } = req.body;
        const usuario_id = req.usuario.usuario_id;

        if (!contenido || contenido.trim().length === 0) {
            return res.status(400).json({
                exito: false,
                mensaje: "El contenido del comentario es requerido",
                codigo: "MISSING_CONTENT"
            });
        }

        const comentario = await ModeloComentario.findOne({ 
            comentario_id: id, 
            usuario_id,
            estado: true 
        });

        if (!comentario) {
            return res.status(404).json({
                exito: false,
                mensaje: "Comentario no encontrado o no tienes permisos",
                codigo: "COMMENT_NOT_FOUND"
            });
        }

        comentario.contenido = contenido.trim();
        comentario.fecha_actualizacion = new Date();
        await comentario.save();

        res.json({
            exito: true,
            mensaje: "Comentario actualizado exitosamente",
            data: {
                comentario: {
                    comentario_id: comentario.comentario_id,
                    contenido: comentario.contenido,
                    fecha_actualizacion: comentario.fecha_actualizacion
                }
            }
        });

    } catch (error) {
        console.error("Error en actualizarComentario:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Eliminar comentario
 */
const eliminarComentario = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario_id = req.usuario.usuario_id;

        const comentario = await ModeloComentario.findOne({ 
            comentario_id: id, 
            usuario_id,
            estado: true 
        });

        if (!comentario) {
            return res.status(404).json({
                exito: false,
                mensaje: "Comentario no encontrado o no tienes permisos",
                codigo: "COMMENT_NOT_FOUND"
            });
        }

        // Soft delete
        comentario.estado = false;
        await comentario.save();

        res.json({
            exito: true,
            mensaje: "Comentario eliminado exitosamente"
        });

    } catch (error) {
        console.error("Error en eliminarComentario:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Obtener reacciones de un comentario
 */
const obtenerReaccionesComentario = async (req, res) => {
    try {
        const { id } = req.params;

        const comentario = await ModeloComentario.findOne({ 
            comentario_id: id, 
            estado: true 
        });

        if (!comentario) {
            return res.status(404).json({
                exito: false,
                mensaje: "Comentario no encontrado",
                codigo: "COMMENT_NOT_FOUND"
            });
        }

        const reacciones = await ModeloReaccion.find({ 
            comentario_id: id,
            estado: true 
        })
        .populate('usuario_id', 'nombre apellido');

        const reaccionesProcesadas = reacciones.map(reac => ({
            reaccion_id: reac.reaccion_id,
            tipo: reac.tipo,
            fecha_creacion: reac.fecha_creacion,
            usuario: {
                usuario_id: reac.usuario_id.usuario_id,
                nombre: `${reac.usuario_id.nombre} ${reac.usuario_id.apellido}`
            }
        }));

        // Agrupar por tipo
        const reaccionesAgrupadas = reaccionesProcesadas.reduce((acc, reac) => {
            if (!acc[reac.tipo]) {
                acc[reac.tipo] = [];
            }
            acc[reac.tipo].push(reac);
            return acc;
        }, {});

        res.json({
            exito: true,
            mensaje: "Reacciones del comentario obtenidas exitosamente",
            data: {
                reacciones: reaccionesProcesadas,
                reacciones_agrupadas: reaccionesAgrupadas,
                total_reacciones: reacciones.length
            }
        });

    } catch (error) {
        console.error("Error en obtenerReaccionesComentario:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Reaccionar a un comentario
 */
const reaccionarComentario = async (req, res) => {
    try {
        const { id } = req.params;
        const { tipo } = req.body;
        const usuario_id = req.usuario.usuario_id;

        const tiposValidos = ['like', 'love', 'genial', 'wow', 'sad', 'angry'];
        if (!tiposValidos.includes(tipo)) {
            return res.status(400).json({
                exito: false,
                mensaje: "Tipo de reacción no válido",
                codigo: "INVALID_REACTION_TYPE"
            });
        }

        // Verificar que el comentario existe
        const comentario = await ModeloComentario.findOne({ 
            comentario_id: id, 
            estado: true 
        });

        if (!comentario) {
            return res.status(404).json({
                exito: false,
                mensaje: "Comentario no encontrado",
                codigo: "COMMENT_NOT_FOUND"
            });
        }

        // Buscar reacción existente
        let reaccion = await ModeloReaccion.findOne({
            comentario_id: id,
            usuario_id,
            estado: true
        });

        if (reaccion) {
            if (reaccion.tipo === tipo) {
                // Quitar reacción
                reaccion.estado = false;
                await reaccion.save();
                
                res.json({
                    exito: true,
                    mensaje: "Reacción eliminada exitosamente",
                    data: {
                        reaccion_creada: false
                    }
                });
            } else {
                // Cambiar tipo de reacción
                reaccion.tipo = tipo;
                await reaccion.save();
                
                res.json({
                    exito: true,
                    mensaje: "Reacción actualizada exitosamente",
                    data: {
                        reaccion_creada: true,
                        reaccion: {
                            reaccion_id: reaccion.reaccion_id,
                            tipo: reaccion.tipo
                        }
                    }
                });
            }
        } else {
            // Crear nueva reacción
            const nuevaReaccion = new ModeloReaccion({
                comentario_id: id,
                usuario_id,
                tipo
            });

            await nuevaReaccion.save();

            res.json({
                exito: true,
                mensaje: "Reacción creada exitosamente",
                data: {
                    reaccion_creada: true,
                    reaccion: {
                        reaccion_id: nuevaReaccion.reaccion_id,
                        tipo: nuevaReaccion.tipo
                    }
                }
            });
        }

    } catch (error) {
        console.error("Error en reaccionarComentario:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Reportar comentario
 */
const reportarComentario = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;
        const usuario_id = req.usuario.usuario_id;

        if (!motivo || motivo.trim().length === 0) {
            return res.status(400).json({
                exito: false,
                mensaje: "El motivo del reporte es requerido",
                codigo: "MISSING_REASON"
            });
        }

        // Verificar que el comentario existe
        const comentario = await ModeloComentario.findOne({ 
            comentario_id: id, 
            estado: true 
        });

        if (!comentario) {
            return res.status(404).json({
                exito: false,
                mensaje: "Comentario no encontrado",
                codigo: "COMMENT_NOT_FOUND"
            });
        }

        // Aquí se podría guardar el reporte en una colección separada
        // Por ahora solo retornamos éxito
        res.json({
            exito: true,
            mensaje: "Reporte enviado exitosamente. Gracias por tu feedback."
        });

    } catch (error) {
        console.error("Error en reportarComentario:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Obtener comentarios de un usuario específico
 */
const obtenerComentariosUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        // Verificar que el usuario existe
        const usuario = await ModeloUsuario.findOne({ 
            usuario_id: usuarioId, 
            estado: true 
        });

        if (!usuario) {
            return res.status(404).json({
                exito: false,
                mensaje: "Usuario no encontrado",
                codigo: "USER_NOT_FOUND"
            });
        }

        const comentarios = await ModeloComentario.find({ 
            usuario_id: usuarioId,
            estado: true 
        })
        .populate('usuario_id', 'nombre apellido avatar_url')
        .populate('publicacion_id', 'contenido')
        .sort({ fecha_creacion: -1 })
        .skip(skip)
        .limit(parseInt(limit));

        const total = await ModeloComentario.countDocuments({ 
            usuario_id: usuarioId, 
            estado: true 
        });

        const comentariosProcesados = comentarios.map(com => ({
            comentario_id: com.comentario_id,
            contenido: com.contenido,
            fecha_creacion: com.fecha_creacion,
            publicacion: {
                publicacion_id: com.publicacion_id.publicacion_id,
                contenido: com.publicacion_id.contenido.substring(0, 100) + '...'
            },
            usuario: {
                usuario_id: com.usuario_id.usuario_id,
                nombre: `${com.usuario_id.nombre} ${com.usuario_id.apellido}`,
                avatar_url: com.usuario_id.avatar_url
            }
        }));

        res.json({
            exito: true,
            mensaje: "Comentarios del usuario obtenidos exitosamente",
            data: {
                comentarios: comentariosProcesados,
                paginacion: {
                    pagina_actual: parseInt(page),
                    total_paginas: Math.ceil(total / limit),
                    total_elementos: total,
                    elementos_por_pagina: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error("Error en obtenerComentariosUsuario:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

module.exports = {
    obtenerComentariosPublicacion,
    crearComentario,
    actualizarComentario,
    eliminarComentario,
    obtenerReaccionesComentario,
    reaccionarComentario,
    reportarComentario,
    obtenerComentariosUsuario
};