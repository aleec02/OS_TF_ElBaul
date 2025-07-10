const mongoose = require("mongoose");

const publicacionSchema = new mongoose.Schema(
    {
        post_id: {
            type: String,
            unique: true
        },
        usuario_id: {
            type: String,
            required: [true, "El usuario es requerido"],
            ref: "Usuario"
        },
        contenido: {
            type: String,
            required: [true, "El contenido es requerido"],
            maxlength: [2000, "El contenido no puede exceder 2000 caracteres"]
        },
        imagenes: [{
            type: String
        }],
        fecha: {
            type: String,
            required: [true, "La fecha es requerida"]
        },
        likes: {
            type: Number,
            default: 0,
            min: [0, "Los likes no pueden ser negativos"]
        },
        producto_id: {
            type: String,
            ref: "Producto"
        },
        tags: [{
            type: String,
            lowercase: true,
            trim: true
        }]
    },
    {
        versionKey: false,
        collection: "publicaciones",
        timestamps: true
    }
);

// Middleware para generar post_id y fecha antes de validar
publicacionSchema.pre("validate", async function(next) {
    // Generar post_id
    if (this.isNew && !this.post_id) {
        try {
            const ultimaPublicacion = await mongoose.model("Publicacion").findOne(
                {},
                { post_id: 1 }
            ).sort({ post_id: -1 }).lean();
            
            let nuevoNumero = 700001;
            if (ultimaPublicacion && ultimaPublicacion.post_id) {
                const ultimoNumero = parseInt(ultimaPublicacion.post_id.substring(4));
                nuevoNumero = ultimoNumero + 1;
            }
            
            this.post_id = "POST" + nuevoNumero.toString();
            console.log("Post ID generado:", this.post_id);
        } catch (error) {
            console.error("Error generando post_id:", error);
            return next(error);
        }
    }
    
    // Generar fecha si no existe
    if (this.isNew && !this.fecha) {
        this.fecha = new Date().toISOString().replace('T', ' ').slice(0, 19);
    }
    
    next();
});

publicacionSchema.index({ usuario_id: 1, fecha: -1 });
publicacionSchema.index({ producto_id: 1 });
publicacionSchema.index({ fecha: -1 });
publicacionSchema.index({ tags: 1 });
publicacionSchema.index({ likes: -1 });

publicacionSchema.methods.obtenerDatosPublicos = function() {
    return {
        post_id: this.post_id,
        usuario_id: this.usuario_id,
        contenido: this.contenido,
        imagenes: this.imagenes,
        fecha: this.fecha,
        likes: this.likes,
        producto_id: this.producto_id,
        tags: this.tags
    };
};

const ModeloPublicacion = mongoose.model("Publicacion", publicacionSchema);

module.exports = ModeloPublicacion;