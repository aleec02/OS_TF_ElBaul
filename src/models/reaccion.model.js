const mongoose = require("mongoose");

const reaccionSchema = new mongoose.Schema(
    {
        reaccion_id: {
            type: String,
            unique: true
        },
        usuario_id: {
            type: String,
            required: [true, "El usuario es requerido"],
            ref: "Usuario"
        },
        tipo: {
            type: String,
            required: [true, "El tipo de reacción es requerido"],
            enum: ["like", "love", "genial", "wow", "sad", "angry"]
        },
        entidad: {
            type: String,
            required: [true, "La entidad es requerida"],
            enum: ["post", "comentario"]
        },
        entidad_id: {
            type: String,
            required: [true, "El ID de la entidad es requerido"]
        },
        fecha: {
            type: String,
            required: [true, "La fecha es requerida"]
        }
    },
    {
        versionKey: false,
        collection: "reacciones",
        timestamps: true
    }
);

// Middleware para generar reaccion_id y fecha antes de validar
reaccionSchema.pre("validate", async function(next) {
    // Generar reaccion_id
    if (this.isNew && !this.reaccion_id) {
        try {
            const ultimaReaccion = await mongoose.model("Reaccion").findOne(
                {},
                { reaccion_id: 1 }
            ).sort({ reaccion_id: -1 }).lean();
            
            let nuevoNumero = 900001;
            if (ultimaReaccion && ultimaReaccion.reaccion_id) {
                const ultimoNumero = parseInt(ultimaReaccion.reaccion_id.substring(3));
                nuevoNumero = ultimoNumero + 1;
            }
            
            this.reaccion_id = "RCN" + nuevoNumero.toString();
            console.log("Reacción ID generado:", this.reaccion_id);
        } catch (error) {
            console.error("Error generando reaccion_id:", error);
            return next(error);
        }
    }
    
    // Generar fecha si no existe
    if (this.isNew && !this.fecha) {
        this.fecha = new Date().toISOString().replace('T', ' ').slice(0, 19);
    }
    
    next();
});

// Índice compuesto para evitar duplicados (un usuario solo puede reaccionar una vez por entidad)
reaccionSchema.index({ usuario_id: 1, entidad: 1, entidad_id: 1 }, { unique: true });

reaccionSchema.index({ entidad: 1, entidad_id: 1 });
reaccionSchema.index({ usuario_id: 1 });

reaccionSchema.methods.obtenerDatosPublicos = function() {
    return {
        reaccion_id: this.reaccion_id,
        usuario_id: this.usuario_id,
        tipo: this.tipo,
        entidad: this.entidad,
        entidad_id: this.entidad_id,
        fecha: this.fecha
    };
};

const ModeloReaccion = mongoose.model("Reaccion", reaccionSchema);

module.exports = ModeloReaccion;