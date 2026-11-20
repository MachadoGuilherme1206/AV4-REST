const ErroNegocio = require('./ErroNegocio');

const MULTIPLICADOR_TIPO = {
    F: 1.5, // Físico
    T: 1.2, // Técnico
    E: 1.0  // Estratégico
};

const DESCRICAO_TIPO = {
    F: 'Físico',
    T: 'Técnico',
    E: 'Estratégico'
};


function arredondar(valor) {
    return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

// Carga do treino = (duração em minutos / 10) × intensidade × multiplicador do tipo
// Ex.: físico, 60 min, intensidade 8 -> (60 / 10) × 8 × 1,5 = 72 pontos
// É aqui que a intensidade (1 a 10) e a duração (> 0) são validadas: o erro vira HTTP 400
function calcularCarga(duracaoMin, intensidade, tipo) {
    const duracao = Number(duracaoMin);
    const valorIntensidade = Number(intensidade);
    const multiplicador = MULTIPLICADOR_TIPO[tipo];

    if (!Number.isInteger(duracao) || duracao <= 0) {
        throw new ErroNegocio('A duração do treino deve ser um número inteiro de minutos maior que zero', 400);
    }
    if (!Number.isInteger(valorIntensidade) || valorIntensidade < 1 || valorIntensidade > 10) {
        throw new ErroNegocio('A intensidade deve ser um número inteiro entre 1 e 10', 400);
    }
    if (multiplicador === undefined) {
        throw new ErroNegocio('Tipo de treino inválido. Use F (Físico), T (Técnico) ou E (Estratégico)', 400);
    }

    return {
        duracaoMin: duracao,
        intensidade: valorIntensidade,
        multiplicador,
        carga: arredondar((duracao / 10) * valorIntensidade * multiplicador),
        memoriaCalculo: `(${duracao} / 10) × ${valorIntensidade} × ${multiplicador.toFixed(1)}`
    };
}

module.exports = {
    MULTIPLICADOR_TIPO,
    DESCRICAO_TIPO,
    arredondar,
    calcularCarga
};
