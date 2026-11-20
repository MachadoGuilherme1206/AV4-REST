// Especificação OpenAPI 3 usada pelo Swagger UI em /api-docs
const PORTA = process.env.PORTA || 3000;

// Erro de regra de negócio (service/controller): { status: false, message }
const erroNegocio = (descricao, mensagem) => ({
  description: descricao,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErroNegocio' },
      example: { status: false, message: mensagem }
    }
  }
});

// Erro de validação de formato (middleware): { status: false, error }
const erroValidacao = (mensagem) => ({
  description: 'Campo ausente ou inválido',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErroValidacao' },
      example: { status: false, error: mensagem }
    }
  }
});

const erro500 = (mensagem) => ({
  description: 'Falha no banco de dados (sem SQL, host, usuário ou senha na resposta)',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Erro500' },
      example: { status: false, message: mensagem, erro: 'ECONNREFUSED' }
    }
  }
});

const sucesso = (descricao, exemplo) => ({
  description: descricao,
  content: { 'application/json': { example: exemplo } }
});

const jogadorExemplo = { id: 6, nome: 'Thiago Rocha', posicao: 'A', ativo: true };

const treinoExemplo = {
  id: 25,
  codigo: 'TR100',
  jogadorId: 6,
  dataTreino: '2026-10-20 08:00:00',
  tipo: 'F',
  duracaoMin: 60,
  intensidade: 8,
  carga: 72,
  jogador: jogadorExemplo
};

