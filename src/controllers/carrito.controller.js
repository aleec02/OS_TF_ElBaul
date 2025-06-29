const ModeloCarrito = require("../models/carrito.model");
const ModeloItemCarrito = require("../models/item-carrito.model");
const ModeloProducto = require("../models/producto.model");
const ModeloInventario = require("../models/inventario.model");


/**
 * Obtener carrito del usuario
 */
const obtenerCarrito = async (req, res) => {
    try {
        // Buscar carrito activo del usuario
        let carrito = await ModeloCarrito.findOne({
            usuario_id: req.usuario.usuario_id,
            estado: "activo"
        });
        
        if (!carrito) {
            return res.json({
                exito: true,
                mensaje: "Carrito vacío",
                data: {
                    carrito: null,
                    items: [],
                    total_items: 0,
                    total_precio: 0
                }
            });
        }
        
        // Obtener items del carrito con información del producto
        const items = await ModeloItemCarrito.aggregate([
            { $match: { carrito_id: carrito.carrito_id } },
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
                    item_carrito_id: 1,
                    producto_id: 1,
                    cantidad: 1,
                    precio_unitario: 1,
                    subtotal: 1,
                    fecha_agregado: 1,
                    "producto.titulo": 1,
                    "producto.precio": 1,
                    "producto.estado": 1,
                    "producto.marca": 1,
                    "producto.activo": 1
                }
            }
        ]);
        
        // Calcular totales
        const totalItems = items.reduce((total, item) => total + item.cantidad, 0);
        const totalPrecio = items.reduce((total, item) => total + item.subtotal, 0);
        
        res.json({
            exito: true,
            mensaje: "Carrito obtenido exitosamente",
            data: {
                carrito: carrito.obtenerDatosPublicos(),
                items,
                total_items: totalItems,
                total_precio: totalPrecio
            }
        });
        
    } catch (error) {
        console.error("Error en obtenerCarrito:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Agregar item al carrito
 */
const agregarItemCarrito = async (req, res) => {
    try {
        const { producto_id, cantidad = 1 } = req.body;
        
        if (!producto_id) {
            return res.status(400).json({
                exito: false,
                mensaje: "El producto_id es requerido",
                codigo: "MISSING_PRODUCT_ID"
            });
        }
        
        // Verificar que el producto existe y está activo
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
        
        // Verificar stock disponible
        const inventario = await ModeloInventario.findOne({ producto_id });
        if (inventario && inventario.cantidad_disponible < cantidad) {
            return res.status(400).json({
                exito: false,
                mensaje: `Stock insuficiente. Disponible: ${inventario.cantidad_disponible}`,
                codigo: "INSUFFICIENT_STOCK"
            });
        }
        
        // Buscar o crear carrito activo
        let carrito = await ModeloCarrito.findOne({
            usuario_id: req.usuario.usuario_id,
            estado: "activo"
        });
        
        if (!carrito) {
            carrito = new ModeloCarrito({
                usuario_id: req.usuario.usuario_id
            });
            await carrito.save();
        }
        
        // Verificar si el producto ya está en el carrito
        const itemExistente = await ModeloItemCarrito.findOne({
            carrito_id: carrito.carrito_id,
            producto_id
        });
        
        if (itemExistente) {
            // Actualizar cantidad
            const nuevaCantidad = itemExistente.cantidad + parseInt(cantidad);
            
            // Verificar stock para nueva cantidad
            if (inventario && inventario.cantidad_disponible < nuevaCantidad) {
                return res.status(400).json({
                    exito: false,
                    mensaje: `Stock insuficiente para cantidad total: ${nuevaCantidad}. Disponible: ${inventario.cantidad_disponible}`,
                    codigo: "INSUFFICIENT_STOCK"
                });
            }
            
            itemExistente.cantidad = nuevaCantidad;
            itemExistente.precio_unitario = producto.precio;
            await itemExistente.save();
            
            res.json({
                exito: true,
                mensaje: "Cantidad actualizada en el carrito",
                data: {
                    item: itemExistente.obtenerDatosPublicos()
                }
            });
        } else {
            // Crear nuevo item
            const nuevoItem = new ModeloItemCarrito({
                carrito_id: carrito.carrito_id,
                producto_id,
                cantidad: parseInt(cantidad),
                precio_unitario: producto.precio
            });
            
            await nuevoItem.save();
            
            res.status(201).json({
                exito: true,
                mensaje: "Producto agregado al carrito exitosamente",
                data: {
                    item: nuevoItem.obtenerDatosPublicos()
                }
            });
        }
        
        // Actualizar fecha del carrito
        carrito.fecha_actualizacion = new Date();
        await carrito.save();
        
    } catch (error) {
        console.error("Error en agregarItemCarrito:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Actualizar cantidad de item en carrito
 */
const actualizarItemCarrito = async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad } = req.body;
        
        if (!cantidad || cantidad < 1) {
            return res.status(400).json({
                exito: false,
                mensaje: "La cantidad debe ser mayor a 0",
                codigo: "INVALID_QUANTITY"
            });
        }
        
        // Buscar item del carrito
        const item = await ModeloItemCarrito.findOne({ item_carrito_id: id });
        
        if (!item) {
            return res.status(404).json({
                exito: false,
                mensaje: "Item del carrito no encontrado",
                codigo: "CART_ITEM_NOT_FOUND"
            });
        }
        
        // Verificar que el carrito pertenece al usuario
        const carrito = await ModeloCarrito.findOne({
            carrito_id: item.carrito_id,
            usuario_id: req.usuario.usuario_id
        });
        
        if (!carrito) {
            return res.status(403).json({
                exito: false,
                mensaje: "No tienes permisos para modificar este carrito",
                codigo: "ACCESS_DENIED"
            });
        }
        
        // Verificar stock disponible
        const inventario = await ModeloInventario.findOne({ producto_id: item.producto_id });
        if (inventario && inventario.cantidad_disponible < cantidad) {
            return res.status(400).json({
                exito: false,
                mensaje: `Stock insuficiente. Disponible: ${inventario.cantidad_disponible}`,
                codigo: "INSUFFICIENT_STOCK"
            });
        }
        
        // Actualizar item
        item.cantidad = parseInt(cantidad);
        await item.save();
        
        // Actualizar fecha del carrito
        carrito.fecha_actualizacion = new Date();
        await carrito.save();
        
        res.json({
            exito: true,
            mensaje: "Item actualizado exitosamente",
            data: {
                item: item.obtenerDatosPublicos()
            }
        });
        
    } catch (error) {
        console.error("Error en actualizarItemCarrito:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Eliminar item del carrito
 */
const eliminarItemCarrito = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar item del carrito
        const item = await ModeloItemCarrito.findOne({ item_carrito_id: id });
        
        if (!item) {
            return res.status(404).json({
                exito: false,
                mensaje: "Item del carrito no encontrado",
                codigo: "CART_ITEM_NOT_FOUND"
            });
        }
        
        // Verificar que el carrito pertenece al usuario
        const carrito = await ModeloCarrito.findOne({
            carrito_id: item.carrito_id,
            usuario_id: req.usuario.usuario_id
        });
        
        if (!carrito) {
            return res.status(403).json({
                exito: false,
                mensaje: "No tienes permisos para modificar este carrito",
                codigo: "ACCESS_DENIED"
            });
        }
        
        // Eliminar item
        await ModeloItemCarrito.deleteOne({ item_carrito_id: id });
        
        // Actualizar fecha del carrito
        carrito.fecha_actualizacion = new Date();
        await carrito.save();
        
        res.json({
            exito: true,
            mensaje: "Item eliminado del carrito exitosamente"
        });
        
    } catch (error) {
        console.error("Error en eliminarItemCarrito:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

/**
 * Vaciar carrito completamente
 */
const vaciarCarrito = async (req, res) => {
    try {
        // Buscar carrito activo del usuario
        const carrito = await ModeloCarrito.findOne({
            usuario_id: req.usuario.usuario_id,
            estado: "activo"
        });
        
        if (!carrito) {
            return res.json({
                exito: true,
                mensaje: "El carrito ya está vacío"
            });
        }
        
        // Eliminar todos los items del carrito
        await ModeloItemCarrito.deleteMany({ carrito_id: carrito.carrito_id });
        
        // Actualizar fecha del carrito
        carrito.fecha_actualizacion = new Date();
        await carrito.save();
        
        res.json({
            exito: true,
            mensaje: "Carrito vaciado exitosamente"
        });
        
    } catch (error) {
        console.error("Error en vaciarCarrito:", error);
        res.status(500).json({
            exito: false,
            mensaje: "Error interno del servidor",
            codigo: "INTERNAL_ERROR",
            error: error.message
        });
    }
};

module.exports = {
    obtenerCarrito,
    agregarItemCarrito,
    actualizarItemCarrito,
    eliminarItemCarrito,
    vaciarCarrito
};