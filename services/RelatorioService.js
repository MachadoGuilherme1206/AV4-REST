const { Op, fn, col } = require('sequelize');
const { Treino, Jogador } = require('../models');
const ConfiguracaoService = require('./ConfiguracaoService');
const { arredondar, DESCRICAO_TIPO } = require('../utils/carga');
const { calcularSemana } = require('../utils/data');

const DESCRICAO_POSICAO = {
    G: 'Goleiro',
    Z: 'Zagueiro',
    M: 'Meio-campo',
    A: 'Atacante'
};

const RISCO = 'RISCO DE SOBRECARGA';
const DENTRO_LIMITE = 'DENTRO DO LIMITE';
const SEM_LIMITE = 'LIMITE NÃO CONFIGURADO';

// Critérios do relatório, devolvidos junto com os números (exigência do enunciado)
const CRITERIOS = {
    semana: 'A semana vai de segunda-feira 00:00:00 a domingo 23:59:59 e é a que contém a data informada.',
    rankings: 'Maior e menor carga consideram apenas jogadores com pelo menos um treino na semana. ' +
        'Jogadores inativos com treinos na semana também entram, porque o histórico é preservado.',
    risco: 'RISCO DE SOBRECARGA só quando a carga semanal é estritamente maior que o limite configurado. ' +
        'Carga igual ao limite não sinaliza risco.',
    empates: 'Em empate na maior ou na menor carga, todos os jogadores empatados são listados e empate = true.',
    semanaSemTreinos: 'Semana sem treinos responde 200 com total 0, listas vazias, rankings null e médias 0.',
    aviso: 'Indicador exclusivamente didático: não é diagnóstico nem predição clínica de lesão.'
};


// Model.count() e Model.sum(): total de treinos e carga somada da semana
async function consultarTotais(where) {
    const [totalTreinos, cargaTotal] = await Promise.all([
        Treino.count({ where }),
        Treino.sum('carga', { where })
    ]);
    return {
        totalTreinos,
        // Sem treinos o SUM do MySQL é NULL
        cargaTotal: arredondar(cargaTotal || 0)
    };
}

// SUM e COUNT por jogador: include (JOIN com jogadores) + group
async function consultarPorJogador(where) {
    return Treino.findAll({
        attributes: [
            'jogadorId',
            [fn('SUM', col('Treino.carga')), 'cargaSemanal'],
            [fn('COUNT', col('Treino.id')), 'quantidadeTreinos']
        ],
        include: [{ model: Jogador, as: 'jogador', attributes: ['nome', 'posicao', 'ativo'] }],
        where,
        group: ['Treino.jogadorId', 'jogador.id'],
        order: [[fn('SUM', col('Treino.carga')), 'DESC'], ['jogadorId', 'ASC']],
        raw: true,
        nest: true
    });
}

// AVG e COUNT por tipo de treino + group
async function consultarPorTipo(where) {
    return Treino.findAll({
        attributes: [
            'tipo',
            [fn('COUNT', col('Treino.id')), 'quantidadeSessoes'],
            [fn('AVG', col('Treino.carga')), 'cargaMedia']
        ],
        where,
        group: ['tipo'],
        raw: true
    });
}

// COUNT e AVG por posição: agrupa por uma coluna da tabela associada (include sem atributos)
async function consultarPorPosicao(where) {
    return Treino.findAll({
        attributes: [
            [col('jogador.posicao'), 'posicao'],
            [fn('COUNT', col('Treino.id')), 'quantidadeTreinos'],
            [fn('AVG', col('Treino.carga')), 'cargaMediaPorSessao']
        ],
        include: [{ model: Jogador, as: 'jogador', attributes: [] }],
        where,
        group: ['jogador.posicao'],
        raw: true
    });
}

function situacaoCarga(cargaSemanal, limite) {
    if (limite === null) {
        return SEM_LIMITE;
    }
    // Estritamente maior: no empate com o limite não há risco
    return cargaSemanal > limite ? RISCO : DENTRO_LIMITE;
}

