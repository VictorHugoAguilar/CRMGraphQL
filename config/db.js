const mongoose = require('mongoose');

require('dotenv').config({ path: 'variables.env' });

const conectarDB = async () => {
    try {
        await mongoose.connect(process.env.DB_MONGO, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            useFindAndModify: false,
            useCreateIndex: true
        });
        const db = {
            name: mongoose.connections[0].name,
            host: mongoose.connections[0].host,
            port: mongoose.connections[0].port,
        }
        console.log('DB conectada', db);
    } catch (error) {
        console.log('Hubo un error');
        console.log(error);
        process.exit(1); // detener la app
    }
}

module.exports = conectarDB;