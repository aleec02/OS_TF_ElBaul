const ModeloResena = require("../models/resena.model");
const ModeloProducto = require("../models/producto.model");
const ModeloUsuario = require("../models/usuario.model");

/**
 * Crear o editar reseña de un producto
 */
const crearEditarResena = async (req, res) => {
    try {
        const { id: producto_id } = req.params;
        const { puntuacion, comentario } = req.body;
        
        // Validar campos requeridos
        if (!puntuacion || !comentario) {
            return res.status(400).json({
                exito: false,
                mensaje: "La puntuación y comentario son requeridos",
                codigo: "MISSING_REQUIRED_FIELDS"
            });
        }
        
        // Validar puntuación
        if (puntuacion < 1 || puntuacion > 5) {
            return res.status(400).json({
                exito: false,
                mensaje: "La puntuación debe estar entre 1 y 5",
                codigo: "INVALID_RATING"
            });
        }
        
        // Verificar que el producto existe
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
        
        // Verificar si ya existe una reseña del usuario para este producto
        const resenaExistente = await ModeloResena.findOne({
            usuario_id: req.usuario.usuario_id,
            producto_id
        });
        
        if (resenaExistente) {
            // Actualizar reseña existente
            resenaExistente.puntuacion = parseInt(puntuacion);
            resenaExistente.comentario = comentario;
            resenaExistente.fecha = new Date().toISOString().replace('T', ' ').slice(0, 19);
            resenaExistente.aprobada = false;
            
            await resenaExistente.save();
            
            res.json({
                exito: true,
                mensaje: "Reseña actualizada exitosamente",
                data: {
                    resena: resenaExistente.obtenerDatosPublicos()
                }
            });
        } else {
            // Crear nueva reseña
            const nuevaResena = new ModeloResena({
                producto_id,
                usuario_id: req.usuario.usuario_id,
                puntuacion: parseInt(puntuacion),
                comentario,
                aprobada: false // Requiere moderación admin
            });
            
            await nuevaResena.save();
            
            res.status(201).json({
                exito: true,
                mensaje: "Reseña creada exitosamente",
                data: {
                    resena: nuevaResena.obtenerDatosPublicos()
                }
            });
        }
        
    } catch (error) {
        console.error("Error en crearEditarResena:", error);
        
        // Manejar error de duplicado
        if (error.code === 11000) {
            return res.status(400).json({
                exito: false,
                mensaje: "Ya tienes una reseña para este producto",
                codigo: "REVIEW_ALREADY_EXISTS"
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
 * Obtener reseñas aprobadas de un producto
 */
const obtenerResenasProducto = async (req, res) => {
    try {
        const { id: producto_id } = req.params;
        const { page = 1, limit = 10, puntuacion } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Verificar que el producto existe
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
        
        // Construir filtros
        const filtros = { 
            producto_id,
            aprobada: true 
        };
        
        if (puntuacion) {
            filtros.puntuacion = parseInt(puntuacion);
        }
        
        // Obtener reseñas con información del usuario
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
            { $sort: { fecha: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
                $project: {
                    resena_id: 1,
                    puntuacion: 1,
                    comentario: 1,
                    fecha: 1,
                    "usuario.nombre": 1,
                    "usuario.apellido": 1
                }
            }
        ]);
        
        // Contar total de reseñas
        const total = await ModeloResena.countDocuments(filtros);
        
        // Calcular estadísticas
        const estadisticas = await ModeloResena.aggregate([
            { $match: { producto_id, aprobada: true } },
            {
                $group: {
                    _id: null,
                    promedio: { $avg: "$puntuacion" },
                    total_resenas: { $sum: 1 },
                    por_puntuacion: {
                        $push: {
                            puntuacion: "$puntuacion"
                        }
                    }
                }
            }
        ]);
        
        // Calcular distribución por puntuación
        const distribucion = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        if (estadisticas.length > 0) {
            estadisticas[0].por_puntuacion.forEach(item => {
                distribucion[item.puntuacion]++;
            });
        }
        
        res.json({
            exito: true,
            mensaje: "Reseñas obtenidas exitosamente",
            data: {
                resenas,
                estadisticas: {
                    promedio: estadisticas.length > 0 ? Math.round(estadisticas[0].promedio * 10) / 10 : 0,
                    total_resenas: estadisticas.length > 0 ? estadisticas[0].total_resenas : 0,
                    distribucion
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
        console.error("Error en obtenerResenasProducto:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Obtener mi reseña para un producto específico
 */
const obtenerMiResena = async (req, res) => {
    try {
        const { id: producto_id } = req.params;
        
        // Buscar mi reseña para este producto
        const miResena = await ModeloResena.findOne({
            usuario_id: req.usuario.usuario_id,
            producto_id
        });
        
        if (!miResena) {
            return res.json({
                exito: true,
                mensaje: "No tienes reseña para este producto",
                data: {
                    resena: null
                }
            });
        }
        
        res.json({
            exito: true,
            mensaje: "Tu reseña obtenida exitosamente",
            data: {
                resena: miResena.obtenerDatosPublicos()
            }
        });
        
    } catch (error) {
        console.error("Error en obtenerMiResena:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Eliminar mi reseña
 */
const eliminarMiResena = async (req, res) => {
    try {
        const { id: producto_id } = req.params;
        
        // Buscar y eliminar mi reseña
        const resultado = await ModeloResena.deleteOne({
            usuario_id: req.usuario.usuario_id,
            producto_id
        });
        
        if (resultado.deletedCount === 0) {
            return res.status(404).json({
                exito: false,
                mensaje: "No tienes reseña para este producto",
                codigo: "REVIEW_NOT_FOUND"
            });
        }
        
        res.json({
            exito: true,
            mensaje: "Reseña eliminada exitosamente"
        });
        
    } catch (error) {
        console.error("Error en eliminarMiResena:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

module.exports = {
    crearEditarResena,
    obtenerResenasProducto,
    obtenerMiResena,
    eliminarMiResena
};