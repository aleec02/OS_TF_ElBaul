const mongoose = require("mongoose");

const comentarioSchema = new mongoose.Schema(
    {
        comentario_id: {
            type: String,
            unique: true
        },
        usuario_id: {
            type: String,
            required: [true, "El usuario es requerido"],
            ref: "Usuario"
        },
        post_id: {
            type: String,
            required: [true, "La publicación es requerida"],
            ref: "Publicacion"
        },
        contenido: {
            type: String,
            required: [true, "El contenido es requerido"],
            maxlength: [1000, "El comentario no puede exceder 1000 caracteres"]
        },
        fecha: {
            type: String,
            required: [true, "La fecha es requerida"]
        }
    },
    {
        versionKey: false,
        collection: "comentarios",
        timestamps: true
    }
);

// Middleware para generar comentario_id y fecha antes de validar
comentarioSchema.pre("validate", async function(next) {
    // Generar comentario_id
    if (this.isNew && !this.comentario_id) {
        try {
            const ultimoComentario = await mongoose.model("Comentario").findOne(
                {},
                { comentario_id: 1 }
            ).sort({ comentario_id: -1 }).lean();
            
            let nuevoNumero = 800001;
            if (ultimoComentario && ultimoComentario.comentario_id) {
                const ultimoNumero = parseInt(ultimoComentario.comentario_id.substring(3));
                nuevoNumero = ultimoNumero + 1;
            }
            
            this.comentario_id = "CMT" + nuevoNumero.toString();
            console.log("Comentario ID generado:", this.comentario_id);
        } catch (error) {
            console.error("Error generando comentario_id:", error);
            return next(error);
        }
    }
    
    // Generar fecha si no existe
    if (this.isNew && !this.fecha) {
        this.fecha = new Date().toISOString().replace('T', ' ').slice(0, 19);
    }
    
    next();
});

comentarioSchema.index({ post_id: 1, fecha: -1 });
comentarioSchema.index({ usuario_id: 1 });

comentarioSchema.methods.obtenerDatosPublicos = function() {
    return {
        comentario_id: this.comentario_id,
        usuario_id: this.usuario_id,
        post_id: this.post_id,
        contenido: this.contenido,
        fecha: this.fecha
    };
};

const ModeloComentario = mongoose.model("Comentario", comentarioSchema);

module.exports = ModeloComentario;