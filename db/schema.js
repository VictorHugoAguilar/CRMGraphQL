const { gql } = require('apollo-server');

// Schema
const typeDefs = gql`
   type Query {
        fnObtenerCurso : String
   }
`

module.exports = typeDefs;