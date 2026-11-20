const JogadorService = require('../services/JogadorService');
const responderErro = require('../utils/responderErro');

module.exports = class JogadorController {
    Jogador_cadastrar_controller = async (req, res) => {
        try {
            // Nome e posição já validados e normalizados pelo JogadorMiddleware
            const jogador = await JogadorService.cadastrarJogador({
                nome: req.body.nome,
                posicao: req.body.posicao
            });

            return res.status(201).send({
                status: true,
                message: 'Jogador cadastrado com sucesso',
                jogador
            });
        } catch (error) {
            return responderErro(res, error, 'Erro ao cadastrar jogador');
        }
    }

    Jogador_listar_controller = async (req, res) => {
        try {
            const jogadores = await JogadorService.listarJogadores(req.filtros);

            return res.status(200).send({
                status: true,
                message: 'Jogadores encontrados com sucesso',
                quantidade: jogadores.length,
                jogadores
            });
        } catch (error) {
            return responderErro(res, error, 'Erro ao consultar jogadores');
        }
    }

    Jogador_consultar_controller = async (req, res) => {
        try {
            // Traz junto o histórico de treinos (include), inclusive de jogador inativo
            const jogador = await JogadorService.consultarJogador(Number(req.params.id), true);

            if (jogador) {
                return res.status(200).send({
                    status: true,
                    message: 'Jogador encontrado com sucesso',
                    jogador
                });
            }
            return res.status(404).send({
                status: false,
                message: 'Jogador não encontrado'
            });
        } catch (error) {
            return responderErro(res, error, 'Erro ao consultar jogador');
        }
    }

    Jogador_atualizar_controller = async (req, res) => {
        try {
            const jogador = await JogadorService.consultarJogador(Number(req.params.id));

            // Sem o jogador no banco não existe o que atualizar: 404, e não erro de servidor
            if (!jogador) {
                return res.status(404).send({
                    status: false,
                    message: 'Jogador não encontrado'
                });
            }

            // Atualização parcial: só vão para o update os campos enviados no corpo
            const dados = {};
            if (req.body.nome !== undefined) {
                dados.nome = req.body.nome;
            }
            if (req.body.posicao !== undefined) {
                dados.posicao = req.body.posicao;
            }
            if (req.body.ativo !== undefined) {
                dados.ativo = req.body.ativo;
            }

            await JogadorService.atualizarJogador(jogador, dados);

            return res.status(200).send({
                status: true,
                message: 'Jogador atualizado com sucesso',
                jogador
            });
        } catch (error) {
            return responderErro(res, error, 'Erro ao atualizar jogador');
        }
    }

    Jogador_desativar_controller = async (req, res) => {
        try {
            const jogador = await JogadorService.consultarJogador(Number(req.params.id));

            if (!jogador) {
                return res.status(404).send({
                    status: false,
                    message: 'Jogador não encontrado'
                });
            }

            if (!jogador.ativo) {
                return res.status(400).send({
                    status: false,
                    message: 'O jogador já está inativo'
                });
            }

            await JogadorService.desativarJogador(jogador);

            return res.status(200).send({
                status: true,
                message: 'Jogador desativado com sucesso. O histórico de treinos foi mantido',
                jogador
            });
        } catch (error) {
            return responderErro(res, error, 'Erro ao desativar jogador');
        }
    }
};
