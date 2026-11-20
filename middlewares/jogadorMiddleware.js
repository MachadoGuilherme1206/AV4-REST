const Jogador = require('../models/Jogador');
const { naoEnviado, ehInteiroPositivo, converterBooleano } = require('../utils/validacao');

const CAMPOS_OBRIGATORIOS = [
    { nome: 'nome', rotulo: 'O nome do jogador é obrigatório' },
    { nome: 'posicao', rotulo: 'A posição é obrigatória (G, Z, M ou A)' }
];

module.exports = class JogadorMiddleware {

    validar_idParametro = (request, response, next) => {
        if (!ehInteiroPositivo(request.params.id)) {
            return response.status(400).send({
                status: false,
                error: 'O código do jogador deve ser um número inteiro positivo'
            });
        }

        next();
    }

    validar_camposObrigatorios = (request, response, next) => {
        for (let i = 0; i < CAMPOS_OBRIGATORIOS.length; i++) {
            const campo = CAMPOS_OBRIGATORIOS[i];

            if (naoEnviado(request.body[campo.nome])) {
                return response.status(400).send({
                    status: false,
                    error: campo.rotulo
                });
            }
        }

        next();
    }

    // O PUT aceita envio parcial, mas precisa de pelo menos um campo
    validar_camposAtualizacao = (request, response, next) => {
        const { nome, posicao, ativo } = request.body;

        if (naoEnviado(nome) && naoEnviado(posicao) && naoEnviado(ativo)) {
            return response.status(400).send({
                status: false,
                error: 'Informe nome, posicao e/ou ativo para atualizar'
            });
        }

        next();
    }

    validar_nome = (request, response, next) => {
        const nome = request.body.nome;

        if (naoEnviado(nome)) {
            return next();
        }

        if (typeof nome !== 'string' || nome.trim() === '') {
            return response.status(400).send({
                status: false,
                error: 'O nome do jogador é obrigatório'
            });
        }

        if (nome.trim().length < 2 || nome.trim().length > 100) {
            return response.status(400).send({
                status: false,
                error: 'O nome do jogador deve ter entre 2 e 100 caracteres'
            });
        }

        request.body.nome = nome.trim();
        next();
    }

    // Aceita "g", "G" ou " G " e já deixa em maiúsculas para o resto do fluxo
    validar_posicao = (request, response, next) => {
        if (naoEnviado(request.body.posicao)) {
            return next();
        }

        const posicao = String(request.body.posicao).trim().toUpperCase();

        if (!Jogador.POSICOES.includes(posicao)) {
            return response.status(400).send({
                status: false,
                error: 'Posição inválida. Use G (Goleiro), Z (Zagueiro), M (Meio-campo) ou A (Atacante)'
            });
        }

        request.body.posicao = posicao;
        next();
    }

    validar_ativo = (request, response, next) => {
        if (naoEnviado(request.body.ativo)) {
            return next();
        }

        if (typeof request.body.ativo !== 'boolean') {
            return response.status(400).send({
                status: false,
                error: 'O campo ativo deve ser true ou false'
            });
        }

        next();
    }

    // GET /jogadores?posicao=M&ativo=true
    validar_filtros = (request, response, next) => {
        const { posicao, ativo } = request.query;
        const filtros = {};

        if (!naoEnviado(posicao)) {
            const posicaoNormalizada = String(posicao).trim().toUpperCase();
            if (!Jogador.POSICOES.includes(posicaoNormalizada)) {
                return response.status(400).send({
                    status: false,
                    error: 'Filtro posicao inválido. Use G, Z, M ou A'
                });
            }
            filtros.posicao = posicaoNormalizada;
        }

        if (!naoEnviado(ativo)) {
            const ativoConvertido = converterBooleano(ativo);
            if (ativoConvertido === null) {
                return response.status(400).send({
                    status: false,
                    error: 'O filtro ativo deve ser true ou false'
                });
            }
            filtros.ativo = ativoConvertido;
        }

        // No Express 5 o request.query é somente leitura,
        // então os filtros validados seguem para o controller em request.filtros
        request.filtros = filtros;
        next();
    }
};
