const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');
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
        }

    }
}
module.exports = resolvers;