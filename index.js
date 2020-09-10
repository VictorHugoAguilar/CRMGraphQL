const { ApolloServer } = require('apollo-server');
// Importamos los shemas
const typeDefs = require('./db/schema');
// Importamos los resolvers
const resolvers = require('./db/resolvers');
// importamos la conexion con la DB
const conectarDB = require('./config/db');

// Conectar con la DB
conectarDB();

// creamos una instancia del apolloServer
const server = new ApolloServer({
    typeDefs,
    resolvers
});

// arrancamos el servidor
server.listen()
    .then(({ url }) => {
        console.log(`Servidor listo en la URL: ${url}`);
    })
