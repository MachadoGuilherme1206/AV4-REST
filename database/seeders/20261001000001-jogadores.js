'use strict';

// 8 atletas cobrindo as 4 posições. "Pedro Nunes" está inativo, mas mantém
// seu histórico de treinos (usado para testar cadastro em atleta inativo).
const jogadores = [
  { id: 1, nome: 'Carlos Souza', posicao: 'G', ativo: true },
  { id: 2, nome: 'Bruno Lima', posicao: 'Z', ativo: true },
  { id: 3, nome: 'Diego Alves', posicao: 'Z', ativo: true },
  { id: 4, nome: 'Rafael Costa', posicao: 'M', ativo: true },
  { id: 5, nome: 'Lucas Pereira', posicao: 'M', ativo: true },
  { id: 6, nome: 'Thiago Rocha', posicao: 'A', ativo: true },
  { id: 7, nome: 'Mateus Silva', posicao: 'A', ativo: true },
  { id: 8, nome: 'Pedro Nunes', posicao: 'G', ativo: false },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const agora = new Date();
    await queryInterface.bulkInsert(
      'jogadores',
      jogadores.map((j) => ({ ...j, createdAt: agora, updatedAt: agora }))
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('jogadores', {
      id: { [Sequelize.Op.in]: jogadores.map((j) => j.id) },
    });
  },
};
