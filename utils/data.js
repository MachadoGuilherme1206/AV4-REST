require('dotenv').config();

// Fuso usado para interpretar as datas recebidas e montar as semanas.
// É o mesmo que o Sequelize usa para gravar as colunas DATETIME (config/database.js)
const FUSO = process.env.DB_TIMEZONE || '-03:00';

const FORMATO_DATA = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/;

const doisDigitos = (n) => String(n).padStart(2, '0');


// Aceita "AAAA-MM-DD", "AAAA-MM-DD HH:MM" ou "AAAA-MM-DD HH:MM:SS" (também com T).
// Devolve "AAAA-MM-DDTHH:MM:SS" ou null se a data não existir (ex.: 2026-02-30)
function normalizarDataHora(valor) {
    const partes = FORMATO_DATA.exec(String(valor).trim());
    if (!partes) {
        return null;
    }

    const ano = Number(partes[1]);
    const mes = Number(partes[2]);
    const dia = Number(partes[3]);
    const hora = Number(partes[4] || 0);
    const minuto = Number(partes[5] || 0);
    const segundo = Number(partes[6] || 0);

    const data = new Date(Date.UTC(ano, mes - 1, dia, hora, minuto, segundo));
    const valida =
        data.getUTCFullYear() === ano &&
        data.getUTCMonth() === mes - 1 &&
        data.getUTCDate() === dia &&
        data.getUTCHours() === hora &&
        data.getUTCMinutes() === minuto &&
        data.getUTCSeconds() === segundo;

    if (!valida) {
        return null;
    }

    return `${ano}-${doisDigitos(mes)}-${doisDigitos(dia)}T` +
        `${doisDigitos(hora)}:${doisDigitos(minuto)}:${doisDigitos(segundo)}`;
}

// Só "AAAA-MM-DD", sem hora
function normalizarData(valor) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor).trim())) {
        return null;
    }
    const dataHora = normalizarDataHora(valor);
    return dataHora ? dataHora.substring(0, 10) : null;
}

// "AAAA-MM-DDTHH:MM:SS" (já normalizada) -> Date no fuso configurado
function paraDate(dataHora) {
    return new Date(`${dataHora}${FUSO}`);
}

function inicioDoDia(data) {
    return new Date(`${data}T00:00:00.000${FUSO}`);
}

function fimDoDia(data) {
    return new Date(`${data}T23:59:59.999${FUSO}`);
}

// Date -> "AAAA-MM-DD HH:MM:SS" no fuso configurado (usado nas respostas da API,
// para o treino de domingo 22:00 não aparecer como segunda-feira em UTC)
function formatarDataHora(data) {
    if (!(data instanceof Date) || isNaN(data.getTime())) {
        return data;
    }
    const sinal = FUSO.startsWith('-') ? -1 : 1;
    const [horas, minutos] = FUSO.substring(1).split(':').map(Number);
    const deslocamentoMs = sinal * (horas * 60 + minutos) * 60000;

    return new Date(data.getTime() + deslocamentoMs).toISOString().substring(0, 19).replace('T', ' ');
}

// Semana de referência (segunda a domingo) que contém a data informada
function calcularSemana(data) {
    const [ano, mes, dia] = data.split('-').map(Number);
    const referencia = new Date(Date.UTC(ano, mes - 1, dia));

    // getUTCDay: domingo = 0, segunda = 1 ... sábado = 6. Quantos dias voltar até a segunda:
    const diasDesdeSegunda = (referencia.getUTCDay() + 6) % 7;

    const segunda = new Date(referencia);
    segunda.setUTCDate(referencia.getUTCDate() - diasDesdeSegunda);
    const domingo = new Date(segunda);
    domingo.setUTCDate(segunda.getUTCDate() + 6);

    const inicio = segunda.toISOString().substring(0, 10);
    const fim = domingo.toISOString().substring(0, 10);

    return {
        inicio,
        fim,
        // Intervalo usado no Op.between: segunda 00:00:00 até domingo 23:59:59.999
        inicioDate: inicioDoDia(inicio),
        fimDate: fimDoDia(fim)
    };
}

module.exports = {
    FUSO,
    normalizarDataHora,
    normalizarData,
    paraDate,
    inicioDoDia,
    fimDoDia,
    formatarDataHora,
    calcularSemana
};
