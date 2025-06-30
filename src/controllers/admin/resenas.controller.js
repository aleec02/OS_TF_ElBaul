const ModeloResena = require("../../models/resena.model");
const ModeloProducto = require("../../models/producto.model");
const ModeloUsuario = require("../../models/usuario.model");

/**
 * Obtener todas las reseñas para moderación
 */
const obtenerResenasModeracion = async (req, res) => {
    try {
        const { page = 1, limit = 20, estado, producto_id, puntuacion } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Construir filtros
        const filtros = {};
        
        if (estado === "pendientes") {
            filtros.aprobada = false;
        } else if (estado === "aprobadas") {
            filtros.aprobada = true;
        }
        
        if (producto_id) {
            filtros.producto_id = producto_id;
        }
        
        if (puntuacion) {
            filtros.puntuacion = parseInt(puntuacion);
        }
        
        // Obtener reseñas con información del usuario y producto
        const resenas = await ModeloResena.aggregate([
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
            { $unwind: "$producto" },
            { $sort: { fecha: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
                $project: {
                    resena_id: 1,
                    producto_id: 1,
                    usuario_id: 1,
                    puntuacion: 1,
                    comentario: 1,
                    fecha: 1,
                    aprobada: 1,
                    "usuario.nombre": 1,
                    "usuario.apellido": 1,
                    "usuario.email": 1,
                    "producto.titulo": 1,
                    "producto.precio": 1
                }
            }
        ]);
        
        // Contar total
        const total = await ModeloResena.countDocuments(filtros);
        
        // Obtener estadísticas generales
        const estadisticas = await ModeloResena.aggregate([
            {
                $group: {
                    _id: null,
                    total_resenas: { $sum: 1 },
                    pendientes: {
                        $sum: { $cond: [{ $eq: ["$aprobada", false] }, 1, 0] }
                    },
                    aprobadas: {
                        $sum: { $cond: [{ $eq: ["$aprobada", true] }, 1, 0] }
                    },
                    promedio_general: { $avg: "$puntuacion" }
                }
            }
        ]);
        
        res.json({
            exito: true,
            mensaje: "Reseñas obtenidas exitosamente",
            data: {
                resenas,
                estadisticas: estadisticas.length > 0 ? {
                    total_resenas: estadisticas[0].total_resenas,
                    pendientes: estadisticas[0].pendientes,
                    aprobadas: estadisticas[0].aprobadas,
                    promedio_general: Math.round(estadisticas[0].promedio_general * 10) / 10
                } : {
                    total_resenas: 0,
                    pendientes: 0,
                    aprobadas: 0,
                    promedio_general: 0
                },
                paginacion: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
        
    } catch (error) {
        console.error("Error en obtenerResenasModeracion:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Aprobar una reseña
 */
const aprobarResena = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar reseña
        const resena = await ModeloResena.findOne({ resena_id: id });
        
        if (!resena) {
            return res.status(404).json({
                exito: false,
                mensaje: "Reseña no encontrada",
                codigo: "REVIEW_NOT_FOUND"
            });
        }
        
        // Aprobar reseña
        resena.aprobada = true;
        await resena.save();
        
        // Obtener información adicional para la respuesta
        const resenaCompleta = await ModeloResena.aggregate([
            { $match: { resena_id: id } },
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
            { $unwind: "$producto" },
            {
                $project: {
                    resena_id: 1,
                    puntuacion: 1,
                    comentario: 1,
                    fecha: 1,
                    aprobada: 1,
                    "usuario.nombre": 1,
                    "usuario.apellido": 1,
                    "producto.titulo": 1
                }
            }
        ]);
        
        res.json({
            exito: true,
            mensaje: "Reseña aprobada exitosamente",
            data: {
                resena: resenaCompleta[0]
            }
        });
        
    } catch (error) {
        console.error("Error en aprobarResena:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Rechazar/eliminar una reseña
 */
const eliminarResena = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;
        
        // Buscar reseña antes de eliminar para log
        const resena = await ModeloResena.findOne({ resena_id: id });
        
        if (!resena) {
            return res.status(404).json({
                exito: false,
                mensaje: "Reseña no encontrada",
                codigo: "REVIEW_NOT_FOUND"
            });
        }
        
        // Eliminar reseña
        await ModeloResena.deleteOne({ resena_id: id });
        
        console.log(`Admin eliminó reseña ${id} - Motivo: ${motivo || 'No especificado'}`);
        
        res.json({
            exito: true,
            mensaje: "Reseña eliminada exitosamente",
            data: {
                resena_eliminada: {
                    resena_id: resena.resena_id,
                    producto_id: resena.producto_id,
                    motivo: motivo || 'No especificado'
                }
            }
        });
        
    } catch (error) {
        console.error("Error en eliminarResena:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Obtener estadísticas detalladas de reseñas
 */
const obtenerEstadisticasResenas = async (req, res) => {
    try {
        // Estadísticas por producto
        const topProductosResenados = await ModeloResena.aggregate([
            { $match: { aprobada: true } },
            {
                $group: {
                    _id: "$producto_id",
                    total_resenas: { $sum: 1 },
                    promedio: { $avg: "$puntuacion" }
                }
            },
            {
                $lookup: {
                    from: "productos",
                    localField: "_id",
                    foreignField: "producto_id",
                    as: "producto"
                }
            },
            { $unwind: "$producto" },
            { $sort: { total_resenas: -1 } },
            { $limit: 10 },
            {
                $project: {
                    producto_id: "$_id",
                    titulo: "$producto.titulo",
                    total_resenas: 1,
                    promedio: { $round: ["$promedio", 1] }
                }
            }
        ]);
        
        // Estadísticas por puntuación
        const distribucionPuntuaciones = await ModeloResena.aggregate([
            { $match: { aprobada: true } },
            {
                $group: {
                    _id: "$puntuacion",
                    cantidad: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        // Reseñas recientes
        const resenasRecientes = await ModeloResena.aggregate([
            { $sort: { fecha: -1 } },
            { $limit: 5 },
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
                $project: {
                    resena_id: 1,
                    puntuacion: 1,
                    fecha: 1,
                    aprobada: 1,
                    "producto.titulo": 1
                }
            }
        ]);
        
        res.json({
            exito: true,
            mensaje: "Estadísticas obtenidas exitosamente",
            data: {
                top_productos_resenados: topProductosResenados,
                distribucion_puntuaciones: distribucionPuntuaciones,
                resenas_recientes: resenasRecientes
            }
        });
        
    } catch (error) {
        console.error("Error en obtenerEstadisticasResenas:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

module.exports = {
    obtenerResenasModeracion,
    aprobarResena,
    eliminarResena,
    obtenerEstadisticasResenas
};