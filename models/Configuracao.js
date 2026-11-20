const { Model, DataTypes } = require('sequelize');
const { formatarDataHora } = require('../utils/data');

module.exports = class Configuracao extends Model {

    static iniciar(sequelize) {
        Configuracao.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                cargaMaximaSemanal: {
                    type: DataTypes.DECIMAL(10, 2),
                    allowNull: false,
                    validate: {
                        notNull: { msg: 'A carga máxima semanal é obrigatória' },
                        min: { args: [0.01], msg: 'A carga máxima semanal deve ser maior que zero' }
                    }
                },
                dataVigencia: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    get() {
                        const valor = this.getDataValue('dataVigencia');
                        return valor ? formatarDataHora(valor).substring(0, 10) : null;
                    },
                    validate: {
                        isDate: { msg: 'Data de vigência inválida' }
                    }
                }
            },
            {
                sequelize,
                modelName: 'Configuracao',
                tableName: 'configuracoes'
            }
        );
    }
};
