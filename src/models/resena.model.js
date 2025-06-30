const mongoose = require("mongoose");

const resenaSchema = new mongoose.Schema(
    {
        resena_id: {
            type: String,
            unique: true
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
        puntuacion: {
            type: Number,
            required: [true, "La puntuación es requerida"],
            min: [1, "La puntuación mínima es 1"],
            max: [5, "La puntuación máxima es 5"]
        },
        comentario: {
            type: String,
            required: [true, "El comentario es requerido"],
            maxlength: [1000, "El comentario no puede exceder 1000 caracteres"]
        },
        fecha: {
            type: String,
            required: [true, "La fecha es requerida"]
        },
        aprobada: {
            type: Boolean,
            default: false
        }
    },
    {
        versionKey: false,
        collection: "resenas",
        timestamps: true
    }
);

// Middleware para generar resena_id y fecha antes de validar
resenaSchema.pre("validate", async function(next) {
    // Generar resena_id
    if (this.isNew && !this.resena_id) {
        try {
            const ultimaResena = await mongoose.model("Resena").findOne(
                {},
                { resena_id: 1 }
            ).sort({ resena_id: -1 }).lean();
            
            let nuevoNumero = 120001;
            if (ultimaResena && ultimaResena.resena_id) {
                const ultimoNumero = parseInt(ultimaResena.resena_id.substring(2));
                nuevoNumero = ultimoNumero + 1;
            }
            
            this.resena_id = "RE" + nuevoNumero.toString();
            console.log("Reseña ID generado:", this.resena_id);
        } catch (error) {
            console.error("Error generando resena_id:", error);
            return next(error);
        }
    }
    
    // Generar fecha si no existe
    if (this.isNew && !this.fecha) {
        this.fecha = new Date().toISOString().replace('T', ' ').slice(0, 19);
    }
    
    next();
});

// Índice compuesto para evitar duplicados (un usuario solo puede reseñar un producto una vez)
resenaSchema.index({ usuario_id: 1, producto_id: 1 }, { unique: true });

resenaSchema.index({ producto_id: 1, aprobada: 1 });
resenaSchema.index({ aprobada: 1, fecha: -1 });

resenaSchema.methods.obtenerDatosPublicos = function() {
    return {
        resena_id: this.resena_id,
        producto_id: this.producto_id,
        usuario_id: this.usuario_id,
        puntuacion: this.puntuacion,
        comentario: this.comentario,
        fecha: this.fecha,
        aprobada: this.aprobada
    };
};

const ModeloResena = mongoose.model("Resena", resenaSchema);

module.exports = ModeloResena;