const parametroIdJogador = {
  name: 'id',
  in: 'path',
  required: true,
  description: 'Código do jogador',
  schema: { type: 'integer', minimum: 1 },
  example: 6
};

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'API de Treinos Esportivos com Carga e Risco de Lesão',
    version: '1.0.0',
    description:
      'API REST (Node.js + Express + Sequelize + MySQL) para registrar treinos, calcular a carga e gerar o relatório semanal.\n\n' +
      '**Carga** = (duração / 10) × intensidade × multiplicador (F = 1,5 · T = 1,2 · E = 1,0).\n\n' +
      '**Risco de sobrecarga**: só quando a carga semanal (segunda a domingo) é estritamente maior que o limite.\n\n' +
      '_O indicador de risco é exclusivamente didático e não corresponde a diagnóstico ou predição clínica de lesão._'
  },
  servers: [{ url: `http://localhost:${PORTA}`, description: 'Ambiente local' }],
  tags: [
    { name: 'Jogadores' },
    { name: 'Configuração' },
    { name: 'Treinos' },
    { name: 'Relatórios' }
  ],
  paths: {
    '/jogadores': {
      post: {
        tags: ['Jogadores'],
        summary: 'Cadastrar atleta',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/JogadorEntrada' },
              examples: {
                valido: { summary: 'Válido (201)', value: { nome: 'Gabriel Martins', posicao: 'A' } },
                posicaoInvalida: { summary: 'Posição inválida (400)', value: { nome: 'Fulano de Tal', posicao: 'X' } },
                semNome: { summary: 'Sem nome (400)', value: { posicao: 'M' } }
              }
            }
          }
        },
        responses: {
          201: sucesso('Jogador cadastrado', {
            status: true,
            message: 'Jogador cadastrado com sucesso',
            jogador: { id: 9, nome: 'Gabriel Martins', posicao: 'A', ativo: true }
          }),
          400: erroValidacao('Posição inválida. Use G (Goleiro), Z (Zagueiro), M (Meio-campo) ou A (Atacante)'),
          500: erro500('Erro ao cadastrar jogador')
        }
      },
      get: {
        tags: ['Jogadores'],
        summary: 'Listar atletas',
        parameters: [
          { name: 'posicao', in: 'query', schema: { type: 'string', enum: ['G', 'Z', 'M', 'A'] } },
          { name: 'ativo', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } }
        ],
        responses: {
          200: sucesso('Lista de jogadores', {
            status: true,
            message: 'Jogadores encontrados com sucesso',
            quantidade: 1,
            jogadores: [jogadorExemplo]
          }),
          400: erroValidacao('O filtro ativo deve ser true ou false'),
          500: erro500('Erro ao consultar jogadores')
        }
      }
    },
    '/jogadores/{id}': {
      get: {
        tags: ['Jogadores'],
        summary: 'Consultar atleta (com o histórico de treinos)',
        parameters: [parametroIdJogador],
        responses: {
          200: sucesso('Jogador encontrado', {
            status: true,
            message: 'Jogador encontrado com sucesso',
            jogador: { ...jogadorExemplo, treinos: [{ id: 1, codigo: 'TR001', dataTreino: '2026-10-05 08:00:00', tipo: 'F', duracaoMin: 60, intensidade: 8, carga: 72 }] }
          }),
          400: erroValidacao('O código do jogador deve ser um número inteiro positivo'),
          404: erroNegocio('Jogador não encontrado', 'Jogador não encontrado'),
          500: erro500('Erro ao consultar jogador')
        }
      },
      put: {
        tags: ['Jogadores'],
        summary: 'Atualizar atleta (envio parcial: campo ausente mantém o valor atual)',
        parameters: [parametroIdJogador],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/JogadorAtualizacao' },
              examples: {
                nomeEPosicao: { summary: 'Nome e posição', value: { nome: 'Thiago Rocha Jr.', posicao: 'M' } },
                reativar: { summary: 'Reativar jogador', value: { ativo: true } },
                vazio: { summary: 'Sem campos (400)', value: {} }
              }
            }
          }
        },
        responses: {
          200: sucesso('Jogador atualizado', {
            status: true,
            message: 'Jogador atualizado com sucesso',
            jogador: { ...jogadorExemplo, nome: 'Thiago Rocha Jr.', posicao: 'M' }
          }),
          400: erroValidacao('Informe nome, posicao e/ou ativo para atualizar'),
          404: erroNegocio('Jogador não encontrado', 'Jogador não encontrado'),
          500: erro500('Erro ao atualizar jogador')
        }
      }
    },
    '/jogadores/{id}/desativar': {
      patch: {
        tags: ['Jogadores'],
        summary: 'Desativar atleta (ativo = false; o histórico de treinos é mantido)',
        parameters: [parametroIdJogador],
        responses: {
          200: sucesso('Jogador desativado', {
            status: true,
            message: 'Jogador desativado com sucesso. O histórico de treinos foi mantido',
            jogador: { ...jogadorExemplo, ativo: false }
          }),
          400: erroNegocio('Jogador já inativo', 'O jogador já está inativo'),
          404: erroNegocio('Jogador não encontrado', 'Jogador não encontrado'),
          500: erro500('Erro ao desativar jogador')
        }
      }
    },
    '/configuracao': {
      get: {
        tags: ['Configuração'],
        summary: 'Consultar o limite máximo de carga semanal',
        responses: {
          200: sucesso('Configuração atual', {
            status: true,
            message: 'Configuração encontrada com sucesso',
            configuracao: { id: 1, cargaMaximaSemanal: 300, dataVigencia: '2026-10-01' }
          }),
          404: erroNegocio('Limite ainda não configurado', 'Nenhum limite de carga semanal foi configurado ainda. Use PUT /configuracao'),
          500: erro500('Erro ao consultar configuração')
        }
      },
      put: {
        tags: ['Configuração'],
        summary: 'Cadastrar (201) ou atualizar (200) o limite máximo de carga semanal',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ConfiguracaoEntrada' },
              examples: {
                padrao: { summary: 'Limite 300', value: { cargaMaximaSemanal: 300, dataVigencia: '2026-10-01' } },
                empate: { summary: 'Limite igual à carga do Thiago (309.6): sem risco', value: { cargaMaximaSemanal: 309.6 } },
                invalido: { summary: 'Negativo (400)', value: { cargaMaximaSemanal: -5 } }
              }
            }
          }
        },
        responses: {
          200: sucesso('Limite atualizado', {
            status: true,
            message: 'Limite semanal atualizado com sucesso',
            configuracao: { id: 1, cargaMaximaSemanal: 300, dataVigencia: '2026-10-01' }
          }),
          201: sucesso('Limite cadastrado pela primeira vez', {
            status: true,
            message: 'Limite semanal cadastrado com sucesso',
            configuracao: { id: 1, cargaMaximaSemanal: 300, dataVigencia: null }
          }),
          400: erroValidacao('A carga máxima semanal deve ser maior que zero'),
          500: erro500('Erro ao salvar configuração')
        }
      }
    },
    '/treinos': {
      post: {
        tags: ['Treinos'],
        summary: 'Registrar sessão de treino (calcula e grava a carga)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TreinoEntrada' },
              examples: {
                valido: {
                  summary: 'Válido: F, 60 min, intensidade 8 -> 72 (201)',
                  value: { codigo: 'TR100', jogadorId: 6, dataTreino: '2026-10-20 08:00:00', tipo: 'F', duracaoMin: 60, intensidade: 8 }
                },
                duplicado: {
                  summary: 'Código duplicado (409)',
                  value: { codigo: 'TR001', jogadorId: 6, dataTreino: '2026-10-20', tipo: 'F', duracaoMin: 60, intensidade: 8 }
                },
                intensidadeInvalida: {
                  summary: 'Intensidade 11 (400)',
                  value: { codigo: 'TR101', jogadorId: 6, dataTreino: '2026-10-20', tipo: 'T', duracaoMin: 60, intensidade: 11 }
                },
                duracaoInvalida: {
                  summary: 'Duração 0 (400)',
                  value: { codigo: 'TR102', jogadorId: 6, dataTreino: '2026-10-20', tipo: 'E', duracaoMin: 0, intensidade: 5 }
                },
                jogadorInexistente: {
                  summary: 'Jogador inexistente (404)',
                  value: { codigo: 'TR103', jogadorId: 999, dataTreino: '2026-10-20', tipo: 'F', duracaoMin: 60, intensidade: 5 }
                },
                jogadorInativo: {
                  summary: 'Jogador inativo (400)',
                  value: { codigo: 'TR104', jogadorId: 8, dataTreino: '2026-10-20', tipo: 'F', duracaoMin: 60, intensidade: 5 }
                }
              }
            }
          }
        },
        responses: {
          201: sucesso('Treino registrado', {
            status: true,
            message: 'Treino registrado com sucesso',
            treino: treinoExemplo,
            calculoCarga: { duracaoMin: 60, intensidade: 8, multiplicador: 1.5, formula: '(60 / 10) × 8 × 1.5', carga: 72 }
          }),
          400: erroNegocio('Intensidade/duração fora da faixa, jogador inativo ou campo inválido', 'A intensidade deve ser um número inteiro entre 1 e 10'),
          404: erroNegocio('Jogador inexistente', 'Jogador 999 não encontrado'),
          409: erroNegocio('Código duplicado', 'Já existe um treino cadastrado com o código TR001'),
          500: erro500('Erro ao registrar treino')
        }
      },
      get: {
        tags: ['Treinos'],
        summary: 'Listar e filtrar sessões (com os dados do jogador)',
        parameters: [
          { name: 'jogadorId', in: 'query', schema: { type: 'integer' } },
          { name: 'tipo', in: 'query', schema: { type: 'string', enum: ['F', 'T', 'E'] } },
          { name: 'posicao', in: 'query', schema: { type: 'string', enum: ['G', 'Z', 'M', 'A'] } },
          { name: 'inicio', in: 'query', description: 'Data inicial (AAAA-MM-DD)', schema: { type: 'string', format: 'date' }, example: '2026-10-05' },
          { name: 'fim', in: 'query', description: 'Data final, dia inteiro (AAAA-MM-DD)', schema: { type: 'string', format: 'date' }, example: '2026-10-11' }
        ],
        responses: {
          200: sucesso('Lista de treinos', {
            status: true,
            message: 'Treinos encontrados com sucesso',
            filtros: { tipo: 'F', inicio: '2026-10-05', fim: '2026-10-11' },
            quantidade: 1,
            cargaTotal: 72,
            treinos: [treinoExemplo]
          }),
          400: erroValidacao('A data inicial não pode ser posterior à data final'),
          500: erro500('Erro ao consultar treinos')
        }
      }
    },
    '/treinos/jogador/{id}': {
      get: {
        tags: ['Treinos'],
        summary: 'Treinos do atleta',
        parameters: [parametroIdJogador],
        responses: {
          200: sucesso('Treinos do jogador', {
            status: true,
            message: 'Treinos de Thiago Rocha encontrados com sucesso',
            jogador: jogadorExemplo,
            quantidade: 1,
            cargaTotal: 72,
            treinos: [treinoExemplo]
          }),
          400: erroValidacao('O código do jogador informado na URL deve ser um número inteiro positivo'),
          404: erroNegocio('Jogador não encontrado', 'Jogador não encontrado'),
          500: erro500('Erro ao consultar treinos do jogador')
        }
      }
    },
    '/treinos/{codigo}': {
      delete: {
        tags: ['Treinos'],
        summary: 'Excluir sessão pelo código',
        parameters: [{ name: 'codigo', in: 'path', required: true, schema: { type: 'string' }, example: 'TR100' }],
        responses: {
          200: sucesso('Treino excluído', { status: true, message: 'Treino excluído com sucesso', treino: treinoExemplo }),
          404: erroNegocio('Treino não encontrado', 'Treino com código TR999 não encontrado'),
          500: erro500('Erro ao excluir treino')
        }
      }
    },
    '/relatorios/semanal': {
      get: {
        tags: ['Relatórios'],
        summary: 'Relatório semanal de performance (segunda a domingo)',
        parameters: [
          {
            name: 'data',
            in: 'query',
            required: true,
            description: 'Qualquer data da semana desejada (AAAA-MM-DD)',
            schema: { type: 'string', format: 'date' },
            examples: {
              semana1: { summary: 'Semana de 05/10 a 11/10/2026', value: '2026-10-05' },
              semana2: { summary: 'Semana de 12/10 a 18/10/2026', value: '2026-10-14' },
              vazia: { summary: 'Semana sem treinos', value: '2026-01-05' }
            }
          }
        ],
        responses: {
          200: { description: 'Relatório consolidado (ver README para o exemplo completo)' },
          400: erroValidacao('Informe a data de referência com ?data=AAAA-MM-DD'),
          500: erro500('Erro ao gerar relatório semanal')
        }
      }
    }
  },
  components: {
    schemas: {
      ErroValidacao: {
        type: 'object',
        properties: { status: { type: 'boolean', example: false }, error: { type: 'string' } }
      },
      ErroNegocio: {
        type: 'object',
        properties: { status: { type: 'boolean', example: false }, message: { type: 'string' } }
      },
      Erro500: {
        type: 'object',
        properties: {
          status: { type: 'boolean', example: false },
          message: { type: 'string' },
          erro: { type: 'string', description: 'Só o código do erro (ex.: ECONNREFUSED)' }
        }
      },
      JogadorEntrada: {
        type: 'object',
        required: ['nome', 'posicao'],
        properties: {
          nome: { type: 'string', minLength: 2, maxLength: 100 },
          posicao: { type: 'string', enum: ['G', 'Z', 'M', 'A'], description: 'G = Goleiro, Z = Zagueiro, M = Meio-campo, A = Atacante' }
        }
      },
      JogadorAtualizacao: {
        type: 'object',
        properties: {
          nome: { type: 'string' },
          posicao: { type: 'string', enum: ['G', 'Z', 'M', 'A'] },
          ativo: { type: 'boolean' }
        }
      },
      TreinoEntrada: {
        type: 'object',
        required: ['codigo', 'jogadorId', 'dataTreino', 'tipo', 'duracaoMin', 'intensidade'],
        properties: {
          codigo: { type: 'string', maxLength: 30, description: 'Código único da sessão (ex.: TR100)' },
          jogadorId: { type: 'integer' },
          dataTreino: { type: 'string', example: '2026-10-20 08:00:00', description: 'AAAA-MM-DD ou AAAA-MM-DD HH:MM:SS' },
          tipo: { type: 'string', enum: ['F', 'T', 'E'], description: 'F = Físico (1,5), T = Técnico (1,2), E = Estratégico (1,0)' },
          duracaoMin: { type: 'integer', minimum: 1 },
          intensidade: { type: 'integer', minimum: 1, maximum: 10 }
        }
      },
      ConfiguracaoEntrada: {
        type: 'object',
        required: ['cargaMaximaSemanal'],
        properties: {
          cargaMaximaSemanal: { type: 'number', minimum: 0, exclusiveMinimum: true },
          dataVigencia: { type: 'string', format: 'date' }
        }
      }
    }
  }
};
