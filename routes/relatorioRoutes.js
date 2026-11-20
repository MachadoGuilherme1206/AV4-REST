const express = require('express');
const RelatorioController = require('../controllers/relatorioController');
const RelatorioMiddleware = require('../middlewares/relatorioMiddleware');

module.exports = class RelatorioRoutes {
    constructor() {
        this._router = express.Router();
        this._relatorioController = new RelatorioController();
        this._relatorioMiddleware = new RelatorioMiddleware();

        this.configurarRotas();
    }

    configurarRotas = () => {
        this._router.get(
            '/semanal',
            this._relatorioMiddleware.validar_data,
            this._relatorioController.Relatorio_semanal_controller
        );
    };

    get router() {
        return this._router;
    }
};
