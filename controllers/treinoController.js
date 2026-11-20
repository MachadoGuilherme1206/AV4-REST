const TreinoService = require('../services/TreinoService');
const JogadorService = require('../services/JogadorService');
const responderErro = require('../utils/responderErro');
const { arredondar } = require('../utils/carga');

function somarCargas(treinos) {
    let total = 0;
    for (let i = 0; i < treinos.length; i++) {
        total += Number(treinos[i].carga);
    }
    return arredondar(total);
}

module.exports = class TreinoController {
    Treino_registrar_controller = async (req, res) => {
        try {
            // registrarTreino valida código/jogador/intensidade/duração, calcula a carga e grava
            const { treino, calculo } = await TreinoService.registrarTreino({
                codigo: req.body.codigo,
                jogadorId: Number(req.body.jogadorId),
                dataTreino: req.body.dataTreino,
                tipo: req.body.tipo,
                duracaoMin: req.body.duracaoMin,
                intensidade: req.body.intensidade
            });

            // Relê do banco para devolver o treino completo (com o jogador do include)
            const treinoRegistrado = await TreinoService.consultarTreino(treino.codigo);

            return res.status(201).send({
                status: true,
                message: 'Treino registrado com sucesso',
                treino: treinoRegistrado,
                calculoCarga: {
                    duracaoMin: calculo.duracaoMin,
                    intensidade: calculo.intensidade,
                    multiplicador: calculo.multiplicador,
                    formula: calculo.memoriaCalculo,
                    carga: calculo.carga
                }
            });
        } catch (error) {
            return responderErro(res, error, 'Erro ao registrar treino');
        }
    }

    Treino_listar_controller = async (req, res) => {
        try {
            const treinos = await TreinoService.listarTreinos(req.filtros);

            return res.status(200).send({
                status: true,
                message: 'Treinos encontrados com sucesso',
                filtros: req.filtros,
                quantidade: treinos.length,
                cargaTotal: somarCargas(treinos),
                treinos
            });
        } catch (error) {
            return responderErro(res, error, 'Erro ao consultar treinos');
        }
    }

    Treino_porJogador_controller = async (req, res) => {
        try {
            const jogadorId = Number(req.params.id);

            // Jogador inexistente é 404; jogador sem treinos é 200 com lista vazia
            const jogador = await JogadorService.consultarJogador(jogadorId);
            if (!jogador) {
                return res.status(404).send({
                    status: false,
                    message: 'Jogador não encontrado'
                });
            }

            const treinos = await TreinoService.listarTreinos({ jogadorId });

            return res.status(200).send({
                status: true,
                message: `Treinos de ${jogador.nome} encontrados com sucesso`,
                jogador,
                quantidade: treinos.length,
                cargaTotal: somarCargas(treinos),
                treinos
            });
        } catch (error) {
            return responderErro(res, error, 'Erro ao consultar treinos do jogador');
        }
    }

    Treino_excluir_controller = async (req, res) => {
        try {
            const codigo = String(req.params.codigo).trim().toUpperCase();
            const treino = await TreinoService.excluirTreino(codigo);

            // Remover algo que não existe é 404, não erro de servidor
            if (!treino) {
                return res.status(404).send({
                    status: false,
                    message: `Treino com código ${codigo} não encontrado`
                });
            }

            return res.status(200).send({
                status: true,
                message: 'Treino excluído com sucesso',
                treino
            });
        } catch (error) {
            return responderErro(res, error, 'Erro ao excluir treino');
        }
    }
};
