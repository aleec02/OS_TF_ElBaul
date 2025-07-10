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

        // Construir filtros - no usar estado porque no existe en el modelo
        const filtros = {};
        if (usuario_id) filtros.usuario_id = usuario_id;

        // Obtener publicaciones
        const publicaciones = await ModeloPublicacion.find(filtros)
            .sort({ fecha: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Contar total
        const total = await ModeloPublicacion.countDocuments(filtros);

        // Procesar datos para respuesta
        const publicacionesProcesadas = await Promise.all(publicaciones.map(async (pub) => {
            // Obtener información del usuario
            let usuario = null;
            try {
                usuario = await ModeloUsuario.findOne({ usuario_id: pub.usuario_id });
            } catch (error) {
                console.log('Error obteniendo usuario:', error.message);
            }

            // Obtener información del producto
            let producto = null;
            if (pub.producto_id) {
                try {
                    producto = await ModeloProducto.findOne({ producto_id: pub.producto_id });
                } catch (error) {
                    console.log('Error obteniendo producto:', error.message);
                }
            }

            return {
                publicacion_id: pub.post_id, // Usar post_id como publicacion_id
                contenido: pub.contenido,
                imagenes: pub.imagenes || [],
                fecha_creacion: pub.fecha,
                fecha_actualizacion: pub.updatedAt || pub.fecha,
                vistas: 0, // No existe en el modelo
                likes: pub.likes || 0,
                usuario: usuario ? {
                    usuario_id: usuario.usuario_id,
                    nombre: `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim(),
                    avatar_url: usuario.avatar_url || null
                } : {
                    usuario_id: pub.usuario_id,
                    nombre: 'Usuario',
                    avatar_url: null
                },
                producto: producto ? {
                    producto_id: producto.producto_id,
                    titulo: producto.titulo,
                    precio: producto.precio,
                    imagen_principal: producto.imagen_principal || null,
                    categoria_id: producto.categoria_id
                } : null,
                comentarios: [], // Por ahora vacío
                reacciones: [] // Por ahora vacío
            };
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
            post_id: id // Usar post_id en lugar de publicacion_id
        });

        if (!publicacion) {
            return res.status(404).json({
                exito: false,
                mensaje: "Publicación no encontrada",
                codigo: "POST_NOT_FOUND"
            });
        }

        // Obtener información del usuario
        let usuario = null;
        try {
            usuario = await ModeloUsuario.findOne({ usuario_id: publicacion.usuario_id });
        } catch (error) {
            console.log('Error obteniendo usuario:', error.message);
        }

        // Obtener información del producto
        let producto = null;
        if (publicacion.producto_id) {
            try {
                producto = await ModeloProducto.findOne({ producto_id: publicacion.producto_id });
            } catch (error) {
                console.log('Error obteniendo producto:', error.message);
            }
        }

        // Procesar datos
        const publicacionProcesada = {
            publicacion_id: publicacion.post_id,
            contenido: publicacion.contenido,
            imagenes: publicacion.imagenes || [],
            fecha_creacion: publicacion.fecha,
            fecha_actualizacion: publicacion.updatedAt || publicacion.fecha,
            vistas: 0,
            likes: publicacion.likes || 0,
            usuario: usuario ? {
                usuario_id: usuario.usuario_id,
                nombre: `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim(),
                avatar_url: usuario.avatar_url || null
            } : {
                usuario_id: publicacion.usuario_id,
                nombre: 'Usuario',
                avatar_url: null
            },
            producto: producto ? {
                producto_id: producto.producto_id,
                titulo: producto.titulo,
                precio: producto.precio,
                imagen_principal: producto.imagen_principal || null,
                categoria_id: producto.categoria_id,
                descripcion: producto.descripcion
            } : null,
            comentarios: [],
            reacciones: []
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
        const { contenido, imagenes, producto_id } = req.body;

        if (!contenido) {
            return res.status(400).json({
                exito: false,
                mensaje: "El contenido es requerido",
                codigo: "MISSING_CONTENT"
            });
        }

        // Crear nueva publicación
        const nuevaPublicacion = new ModeloPublicacion({
            usuario_id: req.usuario.usuario_id,
            contenido,
            imagenes: imagenes || [],
            producto_id: producto_id || null
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

        // Buscar publicación
        const publicacion = await ModeloPublicacion.findOne({
            post_id: id,
            usuario_id: req.usuario.usuario_id
        });

        if (!publicacion) {
            return res.status(404).json({
                exito: false,
                mensaje: "Publicación no encontrada",
                codigo: "POST_NOT_FOUND"
            });
        }

        // Actualizar campos
        if (contenido) publicacion.contenido = contenido;
        if (imagenes) publicacion.imagenes = imagenes;

        await publicacion.save();

        res.json({
            exito: true,
            mensaje: "Publicación actualizada exitosamente",
            data: {
                publicacion: publicacion.obtenerDatosPublicos()
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

        // Buscar publicación
        const publicacion = await ModeloPublicacion.findOne({
            post_id: id,
            usuario_id: req.usuario.usuario_id
        });

        if (!publicacion) {
            return res.status(404).json({
                exito: false,
                mensaje: "Publicación no encontrada",
                codigo: "POST_NOT_FOUND"
            });
        }

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

        // Verificar que la publicación existe
        const publicacion = await ModeloPublicacion.findOne({ post_id: id });
        if (!publicacion) {
            return res.status(404).json({
                exito: false,
                mensaje: "Publicación no encontrada",
                codigo: "POST_NOT_FOUND"
            });
        }

        // Obtener comentarios
        const comentarios = await ModeloComentario.find({ publicacion_id: id })
            .sort({ fecha_creacion: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Contar total
        const total = await ModeloComentario.countDocuments({ publicacion_id: id });

        res.json({
            exito: true,
            mensaje: "Comentarios obtenidos exitosamente",
            data: {
                comentarios,
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

        if (!contenido) {
            return res.status(400).json({
                exito: false,
                mensaje: "El contenido del comentario es requerido",
                codigo: "MISSING_CONTENT"
            });
        }

        // Verificar que la publicación existe
        const publicacion = await ModeloPublicacion.findOne({ post_id: id });
        if (!publicacion) {
            return res.status(404).json({
                exito: false,
                mensaje: "Publicación no encontrada",
                codigo: "POST_NOT_FOUND"
            });
        }

        // Crear comentario
        const nuevoComentario = new ModeloComentario({
            publicacion_id: id,
            usuario_id: req.usuario.usuario_id,
            contenido
        });

        await nuevoComentario.save();

        res.status(201).json({
            exito: true,
            mensaje: "Comentario creado exitosamente",
            data: {
                comentario: nuevoComentario
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

        // Verificar que la publicación existe
        const publicacion = await ModeloPublicacion.findOne({ post_id: id });
        if (!publicacion) {
            return res.status(404).json({
                exito: false,
                mensaje: "Publicación no encontrada",
                codigo: "POST_NOT_FOUND"
            });
        }

        // Obtener reacciones
        const reacciones = await ModeloReaccion.find({ publicacion_id: id });

        res.json({
            exito: true,
            mensaje: "Reacciones obtenidas exitosamente",
            data: {
                reacciones
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
        const { tipo = 'like' } = req.body;

        // Verificar que la publicación existe
        const publicacion = await ModeloPublicacion.findOne({ post_id: id });
        if (!publicacion) {
            return res.status(404).json({
                exito: false,
                mensaje: "Publicación no encontrada",
                codigo: "POST_NOT_FOUND"
            });
        }

        // Verificar si ya existe una reacción del usuario
        const reaccionExistente = await ModeloReaccion.findOne({
            publicacion_id: id,
            usuario_id: req.usuario.usuario_id
        });

        if (reaccionExistente) {
            // Actualizar reacción existente
            reaccionExistente.tipo = tipo;
            await reaccionExistente.save();
        } else {
            // Crear nueva reacción
            const nuevaReaccion = new ModeloReaccion({
                publicacion_id: id,
                usuario_id: req.usuario.usuario_id,
                tipo
            });
            await nuevaReaccion.save();
        }

        res.json({
            exito: true,
            mensaje: "Reacción registrada exitosamente"
        });

    } catch (error) {
        console.error("Error en reaccionarPublicacion:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR"
        });
    }
};

// Funciones adicionales simplificadas
const obtenerTendencias = async (req, res) => {
    try {
        const publicaciones = await ModeloPublicacion.find()
            .sort({ likes: -1, fecha: -1 })
            .limit(10);

        res.json({
            exito: true,
            mensaje: "Tendencias obtenidas exitosamente",
            data: {
                publicaciones: publicaciones.map(pub => pub.obtenerDatosPublicos())
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

const reportarPublicacion = async (req, res) => {
    res.json({
        exito: true,
        mensaje: "Reporte registrado exitosamente"
    });
};

const compartirPublicacion = async (req, res) => {
    res.json({
        exito: true,
        mensaje: "Publicación compartida exitosamente"
    });
};

const obtenerPublicacionesUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const publicaciones = await ModeloPublicacion.find({ usuario_id: usuarioId })
            .sort({ fecha: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await ModeloPublicacion.countDocuments({ usuario_id: usuarioId });

        res.json({
            exito: true,
            mensaje: "Publicaciones del usuario obtenidas exitosamente",
            data: {
                publicaciones: publicaciones.map(pub => pub.obtenerDatosPublicos()),
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

const obtenerPublicacionesRelacionadas = async (req, res) => {
    try {
        const { id } = req.params;
        
        const publicacion = await ModeloPublicacion.findOne({ post_id: id });
        if (!publicacion) {
            return res.status(404).json({
                exito: false,
                mensaje: "Publicación no encontrada",
                codigo: "POST_NOT_FOUND"
            });
        }

        // Obtener publicaciones relacionadas por producto
        const publicacionesRelacionadas = await ModeloPublicacion.find({
            producto_id: publicacion.producto_id,
            post_id: { $ne: id }
        })
        .sort({ fecha: -1 })
        .limit(5);

        res.json({
            exito: true,
            mensaje: "Publicaciones relacionadas obtenidas exitosamente",
            data: {
                publicaciones: publicacionesRelacionadas.map(pub => pub.obtenerDatosPublicos())
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