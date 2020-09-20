const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
const Pedido = require('../models/Pedido');

// importamos bcryptjs para crear hashear los pass
var bcrypt = require('bcryptjs');
// importamos jwt
var jwt = require('jsonwebtoken');
// importamos las variables de configuracion
require('dotenv').config({ path: 'variables.env' });

// funcion para crear el JWT
const getToken = (usuario, secreta, expiresIn) => {
    // console.log(usuario)
    const { id, email, nombre, apellido } = usuario;
    return jwt.sign({ id, email, nombre, apellido }, secreta, { expiresIn })
}

// Resolvers
const resolvers = {
    Query: {
        // Usuarios
        fnGetUser: async (_, { token }) => {
            // comprobamos el token
            const userId = await jwt.verify(token, process.env.SECRETA);
            // retornamos el usuario
            return userId;
            /*
            query fnGetUser($token: String!){
                fnGetUser(token: $token){
                    id
                    nombre
                    apellido
                    email
                }
            }
            QUERY
            {
             "token": " ... token ..."
            }
            */
        },

        // Productos
        fnGetProductos: async () => {
            try {
                const productos = await Producto.find({});
                return productos;
            } catch (error) {
                console.log(error);
            }
            // Query de consulta
            /*
            query fnGetProductos{
                fnGetProductos{
                    nombre
                    precio
                    existencia
                }
            }
            */
        },
        fnGetProductoById: async (_, { id }) => {
            try {
                // revisamos si existe el producto
                const producto = await Producto.findById(id);
                console.log(producto);
                if (!producto) {
                    throw new Error('Producto no encotrado');
                }
                return producto;
            } catch (error) {
                console.log(error);
            }
            // Query
            /*
            query fnGetProductoById($id: ID!){
                fnGetProductoById(id: $id){
                    id
                    nombre
                    precio
                    existencia
                }
            }
            // QUERY
            {
                 "id": "5f5a82dd3ceead2d8a57be97"
            }
            */
        },
        fnGetClientes: async () => {
            try {
                const clientes = await Cliente.find({});
                return clientes;
            } catch (err) {
                console.log(err);
            }
            // Query
            /*
            query fnGetClientes{
                fnGetClientes{
                    nombre
                    apellido
                    empresa
                    telefono
                    email
                    vendedor
                }
            }
            */
        },
        fnGetClientesByVendendor: async (_, { }, ctx) => {
            // Obtenemos el usuario del context
            if (!ctx.user) {
                throw new Error('Id del usuario no obtenida');
            }
            const { id } = ctx.user;
            try {
                const clientes = Cliente.find({ vendedor: id });
                return clientes;
            } catch (err) {
                console.log(err);
            }
            // Query
            /*
            query fnGetClientesByVendendor{
               fnGetClientesByVendendor{
                   id
                   nombre
                   apellido
                   empresa
                   email
               }
           }
           // Headers
           {
               "authorization":"token"
           }
            */
        },
        fnGetClienteById: async (_, { id }, ctx) => {
            // Comprobamos que el cliente exista
            const cliente = await Cliente.findById(id);
            if (!cliente) {
                throw new Error('Cliente no encontrado');
            }
            // Quien lo creo puede verlo
            if (cliente.vendedor.toString() !== ctx.user.id) {
                throw new Error('No tienes credenciales para ver el cliente');
            }
            return cliente;
        },
        // PEDIDOS
        fnGetPedido: async () => {
            try {
                const pedidos = await Pedido.find({});
                return pedidos;
            } catch (error) {
                console.log(error);
            }
            // query
            /* 
            query fnGetPedido{
                fnGetPedido{
                    id
                    pedido{
                        id
                        cantidad
                    }
                    creado
                    estado
                    total
                    vendedor
                    cliente
                }
            }
            */
        },
        fnGetPedidoByVendedor: async (_, { }, ctx) => {
            try {
                const pedidos = await Pedido.find({ vendedor: ctx.user.id });
                return pedidos;
            } catch (error) {
                console.log(error);
            }
            // Query
            /*
            query fnGetPedidoByVendedor{
                fnGetPedidoByVendedor{
                    id
                    pedido{
                        id
                        cantidad
                    }
                    creado
                    estado
                    total
                    vendedor
                    cliente
                }
            }
            */
        },
        fnGetPedidoById: async (_, { id }, ctx) => {
            // si el pedido existe o no
            const pedido = await Pedido.findById(id);
            if (!pedido) {
                throw new Error('El pedido no existe');
            }
            // comprobar si lo ve quien lo realizo
            if (pedido.vendedor.toString() !== ctx.user.id) {
                throw new Error('No tienes credenciales para ver el cliente');
            }
            return pedido;
            // query
            /**
            query fnGetPedidoById($id: ID!){
                fnGetPedidoById(id: $id){
                    pedido{
                    id
                    cantidad
                    }
                    id
                    creado
                    total
                    estado
                }
            }
            // QUERY
            {
                "id": "5f67424314937760c8950ba6"
            }
            // HEADERS
            {
                "authorization":"token"
            }
            */
        },
        fnGetPedidoByStatus: async (_, { estado }, ctx) => {
            const pedidos = await Pedido.find({ vendedor: ctx.user.id, estado });
            return pedidos;
        },

        // MEJORES CLIENTES
        fnGetMejoresClientes: async () => {
            const clientes = await Pedido.aggregate([
                { $match: { estado: "COMPLETADO" } },
                {
                    $group: {
                        _id: "$cliente",
                        total: { $sum: '$total' }
                    }
                },
                {
                    $lookup: {
                        from: 'clientes',
                        localField: '_id',
                        foreignField: '_id',
                        as: "cliente"
                    }
                },
                {
                    $sort: { total: -1 }
                }
            ]);
            return clientes;
        }
    },
    Mutation: {
        nuevoUsuario: async (_, { input }) => {
            console.log("resolve mutation nuevoUsuario entrada: \n ", input);
            const { email, password } = input;
            // Validamos si el usuario está registrado
            const existUser = await Usuario.findOne({ email });
            console.log("El usuario existe : \n", existUser);
            if (existUser) {
                throw new Error('El usuario existe en la BD');
            }
            // hashear su password
            const salt = await bcrypt.genSaltSync(10);
            input.password = await bcrypt.hash(password, salt);
            try {
                // creamos un usuario con el modelo
                const newUser = new Usuario(input);
                // Guardarlo en la BD
                newUser.save();
                // devolvemos el usuario creado
                return newUser;
            } catch (error) {
                console.error(error);
            }
            /* para comprobar 
            mutation nuevoUSuario($input: UsuarioInput) {
                    nuevoUsuario(input: $input){
                    id
                    nombre
                    apellido
                    email
                 }
            }
            QUERY
            {
            "input" : {
                "nombre": "victor",
                "apellido" : "aguilar",
                "email": "correo@correo.com",
                "password":"123456"
                }
            }
            */
        },
        autenticarUsuario: async (_, { input }) => {
            // console.log("resolve mutation autenticarUsuario entrada: \n ", input);
            const { email, password } = input;
            // si el usuario existe
            const existUser = await Usuario.findOne({ email });
            if (!existUser) {
                throw new Error('El usuario no existe');
            }
            // revisar el password
            const passOk = await bcrypt.compare(password, existUser.password);
            if (!passOk) {
                throw new Error('El password es incorrecto');
            }
            // generar token
            return {
                token: getToken(existUser, process.env.SECRETA, '24h')
            }
            /* comprobar el autenticarUsuario
            mutation autenticarUsuario($input: AutenticarInput) {
                autenticarUsuario(input: $input) {
                        token
                    }
            }
            QUERY
            {
            "input" : {
                "email": "correo@correo.com",
                "password":"123456"
                }
            }
        */
        },
        nuevoProducto: async (_, { input }) => {
            try {
                // Creamos el objeto del tipo Producto
                const nuevoProducto = new Producto(input);
                // guardamos en la BD
                const resultado = await nuevoProducto.save();
                // retornamos el producto creado
                return resultado;
            } catch (error) {
                console.log(error);
            }
            /*
            mutation nuevoProducto($input: ProductoInput) {
                nuevoProducto(input: $input){
                    id
                    nombre
                    existencia
                    precio
                    creado
                }
            }
            QUERY
            {
                "input" : {
                    "nombre": "ventilador",
                    "existencia": 2,
                    "precio": 19.99
                }
            }
            */
        },
        fnUpdateProducto: async (_, { id, input }) => {
            try {
                // revisamos si existe el producto
                let producto = await Producto.findById(id);
                console.log(producto)
                if (!producto) {
                    throw new Error('Producto no encotrado');
                }
                // guardamos el nuevo producto
                producto = await Producto.findOneAndUpdate({ _id: id }, input, { new: true });

                return producto;
            } catch (error) {
                console.log(error);
            }
            // Query
            /*
            mutation fnUpdateProducto( $id: ID!, $input: ProductoInput ){
                fnUpdateProducto(id: $id, input: $input){
                    id
                    nombre
                    existencia
                    precio
                }
            }
            // QUERY
            {
            "id" : "5f5c9800a364a6c7b61060b6",
                "input" : {
                    "nombre": "raton razer",
                    "existencia": 14,
                    "precio": 15.99
                }
            }
            */
        },
        fnDeleteProducto: async (_, { id }) => {
            try {
                // revisamos si existe el producto
                let producto = await Producto.findById(id);
                if (!producto) {
                    throw new Error('Producto no encotrado');
                }
                // Eliminamos el producto
                await Producto.findOneAndDelete({ _id: id });

                return "Producto Eliminado Correctamente";
            } catch (error) {
                console.log(error);
            }
            // QUERY
            /*
            mutation fnDeleteProducto($id: ID!){
                fnDeleteProducto(id: $id)
            }
            // QUERY
            {
                "id":"5f5a8330b5c6d7360236d87a"
            }
            */
        },
        fnAddCliente: async (_, { input }, ctx) => {
            const { email } = input;
            // Verificar si ya esta registrado
            // console.log(input)
            const cliente = await Cliente.findOne({ email });
            if (cliente) {
                throw new Error("El cliente ya existe en la BD");
            }
            // Creamos una instancia del cliente
            const newCliente = new Cliente(input);
            // Obtenemos el usuario(vendedor) del context
            const { id } = ctx.user;
            // asignar el vendedor
            newCliente.vendedor = id;
            try {
                // almacenarlo en la BD
                const resultado = await newCliente.save();
                // devolvemos el cliente almacenado
                return resultado;
            } catch (error) {
                console.log(error);
            }
            // Query
            /*
            mutation fnAddCliente($input: ClienteInput){
                fnAddCliente(input: $input){
                    nombre
                    apellido
                }
            }
            // QUERY
            {
            "input": {
                    "nombre": "victor",
                    "apellido": "Aguilar",
                    "empresa": "LaVaca",
                    "email": "corre1o@correo1.com",
                    "telefono": "626100391"
                }
            }
            // HEADERS
            {
                "authorization":"token"
            }
            */
        },
        fnUpdateCliente: async (_, { id, input }, ctx) => {
            // comprobar que el cliente existe
            const cliente = await Cliente.findById(id);

            if (!cliente) {
                throw new Error('El usuario no existe, o id incorrecto');
            }

            // comprobar que el usuario puede modificarlo
            if (cliente.vendedor.toString() !== ctx.user.id) {
                throw new Error('No tienes credenciales para este proceso');
            }

            try {
                // actualizar la BD
                const resultado = await Cliente.findOneAndUpdate({ _id: id }, input, { new: true });
                // devolvemos el cliente actualizado
                return resultado;
            } catch (error) {
                console.log(error);
            }

            // QUERY
            /*
            mutation fnUpdateCliente($id: ID!, $input: ClienteInput) {
                fnUpdateCliente(id: $id, input: $input) {
                    nombre
                    apellido
                    email
                    empresa
                }
            }
            // QUERY
            {
                "id": "5f5ca71ba0fc31673b49962d",
                "input": {
                    "nombre": "Nuevo Update",
                    "apellido": "Cliente",
                    "empresa": "LaChola",
                    "telefono": "626100391",
                    "email": "correo3@correo.com"
                }
            }
            // Headers
            {
                "authorization":"token"
            }
            */
        },
        fnDeleteCliente: async (_, { id }, ctx) => {
            // comprobar que el cliente existe
            const cliente = await Cliente.findById(id);

            if (!cliente) {
                throw new Error('El cliente no existe, o id incorrecto');
            }

            // comprobar que el usuario puede modificarlo
            if (cliente.vendedor.toString() !== ctx.user.id) {
                throw new Error('No tienes credenciales para este proceso');
            }

            try {
                await Cliente.findOneAndDelete({ _id: id });
                return "El cliente ha sido eliminado correctamente";
            } catch (error) {
                console.error(error);
            }
            // Query
            /**
             mutation fnDeleteCliente($id: ID!) {
                fnDeleteCliente(id: $id)
            }
            // QUERY
            {
               "id":"5f5ca71ba0fc31673b49962d"
            }
            // Headers
            {
                "authorization":"token"
            }
             */
        },

        // PEDIDODS
        fnNuevoPedido: async (_, { input }, ctx) => {
            const { cliente } = input
            // verificar si el cliente existe o no
            let clienteExiste = await Cliente.findById(cliente);
            if (!clienteExiste) {
                throw new Error('Ese cliente no existe');
            }
            // verificar si el cliente es vendedor
            if (clienteExiste.vendedor.toString() !== ctx.user.id) {
                throw new Error('El cliente es el vendedor, operación no aceptada');
            }
            // Revisar si esta en stock disponible
            for await (const articulo of input.pedido) {
                const { id } = articulo;
                const producto = await Producto.findById(id);
                if (articulo.cantidad > producto.existencia) {
                    throw new Error(`El articulo ${producto.nombre} excede la cantidad disponible`);
                } else {
                    // Restamos la cantidad de los productos pedidos
                    producto.existencia = producto.existencia - articulo.cantidad;
                    // Almacenamos la nueva cantidad
                    await producto.save();
                }
            }
            // crear el nuevo pedido
            const nuevoPedido = new Pedido(input);
            // asignarle el vendedor
            nuevoPedido.vendedor = ctx.user.id;
            // Almacenar en la Base de Datos
            const resultado = await nuevoPedido.save();
            return resultado;
            // Query
            /*
            mutation fnNuevoPedido($input: PedidoInput){
                fnNuevoPedido(input: $input){
                    id
                    cliente
                    vendedor
                    pedido {
                    id
                    cantidad
                    }
                    total
                    estado 
                }
            }
            // QUERY
            {
            "input": {
                "pedido": [
                {
                "id": "5f5a82dd3ceead2d8a57be97",
                "cantidad": 2
                } 
                ],
                "total": 300,
                "cliente": "5f5ca6f8a0fc31673b49962c",
                "estado": "PENDIENTE"
              }
            }
            // Headers
            {
               "authorization":"token"
            }
            */
        },
        fnUpdatePedido: async (_, { id, input }, ctx) => {
            const { cliente } = input
            // si el pedido existe
            const existePedido = await Pedido.findById(id);
            if (!existePedido) {
                throw new Error('Ese pedido no existe');
            }
            // verificar si el cliente existe o no
            let clienteExiste = await Cliente.findById(cliente);
            if (!clienteExiste) {
                throw new Error('Ese cliente no existe');
            }
            // verificar si el cliente es vendedor
            if (clienteExiste.vendedor.toString() !== ctx.user.id) {
                throw new Error('El cliente es el vendedor, operación no aceptada');
            }
            // Si no actualizamos temas con los pedidos no lo recorremos
            if (input.pedido) {
                // Revisar si esta en stock disponible
                for await (const articulo of input.pedido) {
                    const { id } = articulo;
                    const producto = await Producto.findById(id);
                    if (articulo.cantidad > producto.existencia) {
                        throw new Error(`El articulo ${producto.nombre} excede la cantidad disponible`);
                    } else {
                        // Restamos la cantidad de los productos pedidos
                        producto.existencia = producto.existencia - articulo.cantidad;
                        // Almacenamos la nueva cantidad
                        await producto.save();
                    }
                }
            }
            // guardar en BD
            const resultado = await Pedido.findOneAndUpdate({ _id: id }, input, { new: true });
            return resultado;
            // Query
            /*
            mutation fnUpdatePedido($id: ID!, $input: PedidoInput){
                fnUpdatePedido(id: $id, input: $input){
                    id
                    pedido{
                    id
                    cantidad
                    }
                    total
                    estado
                    vendedor
                    creado
                    cliente
                }
            }
            // query
            {
                "id": "5f67424314937760c8950ba6",
                "input": {
                        "estado": "PENDIENTE",
                            "cliente": "5f5ca6f8a0fc31673b49962c"
                }
            }
            // Header
            {
                "authorization":"token"
            }
            */
        },
        fnDeletePedido: async (_, { id }, ctx) => {
            // si el pedido existe
            const existePedido = await Pedido.findById(id);
            if (!existePedido) {
                throw new Error('Ese pedido no existe');
            }
            console.log(existePedido.vendedor)
            // verificar si el cliente es vendedor
            if (existePedido.vendedor.toString() !== ctx.user.id) {
                throw new Error('El cliente es el vendedor, operación no aceptada');
            }
            // Sumamos el stock
            if (existePedido.pedido) {
                // Revisar si esta en stock disponible
                for await (const articulo of existePedido.pedido) {
                    const { id } = articulo;
                    const producto = await Producto.findById(id);
                    // sumamos la cantidad de los productos pedidos
                    producto.existencia = producto.existencia + articulo.cantidad;
                    // Almacenamos la nueva cantidad
                    await producto.save();
                }
            }
            // Si pasamos la validación lo eliminamos
            await Pedido.findOneAndDelete({ _id: id });
            return "Pedido Eliminado Correctamente";
            // Query
            /*
            mutation fnDeletePedido($id: ID!){
                fnDeletePedido(id: $id)
            }
            // query
            {
                "id" : "5f67b41176d69929439d3358"
            }
            // header
            {
                "authorization":"token"
            }
            */
        },
    }
}
module.exports = resolvers;