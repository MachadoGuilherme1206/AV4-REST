const express = require('express');
const TreinoController = require('../controllers/treinoController');
const TreinoMiddleware = require('../middlewares/treinoMiddleware');

module.exports = class TreinoRoutes {
    constructor() {
        this._router = express.Router();
        this._treinoController = new TreinoController();
        this._treinoMiddleware = new TreinoMiddleware();

        this.configurarRotas();
    }

    configurarRotas = () => {
        this._router.post(
            '/',
            this._treinoMiddleware.validar_camposObrigatorios,
            this._treinoMiddleware.validar_codigo,
            this._treinoMiddleware.validar_jogadorId,
            this._treinoMiddleware.validar_dataTreino,
            this._treinoMiddleware.validar_tipo,
            this._treinoMiddleware.validar_numeros,
            this._treinoController.Treino_registrar_controller
        );

        this._router.get(
            '/',
            this._treinoMiddleware.validar_filtros,
            this._treinoController.Treino_listar_controller
        );

        this._router.get(
            '/jogador/:id',
            this._treinoMiddleware.validar_idParametro,
            this._treinoController.Treino_porJogador_controller
        );

        this._router.delete(
            '/:codigo',
            this._treinoMiddleware.validar_codigoParametro,
            this._treinoController.Treino_excluir_controller
        );
    };

    get router() {
        return this._router;
    }
};
