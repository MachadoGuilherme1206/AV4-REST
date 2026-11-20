const { Configuracao } = require('../models');
const { inicioDoDia } = require('../utils/data');

module.exports = class ConfiguracaoService {

    // A configuração vigente é o registro mais recente (null se ainda não foi cadastrada)
    static async consultarConfiguracao() {
        try {
            return await Configuracao.findOne({ order: [['id', 'DESC']] });
        } catch (error) {
            console.error('Erro ao consultar configuração:', error.message);
            throw error;
        }
    }

    // Cadastra na primeira vez (create) e atualiza nas seguintes (instância.update)
    static async salvarConfiguracao(dados) {
        try {
            const valores = { cargaMaximaSemanal: dados.cargaMaximaSemanal };
            if (dados.dataVigencia !== undefined) {
                valores.dataVigencia = inicioDoDia(dados.dataVigencia);
            }

            const existente = await ConfiguracaoService.consultarConfiguracao();
            if (existente) {
                await existente.update(valores);
                return { configuracao: existente, criada: false };
            }

            const configuracao = await Configuracao.create(valores);
            return { configuracao, criada: true };
        } catch (error) {
            console.error('Erro ao salvar configuração:', error.message);
            throw error;
        }
    }
};
