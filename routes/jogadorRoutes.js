const express = require('express');
const JogadorController = require('../controllers/jogadorController');
const JogadorMiddleware = require('../middlewares/jogadorMiddleware');

module.exports = class JogadorRoutes {
    constructor() {
        this._router = express.Router();
        this._jogadorController = new JogadorController();
        this._jogadorMiddleware = new JogadorMiddleware();

        this.configurarRotas();
    }

    configurarRotas = () => {
        this._router.post(
            '/',
            this._jogadorMiddleware.validar_camposObrigatorios,
            this._jogadorMiddleware.validar_nome,
            this._jogadorMiddleware.validar_posicao,
            this._jogadorController.Jogador_cadastrar_controller
        );

        this._router.get(
            '/',
            this._jogadorMiddleware.validar_filtros,
            this._jogadorController.Jogador_listar_controller
        );

        this._router.get(
            '/:id',
            this._jogadorMiddleware.validar_idParametro,
            this._jogadorController.Jogador_consultar_controller
        );

        this._router.put(
            '/:id',
            this._jogadorMiddleware.validar_idParametro,
            this._jogadorMiddleware.validar_camposAtualizacao,
            this._jogadorMiddleware.validar_nome,
            this._jogadorMiddleware.validar_posicao,
            this._jogadorMiddleware.validar_ativo,
            this._jogadorController.Jogador_atualizar_controller
        );

        this._router.patch(
            '/:id/desativar',
            this._jogadorMiddleware.validar_idParametro,
            this._jogadorController.Jogador_desativar_controller
        );
    };

    get router() {
        return this._router;
    }
};
