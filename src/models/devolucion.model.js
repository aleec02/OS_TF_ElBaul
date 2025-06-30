const mongoose = require("mongoose");

const devolucionSchema = new mongoose.Schema(
    {
        devolucion_id: {
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
        usuario_id: {
            type: String,
            required: [true, "El usuario es requerido"],
            ref: "Usuario"
        },
        motivo: {
            type: String,
            required: [true, "El motivo es requerido"]
        },
        estado: {
            type: String,
            required: [true, "El estado es requerido"]
        },
        fecha_solicitud: {
            type: String,
            required: [true, "La fecha de solicitud es requerida"]
        },
        monto_reembolso: {
            type: Number,
            required: [true, "El monto de reembolso es requerido"],
            min: [0, "El monto no puede ser negativo"]
        }
    },
    {
        versionKey: false,
        collection: "devoluciones",
        timestamps: true
    }
);

// Middleware para generar devolucion_id antes de validar
devolucionSchema.pre("validate", async function(next) {
    if (this.isNew && !this.devolucion_id) {
        try {
            const ultimaDevolucion = await mongoose.model("Devolucion").findOne(
                {},
                { devolucion_id: 1 }
            ).sort({ devolucion_id: -1 }).lean();
            
            let nuevoNumero = 150001;
            if (ultimaDevolucion && ultimaDevolucion.devolucion_id) {
                const ultimoNumero = parseInt(ultimaDevolucion.devolucion_id.substring(2));
                nuevoNumero = ultimoNumero + 1;
            }
            
            this.devolucion_id = "DE" + nuevoNumero.toString();
            console.log("Devolución ID generado:", this.devolucion_id);
        } catch (error) {
            console.error("Error generando devolucion_id:", error);
            return next(error);
        }
    }
    next();
});

devolucionSchema.index({ usuario_id: 1 });
devolucionSchema.index({ orden_id: 1 });
devolucionSchema.index({ estado: 1 });

devolucionSchema.methods.obtenerDatosPublicos = function() {
    return {
        devolucion_id: this.devolucion_id,
        orden_id: this.orden_id,
        producto_id: this.producto_id,
        usuario_id: this.usuario_id,
        motivo: this.motivo,
        estado: this.estado,
        fecha_solicitud: this.fecha_solicitud,
        monto_reembolso: this.monto_reembolso
    };
};

const ModeloDevolucion = mongoose.model("Devolucion", devolucionSchema);

module.exports = ModeloDevolucion;