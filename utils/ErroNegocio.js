
// Erro de regra de negócio com o código HTTP que deve ser respondido (400, 404, 409...)
module.exports = class ErroNegocio extends Error {
    constructor(mensagem, statusHttp = 400) {
        super(mensagem);
        this.name = 'ErroNegocio';
        this.statusHttp = statusHttp;
    }
};
