const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocumento = require('./docs/swagger');
const { Banco } = require('./models');
const JogadorRoutes = require('./routes/jogadorRoutes');
const TreinoRoutes = require('./routes/treinoRoutes');
const ConfiguracaoRoutes = require('./routes/configuracaoRoutes');
const RelatorioRoutes = require('./routes/relatorioRoutes');

module.exports = class Servidor {
  constructor() {
    this._app = express();
    this._porta = Number(process.env.PORTA) || 3000;

    this._app.disable('x-powered-by');
    this._app.use(express.json());

    this._jogadorRoutes = new JogadorRoutes();
    this._treinoRoutes = new TreinoRoutes();
    this._configuracaoRoutes = new ConfiguracaoRoutes();
    this._relatorioRoutes = new RelatorioRoutes();

    this.configurarDocumentacao();
    this.configurarRotas();
    this.configurarErros();
  }

  // Swagger UI em /api-docs (é por ele que as evidências das requisições são geradas)
  configurarDocumentacao = () => {
    this._app.get('/api-docs.json', (request, response) => response.send(swaggerDocumento));
    this._app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocumento, { customSiteTitle: 'API Treinos Esportivos' })
    );
  };

  configurarRotas = () => {
    this._app.use('/jogadores', this._jogadorRoutes.router);
    this._app.use('/treinos', this._treinoRoutes.router);
    this._app.use('/configuracao', this._configuracaoRoutes.router);
    this._app.use('/relatorios', this._relatorioRoutes.router);
  };

  // Sem estes handlers o Express responderia em HTML; a API responde sempre em JSON
  configurarErros = () => {
    this._app.use((request, response) => {
      response.status(404).send({
        status: false,
        message: `Rota ${request.method} ${request.originalUrl} não encontrada`
      });
    });

    this._app.use((error, request, response, next) => {
      // Corpo da requisição com JSON mal formado
      if (error.type === 'entity.parse.failed') {
        return response.status(400).send({
          status: false,
          error: 'O corpo da requisição não é um JSON válido'
        });
      }

      console.error('Erro não tratado:', error.message);
      return response.status(500).send({
        status: false,
        message: 'Erro interno do servidor'
      });
    });
  };

  iniciar = async () => {
    // A API sobe mesmo com o banco fora do ar: nesse caso cada requisição
    // responde 500, e o aviso abaixo já indica o problema no terminal
    await Banco.testarConexao();

    // No Express 5 este callback também é chamado quando a porta falha (ex.: já em uso)
    this._app.listen(this._porta, (error) => {
      if (error) {
        console.error(`Não foi possível iniciar o servidor na porta ${this._porta}:`, error.message);
        process.exit(1);
      }
      console.log(`Servidor rodando na porta ${this._porta}`);
      console.log(`Swagger em http://localhost:${this._porta}/api-docs`);
    });
  };

  get app() {
    return this._app;
  }
};
