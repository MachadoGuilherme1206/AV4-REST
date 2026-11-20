const RelatorioService = require('../services/RelatorioService');
const responderErro = require('../utils/responderErro');

module.exports = class RelatorioController {
    Relatorio_semanal_controller = async (req, res) => {
        try {
            // Data já validada e normalizada pelo RelatorioMiddleware
            const relatorio = await RelatorioService.gerarRelatorioSemanal(req.dataReferencia);

            return res.status(200).send({
                status: true,
                message: 'Relatório gerado com sucesso',
                relatorio
            });
        } catch (error) {
            return responderErro(res, error, 'Erro ao gerar relatório semanal');
        }
    }
};
