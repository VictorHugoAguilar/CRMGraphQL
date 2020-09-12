const { gql } = require('apollo-server');

// Schema
const typeDefs = gql`
   type Usuario {
        id: ID
        nombre: String
        apellido: String
        email: String
        creado: String
   }
   type Token {
       token: String
   }
   type Producto {
       id: ID
       nombre: String
       existencia: Int
       precio: Float
       creado: String
   }
   type Cliente {
    id: ID
    nombre: String
    apellido: String
    empresa: String
    email: String
    telefono: String
    vendedor: ID
}
   input UsuarioInput {
       nombre: String!
       apellido: String!
       email: String!
       password: String!
   }
   input AutenticarInput {
       email: String!
       password: String!
   }
   input ProductoInput {
       nombre: String!
       existencia: Int!
       precio: Float!
   }
   input ClienteInput {
       nombre: String!
       apellido: String!
       empresa: String!
       email: String!
       telefono: String
   }
   type Query {
       #Usuarios
        fnGetUser(token: String!) : Usuario

        #Productos
        fnGetProductos: [Producto]
        fnGetProductoById(id: ID!): Producto

        #Clientes
        fnGetClientes: [Cliente]
        fnGetClientesByVendendor: [Cliente]
   }
   type Mutation {
        # Usuarios
        nuevoUsuario(input: UsuarioInput) : Usuario
        autenticarUsuario(input: AutenticarInput) : Token

        # Productos
        nuevoProducto(input: ProductoInput) : Producto
        fnUpdateProducto(id: ID!, input: ProductoInput) : Producto
        fnDeleteProducto(id: ID!) : String

        # Clientes
        fnAddCliente(input: ClienteInput) : Cliente
   }
`;

module.exports = typeDefs; 