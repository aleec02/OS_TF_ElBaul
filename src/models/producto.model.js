const mongoose = require("mongoose");

// no usuario_id requerido; siguiendo sin mods al JSON SCHEMA
const productoSchema = new mongoose.Schema(
    {
        producto_id: {
            type: String,
            unique: true
        },
        titulo: {
            type: String,
            required: [true, "El título del producto es requerido"],
            trim: true,
            maxlength: [200, "El título no puede exceder 200 caracteres"]
        },
        descripcion: {
            type: String,
            required: [true, "La descripción es requerida"],
            trim: true,
            maxlength: [1000, "La descripción no puede exceder 1000 caracteres"]
        },
        precio: {
            type: Number,
            required: [true, "El precio es requerido"],
            min: [0, "El precio no puede ser negativo"]
        },
        estado: {
            type: String,
            enum: ["nuevo", "como_nuevo", "excelente", "bueno", "regular"],
            required: [true, "El estado del producto es requerido"]
        },
        fecha_publicacion: {
            type: Date,
            default: Date.now
        },
        stock: {
            type: Number,
            required: [true, "El stock es requerido"],
            min: [0, "El stock no puede ser negativo"],
            default: 1
        },
        ubicacion_almacen: {
            type: String,
            trim: true
        },
        marca: {
            type: String,
            trim: true,
            maxlength: [100, "La marca no puede exceder 100 caracteres"]
        },
        modelo: {
            type: String,
            trim: true,
            maxlength: [100, "El modelo no puede exceder 100 caracteres"]
        },
        año_fabricacion: {
            type: Number,
            min: [1900, "Año de fabricación inválido"],
            max: [new Date().getFullYear(), "Año de fabricación no puede ser futuro"]
        },
        categoria_id: {
            type: String,
            required: [true, "La categoría es requerida"],
            ref: "Categoria"
        },
        usuario_id: {
            type: String,
            ref: "Usuario"
            // SIN required: true
        },
        activo: {
            type: Boolean,
            default: true
        },
        destacado: {
            type: Boolean,
            default: false
        }
    },
    {
        versionKey: false,
        collection: "productos",
        timestamps: true
    }
);

// Middleware para generar producto_id antes de validar
productoSchema.pre("validate", async function(next) {
    if (this.isNew && !this.producto_id) {
        try {
            const ultimoProducto = await mongoose.model("Producto").findOne(
                {}, 
                { producto_id: 1 }
            ).sort({ producto_id: -1 }).lean();
            
            let nuevoNumero = 300001;
            
            if (ultimoProducto && ultimoProducto.producto_id) {
                const ultimoNumero = parseInt(ultimoProducto.producto_id.substring(2));
                nuevoNumero = ultimoNumero + 1;
            }
            
            this.producto_id = "PR" + nuevoNumero.toString();
            console.log("Producto ID generado:", this.producto_id);
        } catch (error) {
            console.error("Error generando producto_id:", error);
            return next(error);
        }
    }
    next();
});

// Índices para búsquedas eficientes
productoSchema.index({ titulo: "text", descripcion: "text" });
productoSchema.index({ categoria_id: 1 });
productoSchema.index({ precio: 1 });
productoSchema.index({ estado: 1 });
productoSchema.index({ activo: 1 });
productoSchema.index({ fecha_publicacion: -1 });

// Método para obtener datos públicos
productoSchema.methods.obtenerDatosPublicos = function() {
    return {
        producto_id: this.producto_id,
        titulo: this.titulo,
        descripcion: this.descripcion,
        precio: this.precio,
        estado: this.estado,
        fecha_publicacion: this.fecha_publicacion,
        stock: this.stock,
        ubicacion_almacen: this.ubicacion_almacen,
        marca: this.marca,
        modelo: this.modelo,
        año_fabricacion: this.año_fabricacion,
        categoria_id: this.categoria_id,
        usuario_id: this.usuario_id, // puede ser undefined para productos del sistema
        activo: this.activo,
        destacado: this.destacado
    };
};

const ModeloProducto = mongoose.model("Producto", productoSchema);

module.exports = ModeloProducto;