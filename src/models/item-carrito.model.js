const mongoose = require("mongoose");

const itemCarritoSchema = new mongoose.Schema(
    {
        item_carrito_id: {
            type: String,
            unique: true
        },
        carrito_id: {
            type: String,
            required: [true, "El carrito es requerido"],
            ref: "Carrito"
        },
        producto_id: {
            type: String,
            required: [true, "El producto es requerido"],
            ref: "Producto"
        },
        cantidad: {
            type: Number,
            required: [true, "La cantidad es requerida"],
            min: [1, "La cantidad debe ser mayor a 0"],
            max: [99, "La cantidad no puede exceder 99"]
        },
        precio_unitario: {
            type: Number,
            required: [true, "El precio unitario es requerido"],
            min: [0, "El precio no puede ser negativo"]
        },
        subtotal: {
            type: Number,
            required: [true, "El subtotal es requerido"],
            min: [0, "El subtotal no puede ser negativo"]
        },
        fecha_agregado: {
            type: Date,
            default: Date.now
        }
    },
    {
        versionKey: false,
        collection: "item_carritos",
        timestamps: true
    }
);

itemCarritoSchema.pre("validate", async function(next) {
    if (this.isNew && !this.item_carrito_id) {
        try {
            const ultimoItem = await mongoose.model("ItemCarrito").findOne(
                {},
                { item_carrito_id: 1 }
            ).sort({ item_carrito_id: -1 }).lean();
            
            let nuevoNumero = 600001;
            if (ultimoItem && ultimoItem.item_carrito_id) {
                const ultimoNumero = parseInt(ultimoItem.item_carrito_id.substring(2));
                nuevoNumero = ultimoNumero + 1;
            }
            
            this.item_carrito_id = "IC" + nuevoNumero.toString();
            console.log("Item Carrito ID generado:", this.item_carrito_id);
        } catch (error) {
            console.error("Error generando item_carrito_id:", error);
            return next(error);
        }
    }
    
    // CALCULAR SUBTOTAL ANTES DE LA VALIDACIÓN
    if (this.cantidad && this.precio_unitario) {
        this.subtotal = this.cantidad * this.precio_unitario;
    }
    
    next();
});

// Middleware adicional para recalcular subtotal cuando se actualiza
itemCarritoSchema.pre("save", function(next) {
    if (this.cantidad && this.precio_unitario) {
        this.subtotal = this.cantidad * this.precio_unitario;
    }
    next();
});

// Índice compuesto para evitar duplicados
itemCarritoSchema.index({ carrito_id: 1, producto_id: 1 }, { unique: true });

// Método para obtener datos públicos
itemCarritoSchema.methods.obtenerDatosPublicos = function() {
    return {
        item_carrito_id: this.item_carrito_id,
        carrito_id: this.carrito_id,
        producto_id: this.producto_id,
        cantidad: this.cantidad,
        precio_unitario: this.precio_unitario,
        subtotal: this.subtotal,
        fecha_agregado: this.fecha_agregado
    };
};

const ModeloItemCarrito = mongoose.model("ItemCarrito", itemCarritoSchema);

module.exports = ModeloItemCarrito;