// Maior ou menor carga semanal, listando todos os empatados no valor extremo
function montarRanking(jogadores, tipo) {
    if (jogadores.length === 0) {
        return null;
    }

    const cargas = jogadores.map((j) => j.cargaSemanal);
    const alvo = tipo === 'maior' ? Math.max(...cargas) : Math.min(...cargas);

    const empatados = jogadores
        .filter((j) => j.cargaSemanal === alvo)
        .map((j) => {
            const item = { nome: j.nome, posicao: j.posicao, cargaSemanal: j.cargaSemanal };
            // A maior carga também informa a quantidade de treinos (enunciado)
            if (tipo === 'maior') {
                item.quantidadeTreinos = j.quantidadeTreinos;
            }
            return item;
        });

    return {
        cargaSemanal: alvo,
        empate: empatados.length > 1,
        jogadores: empatados
    };
}

module.exports = class RelatorioService {

    static async gerarRelatorioSemanal(dataReferencia) {
        const semana = calcularSemana(dataReferencia);

        // Op.between: segunda 00:00:00 até domingo 23:59:59.999
        const where = {
            dataTreino: { [Op.between]: [semana.inicioDate, semana.fimDate] }
        };

        try {
            // As consultas são independentes entre si: rodam em paralelo no pool do Sequelize
            const [configuracao, totais, porJogador, porTipo, porPosicao] = await Promise.all([
                ConfiguracaoService.consultarConfiguracao(),
                consultarTotais(where),
                consultarPorJogador(where),
                consultarPorTipo(where),
                consultarPorPosicao(where)
            ]);

            const limite = configuracao ? Number(configuracao.cargaMaximaSemanal) : null;

            const jogadores = porJogador.map((linha) => {
                const cargaSemanal = arredondar(linha.cargaSemanal);
                return {
                    jogadorId: linha.jogadorId,
                    nome: linha.jogador.nome,
                    posicao: linha.jogador.posicao,
                    ativo: Boolean(linha.jogador.ativo),
                    quantidadeTreinos: Number(linha.quantidadeTreinos),
                    cargaSemanal,
                    situacao: situacaoCarga(cargaSemanal, limite)
                };
            });

            const emRisco = jogadores.filter((j) => j.situacao === RISCO);

            // F, T e E aparecem sempre, mesmo que algum tipo não tenha treinos na semana
            const mediaPorTipo = Treino.TIPOS.map((tipo) => {
                const linha = porTipo.find((l) => l.tipo === tipo);
                return {
                    tipo,
                    descricao: DESCRICAO_TIPO[tipo],
                    quantidadeSessoes: linha ? Number(linha.quantidadeSessoes) : 0,
                    cargaMedia: linha ? arredondar(linha.cargaMedia) : 0
                };
            });

            // G, Z, M e A aparecem sempre, pelo mesmo motivo
            const porPosicaoCompleto = Jogador.POSICOES.map((posicao) => {
                const linha = porPosicao.find((l) => l.posicao === posicao);
                return {
                    posicao,
                    descricao: DESCRICAO_POSICAO[posicao],
                    quantidadeTreinos: linha ? Number(linha.quantidadeTreinos) : 0,
                    cargaMediaPorSessao: linha ? arredondar(linha.cargaMediaPorSessao) : 0
                };
            });

            const observacoes = [];
            if (totais.totalTreinos === 0) {
                observacoes.push('Nenhum treino registrado nesta semana');
            }
            if (limite === null) {
                observacoes.push('Nenhum limite semanal configurado (PUT /configuracao): o risco não foi avaliado');
            }

            return {
                semana: {
                    dataReferencia,
                    inicio: semana.inicio,
                    fim: semana.fim
                },
                cargaMaximaSemanal: limite,
                totalTreinos: totais.totalTreinos,
                cargaTotalSemana: totais.cargaTotal,
                porJogador: jogadores,
                maiorCargaSemanal: montarRanking(jogadores, 'maior'),
                menorCargaSemanal: montarRanking(jogadores, 'menor'),
                jogadoresEmRisco: {
                    quantidade: limite === null ? null : emRisco.length,
                    jogadores: emRisco.map((j) => ({
                        nome: j.nome,
                        posicao: j.posicao,
                        cargaSemanal: j.cargaSemanal,
                        excessoSobreLimite: arredondar(j.cargaSemanal - limite)
                    }))
                },
                mediaPorTipo,
                porPosicao: porPosicaoCompleto,
                criterios: CRITERIOS,
                observacoes
            };
        } catch (error) {
            console.error('Erro ao gerar relatório semanal:', error.message);
            throw error;
        }
    }
};
