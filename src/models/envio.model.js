const mongoose = require("mongoose");

const envioSchema = new mongoose.Schema(
    {
        envio_id: {
            type: String,
            unique: true
        },
        orden_id: {
            type: String,
            required: [true, "La orden es requerida"],
            ref: "Orden"
        },
        transportista: {
            type: String,
            required: [true, "El transportista es requerido"]
        },
        numero_seguimiento: {
            type: String,
            unique: true
        },
        fecha_envio: {
            type: String,
            required: [true, "La fecha de envío es requerida"]
        },
        fecha_estimada: {
            type: String,
            required: [true, "La fecha estimada es requerida"]
        },
        estado: {
            type: String,
            required: [true, "El estado es requerido"]
        },
        costo_envio: {
            type: Number,
            required: [true, "El costo de envío es requerido"],
            min: [0, "El costo no puede ser negativo"]
        }
    },
    {
        versionKey: false,
        collection: "envios",
        timestamps: true
    }
);

// Middleware para generar envio_id antes de validar
envioSchema.pre("validate", async function(next) {
    if (this.isNew && !this.envio_id) {
        try {
            const ultimoEnvio = await mongoose.model("Envio").findOne(
                {},
                { envio_id: 1 }
            ).sort({ envio_id: -1 }).lean();
            
            let nuevoNumero = 100001;
            if (ultimoEnvio && ultimoEnvio.envio_id) {
                const ultimoNumero = parseInt(ultimoEnvio.envio_id.substring(2));
                nuevoNumero = ultimoNumero + 1;
            }
            
            this.envio_id = "EN" + nuevoNumero.toString();
            console.log("Envío ID generado:", this.envio_id);
        } catch (error) {
            console.error("Error generando envio_id:", error);
            return next(error);
        }
    }
    next();
});

// Middleware para generar número de seguimiento
envioSchema.pre("save", function(next) {
    if (this.isNew && !this.numero_seguimiento) {
        const timestamp = Date.now().toString().slice(-5);
        this.numero_seguimiento = `TRK-${timestamp}`;
    }
    next();
});

envioSchema.index({ orden_id: 1 });
envioSchema.index({ estado: 1 });


envioSchema.methods.obtenerDatosPublicos = function() {
    return {
        envio_id: this.envio_id,
        orden_id: this.orden_id,
        transportista: this.transportista,
        numero_seguimiento: this.numero_seguimiento,
        fecha_envio: this.fecha_envio,
        fecha_estimada: this.fecha_estimada,
        estado: this.estado,
        costo_envio: this.costo_envio
    };
};

const ModeloEnvio = mongoose.model("Envio", envioSchema);

module.exports = ModeloEnvio;