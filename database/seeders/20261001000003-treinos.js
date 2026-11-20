'use strict';

// 24 treinos em duas semanas (05/10 a 11/10/2026 e 12/10 a 18/10/2026)
// usando os três tipos (F, T, E). A carga é calculada com a MESMA função
// de regra de negócio usada pela API (utils/carga.js).
const { calcularCarga } = require('../../utils/carga');
const { paraDate } = require('../../utils/data');

// [codigo, jogadorId, dataHora, tipo, duracaoMin, intensidade]
const treinos = [
  // ---------- Semana 1: 05/10/2026 (seg) a 11/10/2026 (dom) ----------
  ['TR001', 6, '2026-10-05T08:00:00', 'F', 60, 8], //  72,0  (exemplo do enunciado)
  ['TR002', 6, '2026-10-06T08:00:00', 'T', 90, 7], //  75,6
  ['TR003', 6, '2026-10-07T08:00:00', 'F', 80, 9], // 108,0
  ['TR004', 6, '2026-10-09T08:00:00', 'E', 90, 6], //  54,0 -> Thiago = 309,6 (ACIMA de 300)
  ['TR005', 1, '2026-10-05T09:30:00', 'T', 60, 6], //  43,2
  ['TR006', 1, '2026-10-08T09:30:00', 'E', 45, 5], //  22,5 -> Carlos = 65,7
  ['TR007', 2, '2026-10-06T10:00:00', 'F', 70, 8], //  84,0
  ['TR008', 2, '2026-10-08T10:00:00', 'T', 60, 7], //  50,4
  ['TR009', 2, '2026-10-10T10:00:00', 'E', 50, 4], //  20,0 -> Bruno = 154,4
  ['TR010', 4, '2026-10-05T15:00:00', 'F', 90, 10], // 135,0
  ['TR011', 4, '2026-10-07T15:00:00', 'T', 100, 8], //  96,0
  ['TR012', 4, '2026-10-09T15:00:00', 'F', 50, 9], //  67,5 -> Rafael = 298,5 (ABAIXO de 300)
  ['TR013', 5, '2026-10-06T16:00:00', 'E', 60, 5], //  30,0
  ['TR014', 5, '2026-10-10T16:00:00', 'T', 40, 6], //  28,8 -> Lucas = 58,8
  ['TR015', 7, '2026-10-11T18:00:00', 'F', 60, 7], //  63,0 -> Mateus (domingo: limite da semana)
  ['TR016', 8, '2026-10-05T11:00:00', 'T', 50, 5], //  30,0 -> Pedro = 30,0 (menor da semana; hoje inativo, histórico preservado)
  // Diego (id 3) não treinou na semana 1 -> fica fora dos rankings dessa semana.

  // ---------- Semana 2: 12/10/2026 (seg) a 18/10/2026 (dom) ----------
  ['TR017', 6, '2026-10-12T08:00:00', 'E', 60, 5], //  30,0 -> Thiago = 30,0 (EMPATE na menor carga)
  ['TR018', 3, '2026-10-13T08:00:00', 'F', 100, 10], // 150,0
  ['TR019', 3, '2026-10-15T08:00:00', 'F', 80, 10], // 120,0
  ['TR020', 3, '2026-10-17T08:00:00', 'T', 50, 6], //  36,0 -> Diego = 306,0 (ACIMA de 300)
  ['TR021', 1, '2026-10-14T09:30:00', 'F', 40, 6], //  36,0 -> Carlos = 36,0
  ['TR022', 4, '2026-10-16T15:00:00', 'T', 50, 5], //  30,0 -> Rafael = 30,0 (EMPATE na menor carga)
  ['TR023', 5, '2026-10-13T16:00:00', 'E', 60, 5], //  30,0 -> Lucas = 30,0 (EMPATE na menor carga)
  ['TR024', 2, '2026-10-18T10:00:00', 'T', 60, 8], //  57,6 -> Bruno = 57,6
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const agora = new Date();
    await queryInterface.bulkInsert(
      'treinos',
      treinos.map(([codigo, jogadorId, dataHora, tipo, duracaoMin, intensidade]) => ({
        codigo,
        jogadorId,
        dataTreino: paraDate(dataHora),
        tipo,
        duracaoMin,
        intensidade,
        carga: calcularCarga(duracaoMin, intensidade, tipo).carga,
        createdAt: agora,
        updatedAt: agora,
      }))
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('treinos', {
      codigo: { [Sequelize.Op.in]: treinos.map((t) => t[0]) },
    });
  },
};
