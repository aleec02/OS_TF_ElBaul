const express = require("express");
const router = express.Router();

const { verificarAuth } = require("../middleware/auth.middleware");
const {
    crearPublicacion,
    obtenerFeed,
    obtenerDetallePublicacion,
    editarPublicacion,
    eliminarPublicacion
} = require("../controllers/publicaciones.controller");

const {
    anadirComentario,
    obtenerComentarios
} = require("../controllers/comentarios.controller");

const {
    reaccionarPublicacion,
    obtenerReaccionesPublicacion
} = require("../controllers/reacciones.controller");

// ==========================================
// RUTAS DE PUBLICACIONES
// ==========================================

/**
 * @route   GET /api/publicaciones
 * @desc    Obtener feed de publicaciones con paginación
 * @access  Public
 * @query   {
 *            page?: number,
 *            limit?: number,
 *            usuario_id?: string
 *          }
 */
router.get("/", obtenerFeed);

/**
 * @route   POST /api/publicaciones
 * @desc    Crear nueva publicación
 * @access  Private (Usuario autenticado)
 * @body    {
 *            contenido: string (requerido),
 *            imagenes?: string[],
 *            producto_id?: string
 *          }
 */
router.post("/", verificarAuth, crearPublicacion);

/**
 * @route   GET /api/publicaciones/:id
 * @desc    Obtener detalle de publicación específica con comentarios y reacciones
 * @access  Public
 * @params  id: post_id
 */
router.get("/:id", obtenerDetallePublicacion);

/**
 * @route   PUT /api/publicaciones/:id
 * @desc    Editar publicación (solo el propietario)
 * @access  Private (Usuario autenticado - solo propietario)
 * @params  id: post_id
 * @body    {
 *            contenido?: string,
 *            imagenes?: string[]
 *          }
 */
router.put("/:id", verificarAuth, editarPublicacion);

/**
 * @route   DELETE /api/publicaciones/:id
 * @desc    Eliminar publicación (solo el propietario)
 * @access  Private (Usuario autenticado - solo propietario)
 * @params  id: post_id
 */
router.delete("/:id", verificarAuth, eliminarPublicacion);

// ==========================================
// RUTAS DE COMENTARIOS EN PUBLICACIONES
// ==========================================

/**
 * @route   GET /api/publicaciones/:id/comentarios
 * @desc    Obtener comentarios de una publicación específica
 * @access  Public
 * @params  id: post_id
 * @query   {
 *            page?: number,
 *            limit?: number
 *          }
 */
router.get("/:id/comentarios", obtenerComentarios);

/**
 * @route   POST /api/publicaciones/:id/comentarios
 * @desc    Añadir comentario a una publicación
 * @access  Private (Usuario autenticado)
 * @params  id: post_id
 * @body    {
 *            contenido: string (requerido)
 *          }
 */
router.post("/:id/comentarios", verificarAuth, anadirComentario);

// ==========================================
// RUTAS DE REACCIONES EN PUBLICACIONES
// ==========================================

/**
 * @route   GET /api/publicaciones/:id/reacciones
 * @desc    Obtener reacciones de una publicación específica
 * @access  Public (con datos adicionales si está autenticado)
 * @params  id: post_id
 */
router.get("/:id/reacciones", obtenerReaccionesPublicacion);

/**
 * @route   POST /api/publicaciones/:id/reacciones
 * @desc    Añadir/quitar/cambiar reacción a una publicación
 * @access  Private (Usuario autenticado)
 * @params  id: post_id
 * @body    {
 *            tipo: string (requerido: like, love, genial, wow, sad, angry)
 *          }
 */
router.post("/:id/reacciones", verificarAuth, reaccionarPublicacion);

module.exports = router;