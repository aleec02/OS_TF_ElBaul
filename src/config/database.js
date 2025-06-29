const mongoose = require("mongoose");

// Cargar variables de entorno
require('dotenv').config();

// Determinar URI de conexión según el entorno
const obtenerURIConexion = () => {
    if (process.env.NODE_ENV === 'production') {
        return process.env.MONGODB_URI_DOCKER;
    }
    return process.env.MONGODB_URI || "mongodb://localhost:27018/elbaul_db";
};


// conectar a MongoDB
const uriConexion = obtenerURIConexion();

mongoose.connect(uriConexion)
    .then(db => {
        console.log("DB is connected to", db.connection.host);
        console.log("Database name:", db.connection.name);
    })
    .catch(err => {
        console.error("Error conectando a MongoDB:", err);
        process.exit(1);
    });

// manejar eventos de conexión
mongoose.connection.on('connected', () => {
    console.log('Mongoose conectado a MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Error de conexión MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose desconectado');
});


// Cerrar conexión cuando la app se cierra
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('Conexión MongoDB cerrada');
    process.exit(0);
});