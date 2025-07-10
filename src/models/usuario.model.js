const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const usuarioSchema = new mongoose.Schema(
    {
        usuario_id: {
            type: String,
            unique: true
        },
        nombre: {
            type: String,
            required: [true, "El nombre es requerido"],
            trim: true
        },
        apellido: {
            type: String,
            required: [true, "El apellido es requerido"],
            trim: true
        },
        email: {
            type: String,
            required: [true, "El email es requerido"],
            unique: true,
            lowercase: true,
            trim: true
        },
        contrasena_hash: {
            type: String,
            required: [true, "La contraseña es requerida"]
        },
        direccion: {
            type: String,
            trim: true
        },
        telefono: {
            type: String,
            trim: true
        },
        fecha_registro: {
            type: Date,
            default: Date.now
        },
        rol: {
            type: String,
            enum: ["cliente", "admin"],
            default: "cliente"
        },
        estado: {
            type: Boolean,
            default: true
        }
    },
    {
        versionKey: false,
        collection: "usuarios"
    }
);

// Middleware para generar usuario_id antes de validar
usuarioSchema.pre("validate", async function(next) {
    // Solo generar usuario_id si es un documento nuevo y no tiene usuario_id
    if (this.isNew && !this.usuario_id) {
        try {
            // Buscar el último usuario para generar el siguiente ID
            const ultimoUsuario = await mongoose.model("Usuario").findOne(
                {}, 
                { usuario_id: 1 }
            ).sort({ usuario_id: -1 }).lean();
            
            let nuevoNumero = 100001;
            
            if (ultimoUsuario && ultimoUsuario.usuario_id) {
                const ultimoNumero = parseInt(ultimoUsuario.usuario_id.substring(2));
                nuevoNumero = ultimoNumero + 1;
            }
            
            this.usuario_id = "US" + nuevoNumero.toString();
            console.log("Usuario ID generado:", this.usuario_id);
        } catch (error) {
            console.error("Error generando usuario_id:", error);
            return next(error);
        }
    }
    next();
});

// Middleware para hashear contraseña antes de guardar
usuarioSchema.pre("save", async function(next) {
    if (this.isModified("contrasena_hash") && !this.contrasena_hash.startsWith("$2a$")) {
        try {
            const salt = await bcrypt.genSalt(10);
            this.contrasena_hash = await bcrypt.hash(this.contrasena_hash, salt);
            console.log("Contraseña hasheada exitosamente");
        } catch (error) {
            console.error("Error hasheando contraseña:", error);
            return next(error);
        }
    }
    next();
});


// método para comparar contraseñas
usuarioSchema.methods.compararContrasena = async function(contrasenaIngresada) {
    try {
        console.log('Comparing passwords:', {
            input: contrasenaIngresada,
            stored: this.contrasena_hash,
            isHashed: this.contrasena_hash.startsWith("$2a$")
        });
        
        // si la contraseña almacenada no está hasheada (datos existentes)
        if (!this.contrasena_hash.startsWith("$2a$")) {
            const result = contrasenaIngresada === this.contrasena_hash;
            console.log('Plain text comparison result:', result);
            return result;
        }
        
        const result = await bcrypt.compare(contrasenaIngresada, this.contrasena_hash);
        console.log('Hashed comparison result:', result);
        return result;
    } catch (error) {
        console.error("Error comparando contraseña:", error);
        return false;
    }
};

// Método para obtener datos públicos del usuario
usuarioSchema.methods.obtenerDatosPublicos = function() {
    return {
        usuario_id: this.usuario_id,
        nombre: this.nombre,
        apellido: this.apellido,
        email: this.email,
        direccion: this.direccion,
        telefono: this.telefono,
        fecha_registro: this.fecha_registro,
        rol: this.rol,
        estado: this.estado
    };
};

const ModeloUsuario = mongoose.model("Usuario", usuarioSchema);

module.exports = ModeloUsuario;