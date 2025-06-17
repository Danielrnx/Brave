// db.js

const { Client } = require('pg');

const client = new Client({
  user: 'postgres',               // Nome do usuário no PostgreSQL
  host: 'localhost',              // Endereço do servidor (use localhost se estiver local)
  database: 'Braves_db',          // Nome do banco de dados
  password: '1234567',     // Senha do usuário
  port: 5432,                     // Porta padrão do PostgreSQL
});

client.connect()
  .then(() => console.log('Conectado ao banco de dados'))
  .catch(err => console.error('Erro ao conectar ao banco de dados', err.stack));

module.exports = client;
