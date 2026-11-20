const Treino = require('../models/Treino');
const Jogador = require('../models/Jogador');
const { naoEnviado, converterNumero, ehInteiroPositivo } = require('../utils/validacao');
const { normalizarDataHora, normalizarData } = require('../utils/data');

const CAMPOS_OBRIGATORIOS = [
    { nome: 'codigo', rotulo: 'O código do treino é obrigatório' },
    { nome: 'jogadorId', rotulo: 'O jogador (jogadorId) é obrigatório' },
    { nome: 'dataTreino', rotulo: 'A data do treino (dataTreino) é obrigatória' },
    { nome: 'tipo', rotulo: 'O tipo do treino é obrigatório (F, T ou E)' },
    { nome: 'duracaoMin', rotulo: 'A duração em minutos (duracaoMin) é obrigatória' },
    { nome: 'intensidade', rotulo: 'A intensidade é obrigatória' }
];

function validarTipo(valor) {
    const tipo = String(valor).trim().toUpperCase();
    return Treino.TIPOS.includes(tipo) ? tipo : null;
}

module.exports = class TreinoMiddleware {

    // Usado em /treinos/jogador/:id
    validar_idParametro = (request, response, next) => {
        if (!ehInteiroPositivo(request.params.id)) {
            return response.status(400).send({
                status: false,
                error: 'O código do jogador informado na URL deve ser um número inteiro positivo'
            });
        }

        next();
    }

    // Usado em DELETE /treinos/:codigo
    validar_codigoParametro = (request, response, next) => {
        const codigo = String(request.params.codigo).trim();

        if (codigo === '' || codigo.length > 30) {
            return response.status(400).send({
                status: false,
                error: 'O código do treino deve ter entre 1 e 30 caracteres'
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

    validar_codigo = (request, response, next) => {
        const codigo = request.body.codigo;

        if (typeof codigo !== 'string' || codigo.trim() === '') {
            return response.status(400).send({
                status: false,
                error: 'O código do treino deve ser um texto (ex.: "TR100")'
            });
        }

        if (codigo.trim().length > 30) {
            return response.status(400).send({
                status: false,
                error: 'O código do treino deve ter no máximo 30 caracteres'
            });
        }

        request.body.codigo = codigo.trim().toUpperCase();
        next();
    }

    validar_jogadorId = (request, response, next) => {
        if (!ehInteiroPositivo(request.body.jogadorId)) {
            return response.status(400).send({
                status: false,
                error: 'O jogadorId deve ser um número inteiro positivo'
            });
        }

        next();
    }

    validar_dataTreino = (request, response, next) => {
        const dataTreino = normalizarDataHora(request.body.dataTreino);

        if (!dataTreino) {
            return response.status(400).send({
                status: false,
                error: 'Data do treino inválida. Use AAAA-MM-DD ou AAAA-MM-DD HH:MM:SS'
            });
        }

        request.body.dataTreino = dataTreino;
        next();
    }

    // Aceita "f", "F" ou " F " e já deixa em maiúsculas
    validar_tipo = (request, response, next) => {
        const tipo = validarTipo(request.body.tipo);

        if (!tipo) {
            return response.status(400).send({
                status: false,
                error: 'Tipo de treino inválido. Use F (Físico), T (Técnico) ou E (Estratégico)'
            });
        }

        request.body.tipo = tipo;
        next();
    }

    // Aqui só se confere se veio um número. As faixas (duração > 0 e intensidade
    // de 1 a 10) são regra de negócio e ficam no service (calcularCarga), que responde 400
    validar_numeros = (request, response, next) => {
        if (isNaN(converterNumero(request.body.duracaoMin))) {
            return response.status(400).send({
                status: false,
                error: 'A duração (duracaoMin) deve ser um número'
            });
        }

        if (isNaN(converterNumero(request.body.intensidade))) {
            return response.status(400).send({
                status: false,
                error: 'A intensidade deve ser um número'
            });
        }

        next();
    }

    // GET /treinos?jogadorId=6&tipo=F&posicao=A&inicio=2026-10-05&fim=2026-10-11
    validar_filtros = (request, response, next) => {
        const { jogadorId, tipo, posicao, inicio, fim } = request.query;
        const filtros = {};

        if (!naoEnviado(jogadorId)) {
            if (!ehInteiroPositivo(jogadorId)) {
                return response.status(400).send({
                    status: false,
                    error: 'O filtro jogadorId deve ser um número inteiro positivo'
                });
            }
            filtros.jogadorId = Number(jogadorId);
        }

        if (!naoEnviado(tipo)) {
            filtros.tipo = validarTipo(tipo);
            if (!filtros.tipo) {
                return response.status(400).send({
                    status: false,
                    error: 'Filtro tipo inválido. Use F, T ou E'
                });
            }
        }

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

        if (!naoEnviado(inicio)) {
            filtros.inicio = normalizarData(inicio);
            if (!filtros.inicio) {
                return response.status(400).send({
                    status: false,
                    error: 'Filtro inicio inválido. Use o formato AAAA-MM-DD'
                });
            }
        }

        if (!naoEnviado(fim)) {
            filtros.fim = normalizarData(fim);
            if (!filtros.fim) {
                return response.status(400).send({
                    status: false,
                    error: 'Filtro fim inválido. Use o formato AAAA-MM-DD'
                });
            }
        }

        // No formato AAAA-MM-DD a comparação de texto já segue a ordem das datas
        if (filtros.inicio && filtros.fim && filtros.inicio > filtros.fim) {
            return response.status(400).send({
                status: false,
                error: 'A data inicial não pode ser posterior à data final'
            });
        }

        // No Express 5 o request.query é somente leitura: os filtros seguem em request.filtros
        request.filtros = filtros;
        next();
    }
};
