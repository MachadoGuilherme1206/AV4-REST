const { normalizarData } = require('../utils/data');

module.exports = class RelatorioMiddleware {

    // GET /relatorios/semanal?data=2026-10-05
    validar_data = (request, response, next) => {
        const { data } = request.query;

        if (!data) {
            return response.status(400).send({
                status: false,
                error: 'Informe a data de referência com ?data=AAAA-MM-DD'
            });
        }

        const dataReferencia = normalizarData(data);

        if (!dataReferencia) {
            return response.status(400).send({
                status: false,
                error: 'Data inválida. Use o formato AAAA-MM-DD'
            });
        }

        // No Express 5 o request.query é somente leitura (é recalculado a cada acesso),
        // então a data validada segue para o controller em request.dataReferencia
        request.dataReferencia = dataReferencia;
        next();
    }
};
