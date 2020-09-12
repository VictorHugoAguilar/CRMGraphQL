const { ApolloServer } = require('apollo-server');
// Importamos los shemas
const typeDefs = require('./db/schema');
// Importamos los resolvers
const resolvers = require('./db/resolvers');
// importamos la conexion con la DB
const conectarDB = require('./config/db');
// Importamos JWT
const jwt = require('jsonwebtoken');
// importamos las variables de configuracion
require('dotenv').config({ path: 'variables.env' });

// Conectar con la DB
conectarDB();

// creamos una instancia del apolloServer
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({req}) => {
        // console.log(req.headers['authorization']);
        const token = req.headers['authorization'] || '';
        if(token){
            try {
                const user = jwt.verify(token, process.env.SECRETA);
                // console.log(user);
                // retornamos el usuario
                return {user};
            } catch (error) {
                console.log('Hubo un error\n', error);
            }
        }
    }
});

// arrancamos el servidor
server.listen()
    .then(({ url }) => {
        console.log(`Servidor listo en la URL: ${url}`);
    })
