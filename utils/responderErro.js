const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const ErroNegocio = require('./ErroNegocio');


function responderErro(response, error, mensagemPadrao) {
    if (error instanceof ErroNegocio) {
        return response.status(error.statusHttp).send({
            status: false,
            message: error.message
        });
    }

    // Código repetido que passou pela checagem do service (duas requisições ao mesmo tempo):
    // o índice UNIQUE do banco barra a segunda, e aqui vira 409
    // (UniqueConstraintError herda de ValidationError, por isso vem antes)
    if (error instanceof UniqueConstraintError) {
        return response.status(409).send({
            status: false,
            message: 'Já existe um registro com este valor',
            campos: error.errors.map((e) => e.path)
        });
    }

    // Validações declaradas nos models (validate: { min, max, isIn... })
    if (error instanceof ValidationError) {
        return response.status(400).send({
            status: false,
            message: error.errors.map((e) => e.message).join('; ')
        });
    }

    if (error instanceof ForeignKeyConstraintError) {
        return response.status(409).send({
            status: false,
            message: 'A operação viola um relacionamento entre registros'
        });
    }

    // Falha de banco ou erro inesperado: o detalhe completo já foi registrado no terminal pelo service.
    // Para o cliente vai apenas o código (ex.: ECONNREFUSED), nunca SQL, host, usuário ou senha
    return response.status(500).send({
        status: false,
        message: mensagemPadrao,
        erro: (error.parent && error.parent.code) || error.name
    });
}

module.exports = responderErro;
