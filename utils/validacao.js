
// Funções de apoio usadas pelos middlewares de validação

function naoEnviado(valor) {
    return valor === undefined || valor === null || valor === '';
}

// Number('') e Number(true) dão 0 e 1; aqui só passam números ou textos numéricos
function converterNumero(valor) {
    if (typeof valor === 'number') {
        return valor;
    }
    if (typeof valor === 'string' && valor.trim() !== '') {
        return Number(valor);
    }
    return NaN;
}

function ehInteiroPositivo(valor) {
    const numero = converterNumero(valor);
    return Number.isInteger(numero) && numero > 0;
}

// Aceita true/false (boolean) e também "true"/"false" vindos da query string
function converterBooleano(valor) {
    if (typeof valor === 'boolean') {
        return valor;
    }
    const texto = String(valor).trim().toLowerCase();
    if (texto === 'true' || texto === '1') {
        return true;
    }
    if (texto === 'false' || texto === '0') {
        return false;
    }
    return null;
}

module.exports = {
    naoEnviado,
    converterNumero,
    ehInteiroPositivo,
    converterBooleano
};
