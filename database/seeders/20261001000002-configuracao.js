'use strict';

const { inicioDoDia } = require('../../utils/data');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const agora = new Date();
    // Limite de 300 pontos: na semana de 05/10/2026 Thiago (309,6) fica ACIMA e
    // Rafael (298,5) fica logo ABAIXO; na semana de 12/10/2026 Diego (306) fica acima.
    await queryInterface.bulkInsert('configuracoes', [
      {
        id: 1,
        cargaMaximaSemanal: 300,
        dataVigencia: inicioDoDia('2026-10-01'),
        createdAt: agora,
        updatedAt: agora,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('configuracoes', { id: 1 });
  },
};
