const mongoose = require("mongoose");

const pagoSchema = new mongoose.Schema(
    {
        pago_id: {
            type: String,
            unique: true
        },
        orden_id: {
            type: String,
            required: [true, "La orden es requerida"],
            ref: "Orden"
        },
        monto: {
            type: Number,
            required: [true, "El monto es requerido"],
            min: [0, "El monto no puede ser negativo"]
        },
        metodo: {
            type: String,
            required: [true, "El método de pago es requerido"]
        },
        fecha: {
            type: String,
            required: [true, "La fecha es requerida"]
        },
        estado: {
            type: String,
            required: [true, "El estado es requerido"]
        },
        codigo_transaccion: {
            type: String,
            required: [true, "El código de transacción es requerido"]
        }
    },
    {
        versionKey: false,
        collection: "pagos",
        timestamps: true
    }
);

// Middleware para generar pago_id, fecha y codigo_transaccion antes de validar
pagoSchema.pre("validate", async function(next) {
    // Generar pago_id
    if (this.isNew && !this.pago_id) {
        try {
            const ultimoPago = await mongoose.model("Pago").findOne(
                {},
                { pago_id: 1 }
            ).sort({ pago_id: -1 }).lean();
            
            let nuevoNumero = 900001;
            if (ultimoPago && ultimoPago.pago_id) {
                const ultimoNumero = parseInt(ultimoPago.pago_id.substring(2));
                nuevoNumero = ultimoNumero + 1;
            }
            
            this.pago_id = "PA" + nuevoNumero.toString();
            console.log("Pago ID generado:", this.pago_id);
        } catch (error) {
            console.error("Error generando pago_id:", error);
            return next(error);
        }
    }
    
    // Generar fecha si no existe
    if (this.isNew && !this.fecha) {
        this.fecha = new Date().toISOString().replace('T', ' ').slice(0, 19);
    }
    
    // Generar código de transacción si no existe
    if (this.isNew && !this.codigo_transaccion) {
        const pagoId = this.pago_id ? this.pago_id.substring(2) : "000001";
        this.codigo_transaccion = `TRX-${new Date().getFullYear()}-${pagoId}`;
    }
    
    next();
});

pagoSchema.index({ orden_id: 1 });
pagoSchema.index({ estado: 1 });

pagoSchema.methods.obtenerDatosPublicos = function() {
    return {
        pago_id: this.pago_id,
        orden_id: this.orden_id,
        monto: this.monto,
        metodo: this.metodo,
        fecha: this.fecha,
        estado: this.estado,
        codigo_transaccion: this.codigo_transaccion
    };
};

const ModeloPago = mongoose.model("Pago", pagoSchema);

module.exports = ModeloPago;