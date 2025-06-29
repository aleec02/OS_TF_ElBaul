const mongoose = require("mongoose");

const carritoSchema = new mongoose.Schema(
    {
        carrito_id: {
            type: String,
            unique: true
        },
        usuario_id: {
            type: String,
            required: [true, "El usuario es requerido"],
            ref: "Usuario"
        },
        fecha_creacion: {
            type: Date,
            default: Date.now
        },
        fecha_actualizacion: {
            type: Date,
            default: Date.now
        },
        estado: {
            type: String,
            enum: ["activo", "abandonado", "convertido"],
            default: "activo"
        }
    },
    {
        versionKey: false,
        collection: "carritos",
        timestamps: true
    }
);

// Middleware para generar carrito_id antes de validar
carritoSchema.pre("validate", async function(next) {
    if (this.isNew && !this.carrito_id) {
        try {
            const ultimoCarrito = await mongoose.model("Carrito").findOne(
                {}, 
                { carrito_id: 1 }
            ).sort({ carrito_id: -1 }).lean();
            
            let nuevoNumero = 500001;
            
            if (ultimoCarrito && ultimoCarrito.carrito_id) {
                const ultimoNumero = parseInt(ultimoCarrito.carrito_id.substring(2));
                nuevoNumero = ultimoNumero + 1;
            }
            
            this.carrito_id = "CR" + nuevoNumero.toString();
            console.log("Carrito ID generado:", this.carrito_id);
        } catch (error) {
            console.error("Error generando carrito_id:", error);
            return next(error);
        }
    }
    next();
});

// Middleware para actualizar fecha_actualizacion
carritoSchema.pre("save", function(next) {
    this.fecha_actualizacion = new Date();
    next();
});

// Método para obtener datos públicos
carritoSchema.methods.obtenerDatosPublicos = function() {
    return {
        carrito_id: this.carrito_id,
        usuario_id: this.usuario_id,
        fecha_creacion: this.fecha_creacion,
        fecha_actualizacion: this.fecha_actualizacion,
        estado: this.estado
    };
};

const ModeloCarrito = mongoose.model("Carrito", carritoSchema);

module.exports = ModeloCarrito;