const { Sequelize } = require('sequelize');

const ambiente = process.env.NODE_ENV || 'development';
const configuracao = require('../config/database')[ambiente];

module.exports = class Banco {

    static HOST = configuracao.host;
    static PORT = configuracao.port;
    static DATABASE = configuracao.database;
    static SEQUELIZE = null;

    // Uma única instância do Sequelize (que já mantém um pool de conexões) para toda a API
    static getConexao() {
        if (Banco.SEQUELIZE == null) {
            Banco.SEQUELIZE = new Sequelize(
                configuracao.database,
                configuracao.username,
                configuracao.password,
                configuracao
            );
        }
        return Banco.SEQUELIZE;
    }

    static async testarConexao() {
        try {
            await Banco.getConexao().authenticate();
            console.log(`Conectado ao MySQL (${Banco.HOST}:${Banco.PORT}/${Banco.DATABASE})`);
            return true;
        } catch (error) {
            // Só o código do erro: usuário e senha nunca aparecem no log
            const objResposta = {
                msg: 'Erro ao conectar ao banco de dados',
                erro: (error.parent && error.parent.code) || error.name
            };
            console.error(objResposta);
            return false;
        }
    }
};
