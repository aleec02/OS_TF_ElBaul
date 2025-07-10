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
        const { contenido, imagenes = [], producto_id, tags = [] } = req.body;
        
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
        
        // Extraer tags del contenido (hashtags)
        const hashtagRegex = /#(\w+)/g;
        const contentTags = [...contenido.matchAll(hashtagRegex)].map(match => match[1].toLowerCase());
        const allTags = [...new Set([...tags, ...contentTags])]; // Combinar y eliminar duplicados
        
        // Crear publicación
        const nuevaPublicacion = new ModeloPublicacion({
            usuario_id: req.usuario.usuario_id,
            contenido: contenido.trim(),
            imagenes,
            producto_id,
            tags: allTags
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
        const { page = 1, limit = 10, usuario_id, sort = 'recientes', tag } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        console.log('📡 obtenerFeed called:', { page, limit, usuario_id, sort, tag });
        
        // Construir filtros
        const filtros = {};
        if (usuario_id) {
            filtros.usuario_id = usuario_id;
        }
        if (tag) {
            filtros.tags = tag.toLowerCase();
        }
        
        console.log('🔍 Filters:', filtros);
        
        // Determinar orden
        let sortStage;
        if (sort === 'populares') {
            // Ordenar por engagement (likes + comentarios) y fecha
            sortStage = { 
                engagement_score: -1, 
                fecha: -1 
            };
        } else {
            // Por defecto: recientes
            sortStage = { fecha: -1 };
        }
        
        // Pipeline de agregación
        const pipeline = [
            { $match: filtros },
            {
                $lookup: {
                    from: "usuarios",
                    localField: "usuario_id",
                    foreignField: "usuario_id",
                    as: "usuario"
                }
            },
            {
                $addFields: {
                    usuario: { $arrayElemAt: ["$usuario", 0] }
                }
            },
            {
                $lookup: {
                    from: "productos",
                    localField: "producto_id",
                    foreignField: "producto_id",
                    as: "producto"
                }
            },
            {
                $addFields: {
                    producto: { $arrayElemAt: ["$producto", 0] }
                }
            }
        ];
        
        // Para populares, calcular engagement score
        if (sort === 'populares') {
            pipeline.push({
                $addFields: {
                    engagement_score: {
                        $add: [
                            { $ifNull: ["$likes", 0] },
                            { $multiply: [{ $ifNull: ["$comentarios_count", 0] }, 2] } // Comentarios valen más
                        ]
                    }
                }
            });
        }
        
        pipeline.push(
            { $sort: sortStage },
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
                $project: {
                    _id: 0,
                    post_id: 1,
                    publicacion_id: "$post_id",
                    usuario_id: 1,
                    contenido: 1,
                    imagenes: 1,
                    fecha: 1,
                    fecha_creacion: "$fecha",
                    likes: 1,
                    producto_id: 1,
                    tags: 1,
                    "usuario.usuario_id": 1,
                    "usuario.nombre": 1,
                    "usuario.apellido": 1,
                    "usuario.avatar": 1,
                    "producto.producto_id": 1,
                    "producto.titulo": 1,
                    "producto.precio": 1,
                    "producto.estado": 1,
                    "producto.imagenes": 1
                }
            }
        );
        
        const publicaciones = await ModeloPublicacion.aggregate(pipeline);
        
        console.log('📚 Raw publicaciones found:', publicaciones.length);
        
        // Obtener conteos de comentarios para cada publicación
        for (let publicacion of publicaciones) {
            try {
                // Contar comentarios
                const comentarios = await ModeloComentario.countDocuments({
                    post_id: publicacion.post_id
                });
                
                publicacion.comentarios_count = comentarios;
                publicacion.total_comentarios = comentarios;
                
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
                
                publicacion.reacciones = reacciones.reduce((acc, r) => {
                    acc[r._id] = r.cantidad;
                    return acc;
                }, {});
                
                publicacion.total_reacciones = publicacion.reacciones;
                
            } catch (error) {
                console.error('Error getting counts for post:', publicacion.post_id, error);
                publicacion.comentarios_count = 0;
                publicacion.total_comentarios = 0;
                publicacion.reacciones = {};
                publicacion.total_reacciones = {};
            }
        }
        
        // Contar total
        const total = await ModeloPublicacion.countDocuments(filtros);
        
        console.log('✅ Final publicaciones:', publicaciones.length);
        
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
                },
                filtros_aplicados: {
                    sort,
                    tag,
                    usuario_id
                }
            }
        });
        
    } catch (error) {
        console.error("❌ Error en obtenerFeed:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message,
            stack: error.stack
        });
    }
};

/**
 * Obtener estadísticas de usuario
 */
const obtenerEstadisticasUsuario = async (req, res) => {
    try {
        const { usuario_id } = req.params;
        
        // Contar publicaciones del usuario
        const totalPosts = await ModeloPublicacion.countDocuments({ usuario_id });
        
        // Contar likes totales en sus publicaciones
        const likesAggregate = await ModeloPublicacion.aggregate([
            { $match: { usuario_id } },
            { $group: { _id: null, totalLikes: { $sum: "$likes" } } }
        ]);
        
        const totalLikes = likesAggregate.length > 0 ? likesAggregate[0].totalLikes : 0;
        
        // Contar comentarios totales en sus publicaciones
        const postsUsuario = await ModeloPublicacion.find({ usuario_id }, { post_id: 1 });
        const postIds = postsUsuario.map(p => p.post_id);
        
        const totalComments = await ModeloComentario.countDocuments({
            post_id: { $in: postIds }
        });
        
        // Obtener fecha de registro del usuario
        const usuario = await ModeloUsuario.findOne({ usuario_id }, { fecha_registro: 1 });
        
        res.json({
            exito: true,
            mensaje: "Estadísticas obtenidas exitosamente",
            data: {
                usuario_id,
                total_posts: totalPosts,
                total_likes: totalLikes,
                total_comments: totalComments,
                miembro_desde: usuario?.fecha_registro,
                engagement_promedio: totalPosts > 0 ? ((totalLikes + totalComments) / totalPosts).toFixed(1) : 0
            }
        });
        
    } catch (error) {
        console.error("Error en obtenerEstadisticasUsuario:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Obtener tags populares
 */
const obtenerTagsPopulares = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        const tagsPopulares = await ModeloPublicacion.aggregate([
            { $unwind: "$tags" },
            { $group: { _id: "$tags", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: parseInt(limit) },
            { $project: { tag: "$_id", count: 1, _id: 0 } }
        ]);
        
        res.json({
            exito: true,
            mensaje: "Tags populares obtenidos exitosamente",
            data: {
                tags: tagsPopulares
            }
        });
        
    } catch (error) {
        console.error("Error en obtenerTagsPopulares:", error);
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
                    tags: 1,
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
        const { contenido, imagenes, tags } = req.body;
        
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
            
            // Extraer tags del contenido actualizado
            const hashtagRegex = /#(\w+)/g;
            const contentTags = [...contenido.matchAll(hashtagRegex)].map(match => match[1].toLowerCase());
            const allTags = [...new Set([...(tags || []), ...contentTags])];
            publicacion.tags = allTags;
        }
        
        if (imagenes !== undefined) {
            // Only update images if a new array is provided
            // This prevents images from being cleared when not included in the request
            if (Array.isArray(imagenes)) {
                publicacion.imagenes = imagenes;
            }
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
    eliminarPublicacion,
    obtenerEstadisticasUsuario,
    obtenerTagsPopulares
};