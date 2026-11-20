const express = require('express');
const ConfiguracaoController = require('../controllers/configuracaoController');
const ConfiguracaoMiddleware = require('../middlewares/configuracaoMiddleware');

module.exports = class ConfiguracaoRoutes {
    constructor() {
        this._router = express.Router();
        this._configuracaoController = new ConfiguracaoController();
        this._configuracaoMiddleware = new ConfiguracaoMiddleware();

        this.configurarRotas();
    }

    configurarRotas = () => {
        this._router.get('/', this._configuracaoController.Configuracao_consultar_controller);

        this._router.put(
            '/',
            this._configuracaoMiddleware.validar_cargaMaximaSemanal,
            this._configuracaoMiddleware.validar_dataVigencia,
            this._configuracaoController.Configuracao_salvar_controller
        );
    };

    get router() {
        return this._router;
    }
};
