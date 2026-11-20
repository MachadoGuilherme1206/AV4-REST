// Roda os testes obrigatórios (seção 8 do enunciado) contra a API no ar.
// Antes: npm run db:reset  e  npm start (em outro terminal). Depois: npm run test:api
// Ao final, rode npm run db:reset de novo: o teste cria, desativa e exclui registros.
require('dotenv').config();
const { calcularCarga } = require('../utils/carga');

const BASE = `http://localhost:${process.env.PORTA || 3000}`;
let aprovados = 0;
let reprovados = 0;

async function requisitar(metodo, rota, corpo) {
    const resposta = await fetch(BASE + rota, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: corpo === undefined ? undefined : JSON.stringify(corpo)
    });
    return { status: resposta.status, corpo: await resposta.json() };
}

function verificar(descricao, condicao, detalhe = '') {
    if (condicao) {
        aprovados++;
        console.log(`  OK    ${descricao}`);
    } else {
        reprovados++;
        console.log(`  FALHA ${descricao} ${detalhe}`);
    }
}

function nomes(ranking) {
    return ranking ? ranking.jogadores.map((j) => j.nome).sort().join(', ') : null;
}

async function executar() {
    console.log('\n1. Seis ou mais atletas nas quatro posições e vinte ou mais treinos com os três tipos');
    const jogadores = await requisitar('GET', '/jogadores');
    const posicoes = new Set(jogadores.corpo.jogadores.map((j) => j.posicao));
    verificar(`GET /jogadores -> ${jogadores.corpo.quantidade} jogadores`, jogadores.status === 200 && jogadores.corpo.quantidade >= 6);
    verificar(`posições cobertas: ${[...posicoes].sort().join(', ')}`, posicoes.size === 4);
    const treinos = await requisitar('GET', '/treinos');
    const tipos = new Set(treinos.corpo.treinos.map((t) => t.tipo));
    verificar(`GET /treinos -> ${treinos.corpo.quantidade} treinos`, treinos.status === 200 && treinos.corpo.quantidade >= 20);
    verificar(`tipos cobertos: ${[...tipos].sort().join(', ')}`, tipos.size === 3);

    console.log('\n2. Limite com um atleta acima e um abaixo (semana de 05/10/2026, limite 300)');
    const configuracao = await requisitar('GET', '/configuracao');
    verificar(`GET /configuracao -> limite ${configuracao.corpo.configuracao?.cargaMaximaSemanal}`, configuracao.corpo.configuracao?.cargaMaximaSemanal === 300);
    const semana1 = (await requisitar('GET', '/relatorios/semanal?data=2026-10-05')).corpo.relatorio;
    const thiago = semana1.porJogador.find((j) => j.nome === 'Thiago Rocha');
    const rafael = semana1.porJogador.find((j) => j.nome === 'Rafael Costa');
    verificar(`Thiago ${thiago.cargaSemanal} -> ${thiago.situacao}`, thiago.cargaSemanal === 309.6 && thiago.situacao === 'RISCO DE SOBRECARGA');
    verificar(`Rafael ${rafael.cargaSemanal} -> ${rafael.situacao}`, rafael.cargaSemanal === 298.5 && rafael.situacao === 'DENTRO DO LIMITE');

    console.log('\n   Empate com o limite (limite 309.6 = carga do Thiago) não sinaliza risco');
    await requisitar('PUT', '/configuracao', { cargaMaximaSemanal: 309.6 });
    const empate = (await requisitar('GET', '/relatorios/semanal?data=2026-10-05')).corpo.relatorio;
    verificar(`Thiago com limite 309.6 -> ${empate.porJogador.find((j) => j.nome === 'Thiago Rocha').situacao}`,
        empate.jogadoresEmRisco.quantidade === 0);
    await requisitar('PUT', '/configuracao', { cargaMaximaSemanal: 300 });

    console.log('\n3. Carga calculada à mão x resposta da API');
    const manual = (60 / 10) * 8 * 1.5;
    const registro = await requisitar('POST', '/treinos', {
        codigo: 'TR100', jogadorId: 6, dataTreino: '2026-10-20 08:00:00', tipo: 'F', duracaoMin: 60, intensidade: 8
    });
    verificar(`POST /treinos -> ${registro.status}`, registro.status === 201);
    verificar(`manual (60 / 10) × 8 × 1,5 = ${manual}; API = ${registro.corpo.treino?.carga}`,
        registro.corpo.treino?.carga === manual && calcularCarga(60, 8, 'F').carga === manual);

    console.log('\n4. Código duplicado, intensidade inválida e duração não positiva');
    const base = { jogadorId: 6, dataTreino: '2026-10-20', tipo: 'T', duracaoMin: 60, intensidade: 5 };
    const casos = [
        ['código duplicado (TR001)', { ...base, codigo: 'TR001' }, 409],
        ['intensidade 11', { ...base, codigo: 'TR101', intensidade: 11 }, 400],
        ['intensidade 0', { ...base, codigo: 'TR102', intensidade: 0 }, 400],
        ['duração 0', { ...base, codigo: 'TR103', duracaoMin: 0 }, 400],
        ['duração -30', { ...base, codigo: 'TR104', duracaoMin: -30 }, 400]
    ];
    for (const [descricao, corpo, esperado] of casos) {
        const r = await requisitar('POST', '/treinos', corpo);
        verificar(`${descricao} -> ${r.status} "${r.corpo.message || r.corpo.error}"`, r.status === esperado);
    }

    console.log('\n5. Treino para atleta inexistente ou inativo');
    const inexistente = await requisitar('POST', '/treinos', { ...base, codigo: 'TR105', jogadorId: 999 });
    verificar(`jogador 999 -> ${inexistente.status} "${inexistente.corpo.message}"`, inexistente.status === 404);
    const inativo = await requisitar('POST', '/treinos', { ...base, codigo: 'TR106', jogadorId: 8 });
    verificar(`jogador 8 (inativo) -> ${inativo.status} "${inativo.corpo.message}"`, inativo.status === 400);

    console.log('\n6. Duas semanas comparadas (por atleta, tipo e posição)');
    const semana2 = (await requisitar('GET', '/relatorios/semanal?data=2026-10-14')).corpo.relatorio;
    const tipo = (rel, t) => rel.mediaPorTipo.find((x) => x.tipo === t).cargaMedia;
    const posicao = (rel, p) => rel.porPosicao.find((x) => x.posicao === p);
    verificar(`total de treinos: semana 1 = ${semana1.totalTreinos}, semana 2 = ${semana2.totalTreinos}`,
        semana1.totalTreinos === 16 && semana2.totalTreinos === 8);
    verificar(`maior carga: ${nomes(semana1.maiorCargaSemanal)} (${semana1.maiorCargaSemanal.cargaSemanal}) x ${nomes(semana2.maiorCargaSemanal)} (${semana2.maiorCargaSemanal.cargaSemanal})`,
        nomes(semana1.maiorCargaSemanal) === 'Thiago Rocha' && nomes(semana2.maiorCargaSemanal) === 'Diego Alves');
    verificar(`menor carga: ${nomes(semana1.menorCargaSemanal)} x ${nomes(semana2.menorCargaSemanal)} (empate = ${semana2.menorCargaSemanal.empate})`,
        nomes(semana1.menorCargaSemanal) === 'Pedro Nunes' && semana2.menorCargaSemanal.empate === true &&
        semana2.menorCargaSemanal.jogadores.length === 3);
    verificar(`média F: ${tipo(semana1, 'F')} x ${tipo(semana2, 'F')}; T: ${tipo(semana1, 'T')} x ${tipo(semana2, 'T')}; E: ${tipo(semana1, 'E')} x ${tipo(semana2, 'E')}`,
        tipo(semana1, 'F') === 88.25 && tipo(semana2, 'F') === 102 && tipo(semana1, 'E') === 31.63);
    verificar(`posição Z: ${posicao(semana1, 'Z').quantidadeTreinos} treinos / ${posicao(semana1, 'Z').cargaMediaPorSessao} x ${posicao(semana2, 'Z').quantidadeTreinos} / ${posicao(semana2, 'Z').cargaMediaPorSessao}`,
        posicao(semana1, 'Z').cargaMediaPorSessao === 51.47 && posicao(semana2, 'Z').cargaMediaPorSessao === 90.9);
    verificar(`em risco: semana 1 = ${semana1.jogadoresEmRisco.quantidade}, semana 2 = ${semana2.jogadoresEmRisco.quantidade}`,
        semana1.jogadoresEmRisco.quantidade === 1 && semana2.jogadoresEmRisco.quantidade === 1);
    const vazia = (await requisitar('GET', '/relatorios/semanal?data=2026-01-05')).corpo.relatorio;
    verificar(`semana sem treinos -> total ${vazia.totalTreinos}, ranking ${vazia.maiorCargaSemanal}`,
        vazia.totalTreinos === 0 && vazia.maiorCargaSemanal === null);

    console.log('\n7. Desativar não apaga o histórico; excluir treino pelo código');
    const desativar = await requisitar('PATCH', '/jogadores/7/desativar');
    const historico = await requisitar('GET', '/treinos/jogador/7');
    verificar(`PATCH /jogadores/7/desativar -> ${desativar.status}; treinos mantidos: ${historico.corpo.quantidade}`,
        desativar.status === 200 && historico.corpo.quantidade === 1);
    const excluir = await requisitar('DELETE', '/treinos/TR100');
    const excluirDeNovo = await requisitar('DELETE', '/treinos/TR100');
    verificar(`DELETE /treinos/TR100 -> ${excluir.status}; de novo -> ${excluirDeNovo.status}`,
        excluir.status === 200 && excluirDeNovo.status === 404);

    console.log('\n8. Falha de banco sem vazar credenciais: teste manual');
    console.log('  Pare o MySQL e chame GET /jogadores: esperado 500 com erro "ECONNREFUSED", sem senha na resposta.');

    console.log(`\nResultado: ${aprovados} aprovados, ${reprovados} reprovados\n`);
    process.exit(reprovados > 0 ? 1 : 0);
}

executar().catch((error) => {
    console.error(`Não foi possível testar a API em ${BASE}: ${error.message}`);
    console.error('Confira se o servidor está no ar (npm start) e se o banco foi preparado (npm run db:reset).');
    process.exit(1);
});
