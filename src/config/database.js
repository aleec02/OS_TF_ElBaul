const mongoose = require("mongoose");

// ENV DEV - Conexión local
mongoose.connect("mongodb://localhost:27018/elbaul_db")
    .then(db => console.log("DB is connected to", db.connection.host))
    .catch(err => console.error(err));

/*
// ENV PROD - Conexión Docker
mongoose.connect("mongodb://database/elbaul_db")
    .then(db => console.log("DB is connected to", db.connection.host))
    .catch(err => console.error(err));
*/