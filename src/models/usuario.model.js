const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Schema de Usuario
const usuarioSchema = new mongoose.Schema(
    {
        usuario_id: {
            type: String,
            required: true,
            unique: true
        },
        nombre: {
            type: String,
            required: [true, "El nombre es requerido"],
            trim: true,
            maxlength: [50, "El nombre no puede exceder 50 caracteres"]
        },
        apellido: {
            type: String,
            required: [true, "El apellido es requerido"],
            trim: true,
            maxlength: [50, "El apellido no puede exceder 50 caracteres"]
        },
        email: {
            type: String,
            required: [true, "El email es requerido"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Email inválido"]
        },
        contrasena_hash: {
            type: String,
            required: [true, "La contraseña es requerida"],
            minlength: [6, "La contraseña debe tener al menos 6 caracteres"]
        },
        direccion: {
            type: String,
            trim: true,
            maxlength: [200, "La dirección no puede exceder 200 caracteres"]
        },
        telefono: {
            type: String,
            trim: true,
            match: [/^[0-9]{9,15}$/, "Teléfono inválido"]
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
        timestamps: true,
        versionKey: false
    }
);

// Middleware para generar usuario_id antes de guardar
usuarioSchema.pre("save", async function(next) {
    if (this.isNew) {
        // Generar usuario_id único
        const ultimoUsuario = await mongoose.model("Usuario").findOne().sort({ usuario_id: -1 });
        let nuevoNumero = 1;
        
        if (ultimoUsuario && ultimoUsuario.usuario_id) {
            const ultimoNumero = parseInt(ultimoUsuario.usuario_id.substring(2));
            nuevoNumero = ultimoNumero + 1;
        }
        
        this.usuario_id = "US" + nuevoNumero.toString().padStart(6, "0");
    }
    
    // Hash de la contraseña si fue modificada
    if (this.isModified("contrasena_hash")) {
        const salt = await bcrypt.genSalt(10);
        this.contrasena_hash = await bcrypt.hash(this.contrasena_hash, salt);
    }
    
    next();
});

// Método para comparar contraseñas
usuarioSchema.methods.compararContrasena = async function(contrasenaIngresada) {
    return await bcrypt.compare(contrasenaIngresada, this.contrasena_hash);
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

// Asociar el Schema a la colección usuarios
const ModeloUsuario = mongoose.model("Usuario", usuarioSchema);

module.exports = ModeloUsuario;