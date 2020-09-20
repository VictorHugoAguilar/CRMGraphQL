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
    type Pedido {
        id: ID
        pedido: [PedidoGrupo]
        total: Float
        cliente: ID
        vendedor: ID
        creado: String
        estado: EstadoPedido
    }
    type PedidoGrupo{
        id: ID
        cantidad: Int
    }
    type TopCliente{
        total: Float
        cliente: [Cliente]
    }
    type TopVendedor {
        total: Float
        vendedor: [Usuario]
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
    input PedidoInput {
        pedido: [ PedidoProductoInput ]
        total: Float
        cliente: ID
        estado: EstadoPedido
    }
    input PedidoProductoInput {
       id: ID
       cantidad: Int
    }
   enum EstadoPedido {
        PENDIENTE
        COMPLETADO
        CANCELADO
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
        fnGetClienteById(id: ID!): Cliente

        #Pedidos
        fnGetPedido: [Pedido]
        fnGetPedidoByVendedor: [Pedido]
        fnGetPedidoById(id: ID!) : Pedido 
        fnGetPedidoByStatus( estado: String! ) : [Pedido]

        # Busquedas Avanzadas
        fnGetMejoresClientes: [ TopCliente]
        fnGetMejoresVendedores: [ TopVendedor ] 
        fnGetProducto(texto: String!) : [Producto]
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
        fnUpdateCliente(id: ID!, input: ClienteInput) : Cliente
        fnDeleteCliente(id: ID!) : String

        # Pedidos
        fnNuevoPedido( input: PedidoInput ) : Pedido
        fnUpdatePedido(id: ID!, input: PedidoInput) : Pedido
        fnDeletePedido( id: ID!): String
   }
`;

module.exports = typeDefs; 