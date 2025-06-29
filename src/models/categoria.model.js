const mongoose = require("mongoose");

// Schema de Categoría - basado en tus datos JSON
const categoriaSchema = new mongoose.Schema(
    {
        categoria_id: {
            type: String,
            unique: true
        },
        nombre: {
            type: String,
            required: [true, "El nombre de la categoría es requerido"],
            trim: true,
            maxlength: [100, "El nombre no puede exceder 100 caracteres"]
        },
        descripcion: {
            type: String,
            trim: true,
            maxlength: [500, "La descripción no puede exceder 500 caracteres"]
        },
        imagen_url: {
            type: String,
            trim: true
        },
        activa: {
            type: Boolean,
            default: true
        }
    },
    {
        versionKey: false,
        collection: "categorias",
        timestamps: true
    }
);

// Middleware para generar categoria_id antes de validar
categoriaSchema.pre("validate", async function(next) {
    if (this.isNew && !this.categoria_id) {
        try {
            const ultimaCategoria = await mongoose.model("Categoria").findOne(
                {}, 
                { categoria_id: 1 }
            ).sort({ categoria_id: -1 }).lean();
            
            let nuevoNumero = 200001;
            
            if (ultimaCategoria && ultimaCategoria.categoria_id) {
                const ultimoNumero = parseInt(ultimaCategoria.categoria_id.substring(2));
                nuevoNumero = ultimoNumero + 1;
            }
            
            this.categoria_id = "CA" + nuevoNumero.toString();
            console.log("Categoria ID generado:", this.categoria_id);
        } catch (error) {
            console.error("Error generando categoria_id:", error);
            return next(error);
        }
    }
    next();
});

// Método para obtener datos públicos
categoriaSchema.methods.obtenerDatosPublicos = function() {
    return {
        categoria_id: this.categoria_id,
        nombre: this.nombre,
        descripcion: this.descripcion,
        imagen_url: this.imagen_url,
        activa: this.activa
    };
};

const ModeloCategoria = mongoose.model("Categoria", categoriaSchema);

module.exports = ModeloCategoria;