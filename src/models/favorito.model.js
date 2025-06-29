const mongoose = require("mongoose");

const favoritoSchema = new mongoose.Schema(
    {
        favorito_id: {
            type: String,
            unique: true
        },
        usuario_id: {
            type: String,
            required: [true, "El usuario es requerido"],
            ref: "Usuario"
        },
        producto_id: {
            type: String,
            required: [true, "El producto es requerido"],
            ref: "Producto"
        },
        fecha_agregado: {
            type: Date,
            default: Date.now
        }
    },
    {
        versionKey: false,
        collection: "favoritos",
        timestamps: true
    }
);

// Middleware para generar favorito_id antes de validar
favoritoSchema.pre("validate", async function(next) {
    if (this.isNew && !this.favorito_id) {
        try {
            const ultimoFavorito = await mongoose.model("Favorito").findOne(
                {}, 
                { favorito_id: 1 }
            ).sort({ favorito_id: -1 }).lean();
            
            let nuevoNumero = 130001;
            
            if (ultimoFavorito && ultimoFavorito.favorito_id) {
                const ultimoNumero = parseInt(ultimoFavorito.favorito_id.substring(2));
                nuevoNumero = ultimoNumero + 1;
            }
            
            this.favorito_id = "FA" + nuevoNumero.toString();
            console.log("Favorito ID generado:", this.favorito_id);
        } catch (error) {
            console.error("Error generando favorito_id:", error);
            return next(error);
        }
    }
    next();
});

// Índice compuesto para evitar duplicados
favoritoSchema.index({ usuario_id: 1, producto_id: 1 }, { unique: true });

// Método para obtener datos públicos
favoritoSchema.methods.obtenerDatosPublicos = function() {
    return {
        favorito_id: this.favorito_id,
        usuario_id: this.usuario_id,
        producto_id: this.producto_id,
        fecha_agregado: this.fecha_agregado
    };
};

const ModeloFavorito = mongoose.model("Favorito", favoritoSchema);

module.exports = ModeloFavorito;