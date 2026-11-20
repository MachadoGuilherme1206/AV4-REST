const { naoEnviado, converterNumero } = require('../utils/validacao');
const { normalizarData } = require('../utils/data');

module.exports = class ConfiguracaoMiddleware {

    validar_cargaMaximaSemanal = (request, response, next) => {
        if (naoEnviado(request.body.cargaMaximaSemanal)) {
            return response.status(400).send({
                status: false,
                error: 'A carga máxima semanal (cargaMaximaSemanal) é obrigatória'
            });
        }

        const carga = converterNumero(request.body.cargaMaximaSemanal);

        if (isNaN(carga)) {
            return response.status(400).send({
                status: false,
                error: 'A carga máxima semanal deve ser um número'
            });
        }

        if (carga <= 0) {
            return response.status(400).send({
                status: false,
                error: 'A carga máxima semanal deve ser maior que zero'
            });
        }

        request.body.cargaMaximaSemanal = carga;
        next();
    }

    // dataVigencia é opcional
    validar_dataVigencia = (request, response, next) => {
        if (naoEnviado(request.body.dataVigencia)) {
            return next();
        }

        const dataVigencia = normalizarData(request.body.dataVigencia);

        if (!dataVigencia) {
            return response.status(400).send({
                status: false,
                error: 'Data de vigência inválida. Use o formato AAAA-MM-DD'
            });
        }

        request.body.dataVigencia = dataVigencia;
        next();
    }
};
