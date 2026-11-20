const { Jogador, Treino } = require('../models');

module.exports = class JogadorService {

    // Model.create()
    static async cadastrarJogador(dados) {
        try {
            return await Jogador.create({
                nome: dados.nome,
                posicao: dados.posicao,
                ativo: true
            });
        } catch (error) {
            console.error('Erro ao cadastrar jogador:', error.message);
            throw error;
        }
    }

    // Model.findAll() com where opcional por posição e situação
    static async listarJogadores(filtros = {}) {
        const where = {};
        if (filtros.posicao !== undefined) {
            where.posicao = filtros.posicao;
        }
        if (filtros.ativo !== undefined) {
            where.ativo = filtros.ativo;
        }

        try {
            return await Jogador.findAll({ where, order: [['id', 'ASC']] });
        } catch (error) {
            console.error('Erro ao consultar jogadores:', error.message);
            throw error;
        }
    }

    // Model.findByPk(). Com comTreinos = true traz o histórico pelo include (hasMany)
    static async consultarJogador(idJogador, comTreinos = false) {
        const opcoes = {};
        if (comTreinos) {
            opcoes.include = [{
                model: Treino,
                as: 'treinos',
                attributes: ['id', 'codigo', 'dataTreino', 'tipo', 'duracaoMin', 'intensidade', 'carga']
            }];
            opcoes.order = [[{ model: Treino, as: 'treinos' }, 'dataTreino', 'ASC']];
        }

        try {
            return await Jogador.findByPk(idJogador, opcoes);
        } catch (error) {
            console.error('Erro ao consultar jogador:', error.message);
            throw error;
        }
    }

    // instância.update(): só altera os campos enviados
    static async atualizarJogador(jogador, dados) {
        try {
            return await jogador.update(dados, { fields: ['nome', 'posicao', 'ativo'] });
        } catch (error) {
            console.error('Erro ao atualizar jogador:', error.message);
            throw error;
        }
    }

    // Desativação lógica: ativo = false. Nenhum treino é apagado
    static async desativarJogador(jogador) {
        try {
            return await jogador.update({ ativo: false });
        } catch (error) {
            console.error('Erro ao desativar jogador:', error.message);
            throw error;
        }
    }
};
