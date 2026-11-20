// Inicializa os models na conexão do Banco e registra as associações
// Jogador.hasMany(Treino) e Treino.belongsTo(Jogador)
const Banco = require('./Banco');
const Jogador = require('./Jogador');
const Treino = require('./Treino');
const Configuracao = require('./Configuracao');

const sequelize = Banco.getConexao();

Jogador.iniciar(sequelize);
Treino.iniciar(sequelize);
Configuracao.iniciar(sequelize);

const models = { Jogador, Treino, Configuracao };
Jogador.associar(models);
Treino.associar(models);

module.exports = { Banco, sequelize, Jogador, Treino, Configuracao };
