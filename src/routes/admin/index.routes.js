const express = require("express");
const router = express.Router();

const { verificarAuthYAdmin } = require("../../middleware/admin.middleware");

// Aplicar middleware de admin a todas las rutas
router.use(verificarAuthYAdmin);

// Ruta principal del panel admin
router.get("/", (req, res) => {
    res.json({
        exito: true,
        mensaje: "Panel de Administración - ElBaul",
        data: {
            usuario_admin: req.usuario.obtenerDatosPublicos(),
            endpoints_disponibles: {
                productos: {
                    listar: "GET /api/admin/productos",
                    crear: "POST /api/admin/productos",
                    actualizar: "PUT /api/admin/productos/:id",
                    eliminar: "DELETE /api/admin/productos/:id"
                },
                categorias: {
                    listar: "GET /api/admin/categorias",
                    crear: "POST /api/admin/categorias",
                    actualizar: "PUT /api/admin/categorias/:id",
                    eliminar: "DELETE /api/admin/categorias/:id"
                }
            }
        }
    });
});

// Estadísticas básicas del sistema
router.get("/estadisticas", async (req, res) => {
    try {
        const ModeloUsuario = require("../../models/usuario.model");
        const ModeloProducto = require("../../models/producto.model");
        const ModeloCategoria = require("../../models/categoria.model");
        
        const [totalUsuarios, totalProductos, totalCategorias, usuariosAdmin] = await Promise.all([
            ModeloUsuario.countDocuments({ estado: true }),
            ModeloProducto.countDocuments({
                $or: [
                    { activo: true },
                    { activo: { $exists: false } }
                ]
            }),
            ModeloCategoria.countDocuments({
                $or: [
                    { activa: true },
                    { activa: { $exists: false } }
                ]
            }),
            ModeloUsuario.countDocuments({ rol: "admin", estado: true })
        ]);
        
        res.json({
            exito: true,
            mensaje: "Estadísticas del sistema",
            data: {
                usuarios: {
                    total: totalUsuarios,
                    admins: usuariosAdmin,
                    clientes: totalUsuarios - usuariosAdmin
                },
                productos: {
                    total: totalProductos
                },
                categorias: {
                    total: totalCategorias
                }
            }
        });
        
    } catch (error) {
        console.error("Error en estadísticas:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error obteniendo estadísticas",
            codigo: "INTERNAL_ERROR"
        });
    }
});

module.exports = router;