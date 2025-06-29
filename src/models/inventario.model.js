const mongoose = require("mongoose");

// Schema de Inventario - basado en tus datos JSON
const inventarioSchema = new mongoose.Schema(
    {
        inventario_id: {
            type: String,
            unique: true
        },
        producto_id: {
            type: String,
            required: [true, "El producto_id es requerido"],
            ref: "Producto"
        },
        cantidad_disponible: {
            type: Number,
            required: [true, "La cantidad disponible es requerida"],
            min: [0, "La cantidad disponible no puede ser negativa"],
            default: 0
        },
        cantidad_reservada: {
            type: Number,
            required: [true, "La cantidad reservada es requerida"],
            min: [0, "La cantidad reservada no puede ser negativa"],
            default: 0
        },
        ubicacion: {
            type: String,
            trim: true,
            maxlength: [50, "La ubicación no puede exceder 50 caracteres"]
        },
        fecha_actualizacion: {
            type: Date,
            default: Date.now
        }
    },
    {
        versionKey: false,
        collection: "inventarios",
        timestamps: true
    }
);

// Middleware para generar inventario_id antes de validar
inventarioSchema.pre("validate", async function(next) {
    if (this.isNew && !this.inventario_id) {
        try {
            const ultimoInventario = await mongoose.model("Inventario").findOne(
                {}, 
                { inventario_id: 1 }
            ).sort({ inventario_id: -1 }).lean();
            
            let nuevoNumero = 110001;
            
            if (ultimoInventario && ultimoInventario.inventario_id) {
                const ultimoNumero = parseInt(ultimoInventario.inventario_id.substring(2));
                nuevoNumero = ultimoNumero + 1;
            }
            
            this.inventario_id = "IN" + nuevoNumero.toString();
            console.log("Inventario ID generado:", this.inventario_id);
        } catch (error) {
            console.error("Error generando inventario_id:", error);
            return next(error);
        }
    }
    next();
});

// Middleware para actualizar fecha_actualizacion
inventarioSchema.pre("save", function(next) {
    this.fecha_actualizacion = new Date();
    next();
});

// Método para verificar disponibilidad
inventarioSchema.methods.verificarDisponibilidad = function(cantidadSolicitada) {
    return this.cantidad_disponible >= cantidadSolicitada;
};

// Método para reservar stock
inventarioSchema.methods.reservarStock = function(cantidad) {
    if (this.cantidad_disponible >= cantidad) {
        this.cantidad_disponible -= cantidad;
        this.cantidad_reservada += cantidad;
        return true;
    }
    return false;
};

const ModeloInventario = mongoose.model("Inventario", inventarioSchema);

module.exports = ModeloInventario;