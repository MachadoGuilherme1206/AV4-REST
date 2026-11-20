const { Model, DataTypes } = require('sequelize');
const { formatarDataHora } = require('../utils/data');

// F = Físico, T = Técnico, E = Estratégico
const TIPOS = ['F', 'T', 'E'];

module.exports = class Treino extends Model {

    static TIPOS = TIPOS;

    static iniciar(sequelize) {
        Treino.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                codigo: {
                    type: DataTypes.STRING(30),
                    allowNull: false,
                    unique: { msg: 'Já existe um treino cadastrado com este código' },
                    validate: {
                        notNull: { msg: 'O código do treino é obrigatório' },
                        notEmpty: { msg: 'O código do treino é obrigatório' }
                    }
                },
                jogadorId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    validate: {
                        notNull: { msg: 'O jogador (jogadorId) é obrigatório' },
                        isInt: { msg: 'O jogadorId deve ser um número inteiro' }
                    }
                },
                dataTreino: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    // Na resposta JSON a data aparece no fuso local: "2026-10-05 08:00:00"
                    get() {
                        return formatarDataHora(this.getDataValue('dataTreino'));
                    },
                    validate: {
                        notNull: { msg: 'A data do treino é obrigatória' },
                        isDate: { msg: 'Data do treino inválida' }
                    }
                },
                tipo: {
                    type: DataTypes.ENUM(...TIPOS),
                    allowNull: false,
                    validate: {
                        notNull: { msg: 'O tipo do treino é obrigatório' },
                        isIn: { args: [TIPOS], msg: 'Tipo de treino inválido. Use F, T ou E' }
                    }
                },
                duracaoMin: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    validate: {
                        notNull: { msg: 'A duração é obrigatória' },
                        isInt: { msg: 'A duração deve ser um número inteiro de minutos' },
                        min: { args: [1], msg: 'A duração deve ser maior que zero' }
                    }
                },
                intensidade: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    validate: {
                        notNull: { msg: 'A intensidade é obrigatória' },
                        isInt: { msg: 'A intensidade deve ser um número inteiro' },
                        min: { args: [1], msg: 'A intensidade deve estar entre 1 e 10' },
                        max: { args: [10], msg: 'A intensidade deve estar entre 1 e 10' }
                    }
                },
                carga: {
                    type: DataTypes.DECIMAL(10, 2),
                    allowNull: false,
                    validate: {
                        min: { args: [0], msg: 'A carga não pode ser negativa' }
                    }
                }
            },
            {
                sequelize,
                modelName: 'Treino',
                tableName: 'treinos'
            }
        );
    }

    static associar(models) {
        Treino.belongsTo(models.Jogador, {
            foreignKey: 'jogadorId',
            as: 'jogador'
        });
    }
};
