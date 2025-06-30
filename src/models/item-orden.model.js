const mongoose = require("mongoose");

const itemOrdenSchema = new mongoose.Schema(
    {
        item_orden_id: {
            type: String,
            unique: true
        },
        orden_id: {
            type: String,
            required: [true, "La orden es requerida"],
            ref: "Orden"
        },
        producto_id: {
            type: String,
            required: [true, "El producto es requerido"],
            ref: "Producto"
        },
        cantidad: {
            type: Number,
            required: [true, "La cantidad es requerida"],
            min: [1, "La cantidad debe ser mayor a 0"]
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
        }
    },
    {
        versionKey: false,
        collection: "item_ordenes",
        timestamps: true
    }
);

// Middleware para generar item_orden_id antes de validar
itemOrdenSchema.pre("validate", async function(next) {
    if (this.isNew && !this.item_orden_id) {
        try {
            const ultimoItem = await mongoose.model("ItemOrden").findOne(
                {},
                { item_orden_id: 1 }
            ).sort({ item_orden_id: -1 }).lean();
            
            let nuevoNumero = 800001;
            if (ultimoItem && ultimoItem.item_orden_id) {
                const ultimoNumero = parseInt(ultimoItem.item_orden_id.substring(2));
                nuevoNumero = ultimoNumero + 1;
            }
            
            this.item_orden_id = "IO" + nuevoNumero.toString();
            console.log("Item Orden ID generado:", this.item_orden_id);
        } catch (error) {
            console.error("Error generando item_orden_id:", error);
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
itemOrdenSchema.pre("save", function(next) {
    if (this.cantidad && this.precio_unitario) {
        this.subtotal = this.cantidad * this.precio_unitario;
    }
    next();
});

itemOrdenSchema.index({ orden_id: 1 });

itemOrdenSchema.methods.obtenerDatosPublicos = function() {
    return {
        item_orden_id: this.item_orden_id,
        orden_id: this.orden_id,
        producto_id: this.producto_id,
        cantidad: this.cantidad,
        precio_unitario: this.precio_unitario,
        subtotal: this.subtotal
    };
};

const ModeloItemOrden = mongoose.model("ItemOrden", itemOrdenSchema);

module.exports = ModeloItemOrden;