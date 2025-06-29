const jwt = require("jsonwebtoken");

// Cargar variables de entorno
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_no_usar_en_produccion";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";

const tokenBlacklist = new Set();

/**
 * Generar token JWT
 */
const generarToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRE
    });
};

/**
 * Verificar token JWT
 */
const verificarToken = (token) => {
    try {
        // Verificar si el token está en blacklist
        if (tokenBlacklist.has(token)) {
            throw new Error("Token invalidado");
        }
        
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw new Error("Token inválido");
    }
};

/**
 * Invalidar token (para logout)
 */
const invalidarToken = (token) => {
    tokenBlacklist.add(token);
};

/**
 * Decodificar token sin verificar
 */
const decodificarToken = (token) => {
    return jwt.decode(token);
};

module.exports = {
    generarToken,
    verificarToken,
    invalidarToken,
    decodificarToken
};