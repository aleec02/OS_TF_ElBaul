const jwt = require("jsonwebtoken");

require('dotenv').config();

// obtener configuración desde variables de entorno
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_no_usar_en_produccion";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";


if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    console.error("ERROR: JWT_SECRET no está configurado en producción");
    process.exit(1);
}


const generarToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRE
    });
};


const verificarToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw new Error("Token inválido");
    }
};


const decodificarToken = (token) => {
    return jwt.decode(token);
};

module.exports = {
    generarToken,
    verificarToken,
    decodificarToken
};