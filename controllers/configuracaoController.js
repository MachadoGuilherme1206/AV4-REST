const ConfiguracaoService = require('../services/ConfiguracaoService');
const responderErro = require('../utils/responderErro');

module.exports = class ConfiguracaoController {
    Configuracao_consultar_controller = async (req, res) => {
        try {
            const configuracao = await ConfiguracaoService.consultarConfiguracao();

            if (configuracao) {
                return res.status(200).send({
                    status: true,
                    message: 'Configuração encontrada com sucesso',
                    configuracao
                });
            }
            return res.status(404).send({
                status: false,
                message: 'Nenhum limite de carga semanal foi configurado ainda. Use PUT /configuracao'
            });
        } catch (error) {
            return responderErro(res, error, 'Erro ao consultar configuração');
        }
    }

    Configuracao_salvar_controller = async (req, res) => {
        try {
            const { configuracao, criada } = await ConfiguracaoService.salvarConfiguracao({
                cargaMaximaSemanal: req.body.cargaMaximaSemanal,
                dataVigencia: req.body.dataVigencia
            });

            // 201 quando o limite é cadastrado pela primeira vez, 200 quando é atualizado
            return res.status(criada ? 201 : 200).send({
                status: true,
                message: criada ? 'Limite semanal cadastrado com sucesso' : 'Limite semanal atualizado com sucesso',
                configuracao
            });
        } catch (error) {
            return responderErro(res, error, 'Erro ao salvar configuração');
        }
    }
};
