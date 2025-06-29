const express = require("express");
const router = express.Router();
const { verificarAuthYAdmin } = require("../../middleware/admin.middleware");

router.use(verificarAuthYAdmin);

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

module.exports = router;