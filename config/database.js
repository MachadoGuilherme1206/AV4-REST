// Configuração usada pelo Sequelize CLI (migrations e seeders) e pelo models/Banco.js.
// As credenciais vêm só do .env, nunca do código.
require('dotenv').config();

const configuracao = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'db_treinos',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  dialect: 'mysql',
  timezone: process.env.DB_TIMEZONE || '-03:00',
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  dialectOptions: {
    // O MySQL devolve DECIMAL como string ("72.00"); com isso volta como número
    decimalNumbers: true
  },
  // Guarda na tabela SequelizeData quais seeders já rodaram, para não inserir a massa de dados duas vezes
  seederStorage: 'sequelize'
};

module.exports = {
  development: configuracao,
  production: { ...configuracao, logging: false }
};
