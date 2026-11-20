const { Op, UniqueConstraintError } = require('sequelize');
const { Treino, Jogador } = require('../models');
const ErroNegocio = require('../utils/ErroNegocio');
const { calcularCarga } = require('../utils/carga');
const { paraDate, inicioDoDia, fimDoDia } = require('../utils/data');

// include usado nas consultas de treino: o JOIN traz o nome e a posição do jogador,
// para a resposta não mostrar só o jogadorId
const INCLUDE_JOGADOR = {
    model: Jogador,
    as: 'jogador',
    attributes: ['id', 'nome', 'posicao', 'ativo']
};

module.exports = class TreinoService {

    // Validar, calcular e criar treino
    static async registrarTreino(dados) {
        try {
            const treinoExistente = await Treino.findOne({ where: { codigo: dados.codigo } });
            if (treinoExistente) {
                throw new ErroNegocio(`Já existe um treino cadastrado com o código ${dados.codigo}`, 409);
            }

            const jogador = await Jogador.findByPk(dados.jogadorId);
            if (!jogador) {
                throw new ErroNegocio(`Jogador ${dados.jogadorId} não encontrado`, 404);
            }
            if (!jogador.ativo) {
                throw new ErroNegocio(`O jogador ${jogador.nome} está inativo e não pode registrar treinos`, 400);
            }

            // Valida intensidade (1 a 10) e duração (> 0) e aplica a regra de negócio
            const calculo = calcularCarga(dados.duracaoMin, dados.intensidade, dados.tipo);

            const treino = await Treino.create({
                codigo: dados.codigo,
                jogadorId: dados.jogadorId,
                // "2026-10-05T08:00:00" interpretado no fuso do .env (DB_TIMEZONE)
                dataTreino: paraDate(dados.dataTreino),
                tipo: dados.tipo,
                duracaoMin: calculo.duracaoMin,
                intensidade: calculo.intensidade,
                carga: calculo.carga
            });

            return { treino, calculo };
        } catch (error) {
            // Duas requisições com o mesmo código ao mesmo tempo podem passar pela
            // checagem acima; o índice UNIQUE barra a segunda, e aqui vira 409
            if (error instanceof UniqueConstraintError) {
                throw new ErroNegocio(`Já existe um treino cadastrado com o código ${dados.codigo}`, 409);
            }
            if (!(error instanceof ErroNegocio)) {
                console.error('Erro ao registrar treino:', error.message);
            }
            throw error;
        }
    }

    // findAll() com include e where: filtros por jogador, tipo, posição e período
    static async listarTreinos(filtros = {}) {
        const where = {};
        const whereJogador = {};

        if (filtros.jogadorId !== undefined) {
            where.jogadorId = filtros.jogadorId;
        }
        if (filtros.tipo !== undefined) {
            where.tipo = filtros.tipo;
        }
        if (filtros.posicao !== undefined) {
            whereJogador.posicao = filtros.posicao;
        }

        // O período inclui o dia final inteiro (até 23:59:59)
        if (filtros.inicio && filtros.fim) {
            where.dataTreino = { [Op.between]: [inicioDoDia(filtros.inicio), fimDoDia(filtros.fim)] };
        } else if (filtros.inicio) {
            where.dataTreino = { [Op.gte]: inicioDoDia(filtros.inicio) };
        } else if (filtros.fim) {
            where.dataTreino = { [Op.lte]: fimDoDia(filtros.fim) };
        }

        // Com where dentro do include o JOIN vira INNER: só ficam treinos de jogadores daquela posição
        const include = Object.keys(whereJogador).length > 0
            ? { ...INCLUDE_JOGADOR, where: whereJogador }
            : INCLUDE_JOGADOR;

        try {
            return await Treino.findAll({
                where,
                include: [include],
                order: [['dataTreino', 'ASC'], ['codigo', 'ASC']]
            });
        } catch (error) {
            console.error('Erro ao consultar treinos:', error.message);
            throw error;
        }
    }

    static async consultarTreino(codigo) {
        try {
            return await Treino.findOne({
                where: { codigo },
                include: [INCLUDE_JOGADOR]
            });
        } catch (error) {
            console.error('Erro ao consultar treino:', error.message);
            throw error;
        }
    }

    // destroy() com verificação: procura o treino pelo código e só exclui se ele existir.
    // Devolve o treino excluído ou null (o controller transforma o null em 404)
    static async excluirTreino(codigo) {
        try {
            const treino = await TreinoService.consultarTreino(codigo);
            if (!treino) {
                return null;
            }

            await treino.destroy();
            return treino;
        } catch (error) {
            console.error('Erro ao excluir treino:', error.message);
            throw error;
        }
    }
};
