const ModeloPublicacion = require("../models/publicacion.model");
const ModeloComentario = require("../models/comentario.model");
const ModeloReaccion = require("../models/reaccion.model");
const ModeloUsuario = require("../models/usuario.model");
const ModeloProducto = require("../models/producto.model");

/**
 * Obtener feed de publicaciones con paginación
 */
const obtenerPublicaciones = async (req, res) => {
    try {
        const { page = 1, limit = 10, usuario_id, categoria_id } = req.query;
        const skip = (page - 1) * limit;

        // Construir filtros
        const filtros = { estado: true };
        if (usuario_id) filtros.usuario_id = usuario_id;
        if (categoria_id) filtros['producto.categoria_id'] = categoria_id;

        // Obtener publicaciones con populate
        const publicaciones = await ModeloPublicacion.find(filtros)
            .populate('usuario_id', 'nombre apellido avatar_url')
            .populate('producto_id', 'titulo precio imagen_principal categoria_id')
            .populate({
                path: 'comentarios',
                populate: { path: 'usuario_id', select: 'nombre apellido avatar_url' }
            })
            .populate({
                path: 'reacciones',
                populate: { path: 'usuario_id', select: 'nombre apellido' }
            })
            .sort({ fecha_creacion: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Contar total
        const total = await ModeloPublicacion.countDocuments(filtros);

        // Procesar datos para respuesta
        const publicacionesProcesadas = publicaciones.map(pub => ({
            publicacion_id: pub.publicacion_id,
            contenido: pub.contenido,
            imagenes: pub.imagenes,
            fecha_creacion: pub.fecha_creacion,
            fecha_actualizacion: pub.fecha_actualizacion,
            vistas: pub.vistas || 0,
            usuario: {
                usuario_id: pub.usuario_id.usuario_id,
                nombre: `${pub.usuario_id.nombre} ${pub.usuario_id.apellido}`,
                avatar_url: pub.usuario_id.avatar_url
            },
            producto: pub.producto_id ? {
                producto_id: pub.producto_id.producto_id,
                titulo: pub.producto_id.titulo,
                precio: pub.producto_id.precio,
                imagen_principal: pub.producto_id.imagen_principal,
                categoria_id: pub.producto_id.categoria_id
            } : null,
            comentarios: pub.comentarios?.map(com => ({
                comentario_id: com.comentario_id,
                contenido: com.contenido,
                fecha_creacion: com.fecha_creacion,
                usuario: {
                    usuario_id: com.usuario_id.usuario_id,
                    nombre: `${com.usuario_id.nombre} ${com.usuario_id.apellido}`,
                    avatar_url: com.usuario_id.avatar_url
                }
            })) || [],
            reacciones: pub.reacciones?.map(reac => ({
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
            mensaje: "Publicaciones obtenidas exitosamente",
            data: {
                publicaciones: publicacionesProcesadas,
                paginacion: {
                    pagina_actual: parseInt(page),
                    total_paginas: Math.ceil(total / limit),
                    total_elementos: total,
                    elementos_por_pagina: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error("Error en obtenerPublicaciones:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Obtener publicación específica por ID
 */
const obtenerPublicacionPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const publicacion = await ModeloPublicacion.findOne({ 
            publicacion_id: id, 
            estado: true 
        })
        .populate('usuario_id', 'nombre apellido avatar_url')
        .populate('producto_id', 'titulo precio imagen_principal categoria_id descripcion')
        .populate({
            path: 'comentarios',
            populate: { path: 'usuario_id', select: 'nombre apellido avatar_url' }
        })
        .populate({
            path: 'reacciones',
            populate: { path: 'usuario_id', select: 'nombre apellido' }
        });

        if (!publicacion) {
            return res.status(404).json({
                exito: false,
                mensaje: "Publicación no encontrada",
                codigo: "POST_NOT_FOUND"
            });
        }

        // Incrementar vistas
        publicacion.vistas = (publicacion.vistas || 0) + 1;
        await publicacion.save();

        // Procesar datos
        const publicacionProcesada = {
            publicacion_id: publicacion.publicacion_id,
            contenido: publicacion.contenido,
            imagenes: publicacion.imagenes,
            fecha_creacion: publicacion.fecha_creacion,
            fecha_actualizacion: publicacion.fecha_actualizacion,
            vistas: publicacion.vistas,
            usuario: {
                usuario_id: publicacion.usuario_id.usuario_id,
                nombre: `${publicacion.usuario_id.nombre} ${publicacion.usuario_id.apellido}`,
                avatar_url: publicacion.usuario_id.avatar_url
            },
            producto: publicacion.producto_id ? {
                producto_id: publicacion.producto_id.producto_id,
                titulo: publicacion.producto_id.titulo,
                precio: publicacion.producto_id.precio,
                imagen_principal: publicacion.producto_id.imagen_principal,
                categoria_id: publicacion.producto_id.categoria_id,
                descripcion: publicacion.producto_id.descripcion
            } : null,
            comentarios: publicacion.comentarios?.map(com => ({
                comentario_id: com.comentario_id,
                contenido: com.contenido,
                fecha_creacion: com.fecha_creacion,
                usuario: {
                    usuario_id: com.usuario_id.usuario_id,
                    nombre: `${com.usuario_id.nombre} ${com.usuario_id.apellido}`,
                    avatar_url: com.usuario_id.avatar_url
                }
            })) || [],
            reacciones: publicacion.reacciones?.map(reac => ({
                reaccion_id: reac.reaccion_id,
                tipo: reac.tipo,
                usuario: {
                    usuario_id: reac.usuario_id.usuario_id,
                    nombre: `${reac.usuario_id.nombre} ${reac.usuario_id.apellido}`
                }
            })) || []
        };

        res.json({
            exito: true,
            mensaje: "Publicación obtenida exitosamente",
            data: {
                publicacion: publicacionProcesada
            }
        });

    } catch (error) {
        console.error("Error en obtenerPublicacionPorId:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Crear nueva publicación
 */
const crearPublicacion = async (req, res) => {
    try {
        const { contenido, imagenes = [], producto_id, publico = true } = req.body;
        const usuario_id = req.usuario.usuario_id;

        if (!contenido || contenido.trim().length === 0) {
            return res.status(400).json({
                exito: false,
                mensaje: "El contenido de la publicación es requerido",
                codigo: "MISSING_CONTENT"
            });
        }

        // Validar producto si se proporciona
        if (producto_id) {
            const producto = await ModeloProducto.findOne({ producto_id });
            if (!producto) {
                return res.status(400).json({
                    exito: false,
                    mensaje: "Producto no encontrado",
                    codigo: "PRODUCT_NOT_FOUND"
                });
            }
        }

        const nuevaPublicacion = new ModeloPublicacion({
            usuario_id,
            contenido: contenido.trim(),
            imagenes,
            producto_id: producto_id || null,
            publico,
            vistas: 0
        });

        await nuevaPublicacion.save();

        // Populate para respuesta
        await nuevaPublicacion.populate('usuario_id', 'nombre apellido avatar_url');
        if (producto_id) {
            await nuevaPublicacion.populate('producto_id', 'titulo precio imagen_principal categoria_id');
        }

        res.status(201).json({
            exito: true,
            mensaje: "Publicación creada exitosamente",
            data: {
                publicacion: {
                    publicacion_id: nuevaPublicacion.publicacion_id,
                    contenido: nuevaPublicacion.contenido,
                    imagenes: nuevaPublicacion.imagenes,
                    fecha_creacion: nuevaPublicacion.fecha_creacion,
                    usuario: {
                        usuario_id: nuevaPublicacion.usuario_id.usuario_id,
                        nombre: `${nuevaPublicacion.usuario_id.nombre} ${nuevaPublicacion.usuario_id.apellido}`,
                        avatar_url: nuevaPublicacion.usuario_id.avatar_url
                    },
                    producto: nuevaPublicacion.producto_id ? {
                        producto_id: nuevaPublicacion.producto_id.producto_id,
                        titulo: nuevaPublicacion.producto_id.titulo,
                        precio: nuevaPublicacion.producto_id.precio,
                        imagen_principal: nuevaPublicacion.producto_id.imagen_principal,
                        categoria_id: nuevaPublicacion.producto_id.categoria_id
                    } : null,
                    comentarios: [],
                    reacciones: []
                }
            }
        });

    } catch (error) {
        console.error("Error en crearPublicacion:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Actualizar publicación
 */
const actualizarPublicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { contenido, imagenes } = req.body;
        const usuario_id = req.usuario.usuario_id;

        const publicacion = await ModeloPublicacion.findOne({ 
            publicacion_id: id, 
            usuario_id,
            estado: true 
        });

        if (!publicacion) {
            return res.status(404).json({
                exito: false,
                mensaje: "Publicación no encontrada o no tienes permisos",
                codigo: "POST_NOT_FOUND"
            });
        }

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

        publicacion.fecha_actualizacion = new Date();
        await publicacion.save();

        res.json({
            exito: true,
            mensaje: "Publicación actualizada exitosamente",
            data: {
                publicacion: {
                    publicacion_id: publicacion.publicacion_id,
                    contenido: publicacion.contenido,
                    imagenes: publicacion.imagenes,
                    fecha_actualizacion: publicacion.fecha_actualizacion
                }
            }
        });

    } catch (error) {
        console.error("Error en actualizarPublicacion:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Eliminar publicación
 */
const eliminarPublicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario_id = req.usuario.usuario_id;

        const publicacion = await ModeloPublicacion.findOne({ 
            publicacion_id: id, 
            usuario_id,
            estado: true 
        });

        if (!publicacion) {
            return res.status(404).json({
                exito: false,
                mensaje: "Publicación no encontrada o no tienes permisos",
                codigo: "POST_NOT_FOUND"
            });
        }

        // Soft delete
        publicacion.estado = false;
        await publicacion.save();

        res.json({
            exito: true,
            mensaje: "Publicación eliminada exitosamente"
        });

    } catch (error) {
        console.error("Error en eliminarPublicacion:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Obtener comentarios de una publicación
 */
const obtenerComentarios = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const comentarios = await ModeloComentario.find({ 
            publicacion_id: id,
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
            publicacion_id: id, 
            estado: true 
        });

        const comentariosProcesados = comentarios.map(com => ({
            comentario_id: com.comentario_id,
            contenido: com.contenido,
            fecha_creacion: com.fecha_creacion,
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
        console.error("Error en obtenerComentarios:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Crear comentario en una publicación
 */
const crearComentario = async (req, res) => {
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

        // Verificar que la publicación existe
        const publicacion = await ModeloPublicacion.findOne({ 
            publicacion_id: id, 
            estado: true 
        });

        if (!publicacion) {
            return res.status(404).json({
                exito: false,
                mensaje: "Publicación no encontrada",
                codigo: "POST_NOT_FOUND"
            });
        }

        const nuevoComentario = new ModeloComentario({
            publicacion_id: id,
            usuario_id,
            contenido: contenido.trim()
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
 * Obtener reacciones de una publicación
 */
const obtenerReacciones = async (req, res) => {
    try {
        const { id } = req.params;

        const reacciones = await ModeloReaccion.find({ 
            publicacion_id: id,
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
            mensaje: "Reacciones obtenidas exitosamente",
            data: {
                reacciones: reaccionesProcesadas,
                reacciones_agrupadas: reaccionesAgrupadas,
                total_reacciones: reacciones.length
            }
        });

    } catch (error) {
        console.error("Error en obtenerReacciones:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Reaccionar a una publicación
 */
const reaccionarPublicacion = async (req, res) => {
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

        // Verificar que la publicación existe
        const publicacion = await ModeloPublicacion.findOne({ 
            publicacion_id: id, 
            estado: true 
        });

        if (!publicacion) {
            return res.status(404).json({
                exito: false,
                mensaje: "Publicación no encontrada",
                codigo: "POST_NOT_FOUND"
            });
        }

        // Buscar reacción existente
        let reaccion = await ModeloReaccion.findOne({
            publicacion_id: id,
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
                publicacion_id: id,
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
        console.error("Error en reaccionarPublicacion:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Obtener tendencias
 */
const obtenerTendencias = async (req, res) => {
    try {
        // Obtener temas más populares de las últimas 24 horas
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const tendencias = await ModeloPublicacion.aggregate([
            {
                $match: {
                    fecha_creacion: { $gte: yesterday },
                    estado: true
                }
            },
            {
                $group: {
                    _id: "$tema",
                    cantidad: { $sum: 1 }
                }
            },
            {
                $sort: { cantidad: -1 }
            },
            {
                $limit: 10
            }
        ]);

        res.json({
            exito: true,
            mensaje: "Tendencias obtenidas exitosamente",
            data: {
                tendencias: tendencias.map(t => ({
                    tema: t._id,
                    cantidad: t.cantidad
                }))
            }
        });

    } catch (error) {
        console.error("Error en obtenerTendencias:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Reportar publicación
 */
const reportarPublicacion = async (req, res) => {
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

        // Verificar que la publicación existe
        const publicacion = await ModeloPublicacion.findOne({ 
            publicacion_id: id, 
            estado: true 
        });

        if (!publicacion) {
            return res.status(404).json({
                exito: false,
                mensaje: "Publicación no encontrada",
                codigo: "POST_NOT_FOUND"
            });
        }

        // Aquí se podría guardar el reporte en una colección separada
        // Por ahora solo retornamos éxito
        res.json({
            exito: true,
            mensaje: "Reporte enviado exitosamente. Gracias por tu feedback."
        });

    } catch (error) {
        console.error("Error en reportarPublicacion:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Compartir publicación
 */
const compartirPublicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario_id = req.usuario.usuario_id;

        // Verificar que la publicación existe
        const publicacion = await ModeloPublicacion.findOne({ 
            publicacion_id: id, 
            estado: true 
        });

        if (!publicacion) {
            return res.status(404).json({
                exito: false,
                mensaje: "Publicación no encontrada",
                codigo: "POST_NOT_FOUND"
            });
        }

        // Incrementar contador de compartidos
        publicacion.compartidos = (publicacion.compartidos || 0) + 1;
        await publicacion.save();

        res.json({
            exito: true,
            mensaje: "Publicación compartida exitosamente",
            data: {
                compartidos: publicacion.compartidos
            }
        });

    } catch (error) {
        console.error("Error en compartirPublicacion:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Obtener publicaciones de un usuario específico
 */
const obtenerPublicacionesUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const publicaciones = await ModeloPublicacion.find({ 
            usuario_id: usuarioId,
            estado: true 
        })
        .populate('usuario_id', 'nombre apellido avatar_url')
        .populate('producto_id', 'titulo precio imagen_principal categoria_id')
        .sort({ fecha_creacion: -1 })
        .skip(skip)
        .limit(parseInt(limit));

        const total = await ModeloPublicacion.countDocuments({ 
            usuario_id: usuarioId, 
            estado: true 
        });

        const publicacionesProcesadas = publicaciones.map(pub => ({
            publicacion_id: pub.publicacion_id,
            contenido: pub.contenido,
            imagenes: pub.imagenes,
            fecha_creacion: pub.fecha_creacion,
            usuario: {
                usuario_id: pub.usuario_id.usuario_id,
                nombre: `${pub.usuario_id.nombre} ${pub.usuario_id.apellido}`,
                avatar_url: pub.usuario_id.avatar_url
            },
            producto: pub.producto_id ? {
                producto_id: pub.producto_id.producto_id,
                titulo: pub.producto_id.titulo,
                precio: pub.producto_id.precio,
                imagen_principal: pub.producto_id.imagen_principal,
                categoria_id: pub.producto_id.categoria_id
            } : null
        }));

        res.json({
            exito: true,
            mensaje: "Publicaciones del usuario obtenidas exitosamente",
            data: {
                publicaciones: publicacionesProcesadas,
                paginacion: {
                    pagina_actual: parseInt(page),
                    total_paginas: Math.ceil(total / limit),
                    total_elementos: total,
                    elementos_por_pagina: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error("Error en obtenerPublicacionesUsuario:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

/**
 * Obtener publicaciones relacionadas
 */
const obtenerPublicacionesRelacionadas = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 5 } = req.query;

        const publicacion = await ModeloPublicacion.findOne({ 
            publicacion_id: id, 
            estado: true 
        }).populate('producto_id');

        if (!publicacion) {
            return res.status(404).json({
                exito: false,
                mensaje: "Publicación no encontrada",
                codigo: "POST_NOT_FOUND"
            });
        }

        // Buscar publicaciones relacionadas por categoría o contenido similar
        let filtros = { 
            publicacion_id: { $ne: id },
            estado: true 
        };

        if (publicacion.producto_id) {
            filtros['producto_id.categoria_id'] = publicacion.producto_id.categoria_id;
        }

        const publicacionesRelacionadas = await ModeloPublicacion.find(filtros)
            .populate('usuario_id', 'nombre apellido avatar_url')
            .populate('producto_id', 'titulo precio imagen_principal categoria_id')
            .sort({ fecha_creacion: -1 })
            .limit(parseInt(limit));

        const publicacionesProcesadas = publicacionesRelacionadas.map(pub => ({
            publicacion_id: pub.publicacion_id,
            contenido: pub.contenido,
            imagenes: pub.imagenes,
            fecha_creacion: pub.fecha_creacion,
            usuario: {
                usuario_id: pub.usuario_id.usuario_id,
                nombre: `${pub.usuario_id.nombre} ${pub.usuario_id.apellido}`,
                avatar_url: pub.usuario_id.avatar_url
            },
            producto: pub.producto_id ? {
                producto_id: pub.producto_id.producto_id,
                titulo: pub.producto_id.titulo,
                precio: pub.producto_id.precio,
                imagen_principal: pub.producto_id.imagen_principal,
                categoria_id: pub.producto_id.categoria_id
            } : null
        }));

        res.json({
            exito: true,
            mensaje: "Publicaciones relacionadas obtenidas exitosamente",
            data: {
                publicaciones: publicacionesProcesadas
            }
        });

    } catch (error) {
        console.error("Error en obtenerPublicacionesRelacionadas:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

module.exports = {
    obtenerPublicaciones,
    obtenerPublicacionPorId,
    crearPublicacion,
    actualizarPublicacion,
    eliminarPublicacion,
    obtenerComentarios,
    crearComentario,
    obtenerReacciones,
    reaccionarPublicacion,
    obtenerTendencias,
    reportarPublicacion,
    compartirPublicacion,
    obtenerPublicacionesUsuario,
    obtenerPublicacionesRelacionadas
};