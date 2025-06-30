const mongoose = require("mongoose");

const ordenSchema = new mongoose.Schema(
    {
        orden_id: {
            type: String,
            unique: true
        },
        usuario_id: {
            type: String,
            required: [true, "El usuario es requerido"],
            ref: "Usuario"
        },
        fecha_orden: {
            type: String,
            required: [true, "La fecha de orden es requerida"]
        },
        total: {
            type: Number,
            required: [true, "El total es requerido"],
            min: [0, "El total no puede ser negativo"]
        },
        estado: {
            type: String,
            required: [true, "El estado es requerido"]
        },
        metodo_pago: {
            type: String,
            required: [true, "El método de pago es requerido"]
        },
        direccion_envio: {
            type: String,
            required: [true, "La dirección de envío es requerida"]
        },
        comprobante_pago: {
            type: String,
            required: [true, "El comprobante de pago es requerido"]
        }
    },
    {
        versionKey: false,
        collection: "ordenes",
        timestamps: true
    }
);

// Middleware para generar orden_id, fecha_orden y comprobante_pago antes de validar
ordenSchema.pre("validate", async function(next) {
    // Generar orden_id
    if (this.isNew && !this.orden_id) {
        try {
            const ultimaOrden = await mongoose.model("Orden").findOne(
                {},
                { orden_id: 1 }
            ).sort({ orden_id: -1 }).lean();
            
            let nuevoNumero = 700001;
            if (ultimaOrden && ultimaOrden.orden_id) {
                const ultimoNumero = parseInt(ultimaOrden.orden_id.substring(2));
                nuevoNumero = ultimoNumero + 1;
            }
            
            this.orden_id = "OR" + nuevoNumero.toString();
            console.log("Orden ID generado:", this.orden_id);
        } catch (error) {
            console.error("Error generando orden_id:", error);
            return next(error);
        }
    }
    
    // Generar fecha_orden si no existe
    if (this.isNew && !this.fecha_orden) {
        this.fecha_orden = new Date().toISOString().replace('T', ' ').slice(0, 19);
    }
    
    // Generar comprobante_pago si no existe
    if (this.isNew && !this.comprobante_pago) {
        const año = new Date().getFullYear();
        const numeroOrden = this.orden_id ? this.orden_id.substring(2) : "000001";
        this.comprobante_pago = `COMP-${año}-${numeroOrden}`;
    }
    
    next();
});

// Índices para mejorar rendimiento
ordenSchema.index({ usuario_id: 1, fecha_orden: -1 });
ordenSchema.index({ estado: 1 });

// Método para obtener datos públicos
ordenSchema.methods.obtenerDatosPublicos = function() {
    return {
        orden_id: this.orden_id,
        usuario_id: this.usuario_id,
        fecha_orden: this.fecha_orden,
        total: this.total,
        estado: this.estado,
        metodo_pago: this.metodo_pago,
        direccion_envio: this.direccion_envio,
        comprobante_pago: this.comprobante_pago
    };
};

// Método para verificar si se puede cancelar
ordenSchema.methods.puedeSerCancelada = function() {
    return this.estado === "pendiente" || this.estado === "confirmada";
};

const ModeloOrden = mongoose.model("Orden", ordenSchema);

module.exports = ModeloOrden;