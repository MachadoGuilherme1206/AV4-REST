const { Model, DataTypes } = require('sequelize');

// G = Goleiro, Z = Zagueiro, M = Meio-campo, A = Atacante
const POSICOES = ['G', 'Z', 'M', 'A'];

module.exports = class Jogador extends Model {

    static POSICOES = POSICOES;

    static iniciar(sequelize) {
        Jogador.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                nome: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    validate: {
                        notNull: { msg: 'O nome do jogador é obrigatório' },
                        notEmpty: { msg: 'O nome do jogador é obrigatório' },
                        len: { args: [2, 100], msg: 'O nome deve ter entre 2 e 100 caracteres' }
                    }
                },
                posicao: {
                    type: DataTypes.ENUM(...POSICOES),
                    allowNull: false,
                    validate: {
                        notNull: { msg: 'A posição é obrigatória' },
                        isIn: { args: [POSICOES], msg: 'Posição inválida. Use G, Z, M ou A' }
                    }
                },
                ativo: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: true
                }
            },
            {
                sequelize,
                modelName: 'Jogador',
                tableName: 'jogadores'
            }
        );
    }

    static associar(models) {
        // 1 jogador -> N treinos. RESTRICT impede apagar um jogador que tem histórico
        Jogador.hasMany(models.Treino, {
            foreignKey: 'jogadorId',
            as: 'treinos',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        });
    }
};
