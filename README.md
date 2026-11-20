# API de Treinos Esportivos com Carga e Risco de Lesão

API REST (Node.js + Express) para a comissão técnica de um clube de futebol.
Gerencia jogadores e sessões de treino, calcula a carga de cada treino
automaticamente e gera um relatório semanal que aponta os atletas acima do
limite de carga configurado. Os dados ficam em MySQL, acessado pelo ORM
**Sequelize** com funções `async/await`.

> O indicador de risco é exclusivamente didático e não corresponde a
> diagnóstico ou predição clínica de lesão.

## Requisitos

- Node.js 18 ou superior
- MySQL 8

## Como rodar

1. Instalar as dependências (`express`, `sequelize`, `mysql2`, `dotenv`,
   `swagger-ui-express` e o `sequelize-cli`):

   ```
   npm install
   ```

2. Configurar as credenciais do banco. Copie o `.env.example` para `.env` e
   preencha a senha do seu MySQL:

   ```
   cp .env.example .env
   ```

   ```
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=sua_senha
   DB_DATABASE=db_treinos
   DB_TIMEZONE=-03:00
   DB_LOGGING=false
   PORTA=3000
   ```

   O `.env` está no `.gitignore`: a senha não vai para o repositório.

3. Criar o banco, as tabelas e os dados de teste:

   ```
   npm run db:setup
   ```

   Esse comando roda, em sequência, `db:create` (cria o database
   `db_treinos`), `db:migrate` (cria as tabelas `jogadores`, `treinos` e
   `configuracoes`) e `db:seed` (8 jogadores, 24 treinos e o limite semanal de 300).

   Para voltar ao estado inicial antes de repetir os testes:

   ```
   npm run db:reset
   ```

4. Subir o servidor (porta 3000):

   ```
   npm start
   ```

   Se der certo, o terminal mostra `Conectado ao MySQL (...)`,
   `Servidor rodando na porta 3000` e o endereço do Swagger.

5. Abrir o Swagger em <http://localhost:3000/api-docs>.

## Criação das tabelas: migrations

As tabelas são criadas por **migrations do Sequelize CLI**, a opção
preferencial do enunciado. Cada arquivo em `database/migrations/` tem um `up`
(cria a tabela, as chaves e os índices) e um `down` (desfaz). O CLI registra na
tabela `SequelizeMeta` quais migrations já rodaram, então `npm run db:migrate`
pode ser executado de novo sem recriar nada nem apagar dados.

A API **não** usa `sequelize.sync()`, nem com `{ force: true }`, que apaga as
tabelas e os dados. A estrutura do banco só muda por migration.

Os seeders (`database/seeders/`) inserem a massa de dados de teste. A carga
dos treinos é calculada com a mesma função `calcularCarga()` usada pela API, e
a tabela `SequelizeData` evita que os seeders rodem duas vezes.

Na tabela `treinos`, a chave estrangeira `jogadorId` usa `ON DELETE RESTRICT`.
Mesmo que alguém tente apagar um jogador direto no banco, os treinos dele
continuam lá. Pela API o jogador nunca é apagado, só desativado.

## Endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/jogadores` | Cadastra um jogador. 201 no sucesso, 400 em erro de validação. |
| GET | `/jogadores` | Lista os jogadores. Filtros opcionais: `?posicao=G\|Z\|M\|A` e `?ativo=true\|false`. |
| GET | `/jogadores/:id` | Consulta um jogador (inclusive inativo) com o histórico de treinos. 404 se não existir. |
| PUT | `/jogadores/:id` | Atualiza nome, posição e/ou ativo. Aceita envio parcial. 404 se não existir. |
| PATCH | `/jogadores/:id/desativar` | Desativa o jogador, mantendo o histórico de treinos. 400 se já estiver inativo. |
| GET | `/configuracao` | Consulta o limite máximo de carga semanal. 404 se ainda não foi configurado. |
| PUT | `/configuracao` | Cadastra (201) ou atualiza (200) o limite máximo de carga semanal. |
| POST | `/treinos` | Registra um treino e calcula a carga. 201; 400/404/409 em erro. |
| GET | `/treinos` | Lista os treinos com os dados do jogador. Filtros: `jogadorId`, `tipo`, `posicao`, `inicio`, `fim`. |
| GET | `/treinos/jogador/:id` | Treinos de um jogador. 404 se o jogador não existir. |
| DELETE | `/treinos/:codigo` | Exclui um treino pelo código após verificar se ele existe. 404 se não existir. |
| GET | `/relatorios/semanal?data=AAAA-MM-DD` | Relatório da semana (segunda a domingo) que contém a data. |

### Corpo das requisições

**POST /jogadores**

```json
{ "nome": "Gabriel Martins", "posicao": "A" }
```

- `posicao`: `G` Goleiro, `Z` Zagueiro, `M` Meio-campo, `A` Atacante
  (maiúsculas ou minúsculas).
- O jogador é sempre criado com `ativo: true`.

**PUT /jogadores/:id**: um ou mais campos; o campo ausente mantém o valor atual.

```json
{ "nome": "Thiago Rocha Jr.", "posicao": "M" }
```

`{ "ativo": true }` reativa um jogador desativado.

**PUT /configuracao**

```json
{ "cargaMaximaSemanal": 300, "dataVigencia": "2026-10-01" }
```

`dataVigencia` é opcional.

**POST /treinos**

```json
{
  "codigo": "TR100",
  "jogadorId": 6,
  "dataTreino": "2026-10-20 08:00:00",
  "tipo": "F",
  "duracaoMin": 60,
  "intensidade": 8
}
```

- `codigo` é o código único da sessão, informado pelo cliente. Por isso a API
  consegue rejeitar um código repetido (409).
- `dataTreino` aceita `AAAA-MM-DD` ou `AAAA-MM-DD HH:MM:SS`, no fuso do
  `DB_TIMEZONE`.
- `tipo` aceita `F`, `T` ou `E` (maiúsculas ou minúsculas).
- `duracaoMin` deve ser inteiro maior que zero, e `intensidade` inteiro de 1 a 10.
- A `carga` não é enviada: a API calcula e grava.

### Respostas

Todas as respostas são JSON no formato `{ status, message, ... }`. Erros de
validação de formato (middlewares) vêm em `{ status: false, error }`. Falhas
de banco trazem só o código do erro em `erro` (ex.: `ECONNREFUSED`), sem SQL,
host, usuário ou senha.

| Código | Quando |
| --- | --- |
| 200 | Consulta, atualização, desativação ou exclusão com sucesso |
| 201 | Jogador, treino ou limite semanal criados |
| 400 | Campo ausente ou inválido, intensidade fora de 1 a 10, duração não positiva, jogador inativo, data inválida |
| 404 | Jogador, treino, configuração ou rota inexistente |
| 409 | Código de treino duplicado |
| 500 | Falha na conexão ou na consulta ao banco |

## Regra de carga

```
carga = (duração em minutos / 10) × intensidade × multiplicador
```

| Tipo de treino | Código | Multiplicador |
| --- | --- | --- |
| Físico | F | 1,5 |
| Técnico | T | 1,2 |
| Estratégico | E | 1,0 |

Exemplo: treino físico de 60 minutos, intensidade 8 →
(60 / 10) × 8 × 1,5 = **72 pontos**.

- A regra fica numa única função, `calcularCarga()` em `utils/carga.js`, usada
  pela API e pelos seeders.
- `calcularCarga()` também valida a intensidade (1 a 10) e a duração (> 0) e
  lança `ErroNegocio` com status 400. Os models repetem essas regras nos
  `validate` do Sequelize, como segunda barreira.
- A carga é calculada no momento do registro e gravada na coluna `carga`.
- A resposta do POST traz `calculoCarga` com a fórmula aplicada, para conferir
  o valor à mão.

## Relatório semanal

`GET /relatorios/semanal?data=2026-10-05`

A semana vai de **segunda-feira 00:00:00 a domingo 23:59:59** e é a que contém
a data informada. Qualquer dia da semana serve: `2026-10-07` gera o mesmo
relatório de `2026-10-05`.

A **carga semanal** de um jogador é a soma das cargas dos treinos dele na
semana. Ele é marcado como `RISCO DE SOBRECARGA` somente quando essa soma é
**estritamente maior** que o limite configurado. No empate não há risco
(`DENTRO DO LIMITE`).

| Indicador | Campo na resposta | Sequelize |
| --- | --- | --- |
| Total de treinos | `totalTreinos` | `Treino.count({ where })` |
| Carga somada da semana | `cargaTotalSemana` | `Treino.sum('carga', { where })` |
| Por jogador | `porJogador` | `findAll` + `include` Jogador + `fn('SUM')`, `fn('COUNT')` + `group` |
| Maior carga semanal | `maiorCargaSemanal` | ranking sobre `porJogador` (nome, posição, total, treinos) |
| Menor carga semanal | `menorCargaSemanal` | ranking sobre `porJogador` (nome, posição, total) |
| Jogadores em risco | `jogadoresEmRisco` | quantidade e lista dos que passaram do limite |
| Média por tipo | `mediaPorTipo` | `findAll` + `fn('AVG')`, `fn('COUNT')` + `group: ['tipo']` |
| Por posição | `porPosicao` | `findAll` + `include` Jogador + `col('jogador.posicao')` + `fn('AVG')` + `group` |

Todas as consultas usam `where: { dataTreino: { [Op.between]: [segunda, domingo] } }`
e rodam em paralelo com `Promise.all`.

**Critérios** (também devolvidos no próprio relatório, em `criterios`):

- **Rankings**: maior e menor carga consideram apenas jogadores com pelo menos
  um treino na semana. Jogadores inativos com treinos na semana também entram,
  porque o histórico é preservado.
- **Empates**: em empate na maior ou na menor carga, todos os empatados são
  listados e o campo `empate` vem `true`.
- **Semana sem treinos**: responde 200 com `totalTreinos: 0`, listas vazias,
  rankings `null` e médias `0`. Não é tratado como erro.
- **Tipos e posições** aparecem sempre (F, T, E e G, Z, M, A), com zero quando
  não houver treinos.
- **Sem limite configurado**: `situacao` vem como `LIMITE NÃO CONFIGURADO` e
  `jogadoresEmRisco.quantidade` como `null`.

## Dados de teste

Os seeders cadastram:

- **8 jogadores** cobrindo as 4 posições:

  | id | Nome | Posição | Situação |
  | --- | --- | --- | --- |
  | 1 | Carlos Souza | G | ativo |
  | 2 | Bruno Lima | Z | ativo |
  | 3 | Diego Alves | Z | ativo |
  | 4 | Rafael Costa | M | ativo |
  | 5 | Lucas Pereira | M | ativo |
  | 6 | Thiago Rocha | A | ativo |
  | 7 | Mateus Silva | A | ativo |
  | 8 | Pedro Nunes | G | **inativo**, para os testes de jogador inativo e de histórico preservado |

- **Limite semanal de 300 pontos.**
- **24 treinos** com os três tipos, em duas semanas:

**Semana 1, de 05/10 a 11/10/2026** (`?data=2026-10-05`), 16 treinos:

| Jogador | Treinos | Carga semanal | Situação (limite 300) |
| --- | --- | --- | --- |
| Thiago Rocha (A) | 4 | 309,6 | **RISCO DE SOBRECARGA** |
| Rafael Costa (M) | 3 | 298,5 | dentro do limite (logo abaixo) |
| Bruno Lima (Z) | 3 | 154,4 | dentro do limite |
| Carlos Souza (G) | 2 | 65,7 | dentro do limite |
| Mateus Silva (A) | 1 | 63,0 | dentro do limite (treino no domingo) |
| Lucas Pereira (M) | 2 | 58,8 | dentro do limite |
| Pedro Nunes (G, inativo) | 1 | 30,0 | dentro do limite |

- Maior carga: Thiago, 309,6 em 4 treinos. Menor: Pedro, 30,0.
- Diego não treinou nesta semana e fica fora dos rankings.
- Média por tipo: F 88,25 (6 sessões), T 54,00 (6), E 31,63 (4).
- Por posição: G 3 treinos / 31,90 · Z 3 / 51,47 · M 5 / 71,46 · A 5 / 74,52.

**Semana 2, de 12/10 a 18/10/2026** (`?data=2026-10-14`), 8 treinos:

- Maior carga: Diego Alves, 306,0 em 3 treinos (**RISCO DE SOBRECARGA**).
- Menor carga: **empate** em 30,0 entre Thiago, Rafael e Lucas.
- Média por tipo: F 102,00 (3), T 41,20 (3), E 30,00 (2).
- Por posição: G 1 / 36,00 · Z 4 / 90,90 · M 2 / 30,00 · A 1 / 30,00.

Para testar o empate com o limite, faça `PUT /configuracao` com
`{ "cargaMaximaSemanal": 309.6 }`. Thiago passa a ficar exatamente no limite e
**não** é marcado como risco.

## Testando no Swagger

Com o servidor no ar, abra <http://localhost:3000/api-docs>. Cada rota tem
exemplos prontos no seletor **Examples** (válidos e de erro). Clique em
**Try it out**, escolha o exemplo e depois **Execute**.

Rode `npm run db:reset` antes de começar. Assim os ids e os valores esperados
batem com as tabelas acima.

### Teste automático

Com o banco recém-preparado (`npm run db:reset`) e a API no ar (`npm start`),
rode em outro terminal:

```
npm run test:api
```

O script `scripts/testarApi.js` faz as requisições dos testes obrigatórios e
mostra, para cada um, o valor esperado e o devolvido pela API. Ele cria,
desativa e exclui registros: rode `npm run db:reset` de novo depois.

### Testes obrigatórios

| # | Teste | Requisição | Esperado |
| --- | --- | --- | --- |
| 1 | 6+ atletas nas 4 posições e 20+ treinos com os 3 tipos | `GET /jogadores`, `GET /treinos` | 8 jogadores, 24 treinos |
| 2 | Limite com um atleta acima e um abaixo | `GET /relatorios/semanal?data=2026-10-05` | Thiago 309,6 em risco; Rafael 298,5 abaixo |
| 3 | Carga calculada à mão × API | `POST /treinos` exemplo "Válido" | 201; (60/10) × 8 × 1,5 = `carga` 72 |
| 4 | Código duplicado | `POST /treinos` exemplo "Código duplicado" | 409 |
| 5 | Intensidade inválida | `POST /treinos` exemplo "Intensidade 11" | 400 |
| 6 | Duração não positiva | `POST /treinos` exemplo "Duração 0" | 400 |
| 7 | Treino para atleta inexistente | `POST /treinos` exemplo "Jogador inexistente" | 404 |
| 8 | Treino para atleta inativo | `POST /treinos` exemplo "Jogador inativo" | 400 |
| 9 | Duas semanas comparadas | `GET /relatorios/semanal` com `2026-10-05` e `2026-10-14` | indicadores das tabelas acima |
| 10 | Falha sem vazar credenciais | qualquer rota com o MySQL parado | 500 com `erro: "ECONNREFUSED"` |

Para o teste 10, pare o serviço do MySQL ou coloque uma senha errada no `.env`
e reinicie a API. A API continua no ar e responde
`500 { "status": false, "message": "Erro ao consultar jogadores", "erro": "ECONNREFUSED" }`.
Com a senha errada, `erro` vem como `ER_ACCESS_DENIED_ERROR`. A senha nunca
aparece na resposta nem no terminal.

As capturas de tela das requisições ficam em [`docs/prints/`](docs/prints/LEIAME.md).

### Exemplo

```
curl -X POST http://localhost:3000/treinos \
  -H "Content-Type: application/json" \
  -d '{"codigo":"TR100","jogadorId":6,"dataTreino":"2026-10-20 08:00:00","tipo":"F","duracaoMin":60,"intensidade":8}'
```

## Funções assíncronas

| Função | Onde | Sequelize |
| --- | --- | --- |
| `cadastrarJogador()` | `services/JogadorService.js` | `Jogador.create()` |
| `listarJogadores()` | `services/JogadorService.js` | `Jogador.findAll({ where })` |
| `consultarJogador()` | `services/JogadorService.js` | `Jogador.findByPk()` + `include` dos treinos |
| `atualizarJogador()` | `services/JogadorService.js` | `instância.update()` |
| `desativarJogador()` | `services/JogadorService.js` | `instância.update({ ativo: false })` |
| `consultarConfiguracao()` | `services/ConfiguracaoService.js` | `Configuracao.findOne()` |
| `salvarConfiguracao()` | `services/ConfiguracaoService.js` | `Configuracao.create()` ou `instância.update()` |
| `registrarTreino()` | `services/TreinoService.js` | `findOne` (código), `findByPk` (jogador), `Treino.create()` |
| `listarTreinos()` | `services/TreinoService.js` | `Treino.findAll()` com `include` e `where` (`Op.between`) |
| `consultarTreino()` | `services/TreinoService.js` | `Treino.findOne()` com `include` |
| `excluirTreino()` | `services/TreinoService.js` | `findOne()` para verificar se existe e depois `instância.destroy()` |
| `calcularCarga()` | `utils/carga.js` | regra de negócio (função síncrona) |
| `gerarRelatorioSemanal()` | `services/RelatorioService.js` | `count`, `sum`, `fn`/`col`, `group`, `include`, `Op.between` |

### Onde o Sequelize e o async/await foram usados

- **Sequelize**: `models/Banco.js` cria a única instância do Sequelize (dialeto
  `mysql`, credenciais do `.env`). `models/Jogador.js`, `Treino.js` e
  `Configuracao.js` definem os models com `DataTypes` e `validate`, e
  `models/index.js` registra as associações `Jogador.hasMany(Treino)` e
  `Treino.belongsTo(Jogador)`. Todo o acesso a dados está nos `services/` e usa
  só métodos do Sequelize, sem nenhum SQL escrito à mão. As migrations e os
  seeders usam o `queryInterface` do Sequelize CLI.
- **async/await**: todas as funções dos services são `async` e usam `await` nas
  chamadas ao Sequelize, dentro de `try/catch`. Em caso de erro, o service
  registra no terminal e relança (`throw`). Os métodos dos controllers também
  são `async`, aguardam os services e repassam qualquer erro para
  `responderErro()`, que escolhe o status: 400/404/409 para regra de negócio e
  500 para falha de banco. `Servidor.iniciar()` aguarda `Banco.testarConexao()`
  antes de abrir a porta, e o relatório roda as consultas em paralelo com
  `await Promise.all([...])`.

`calcularCarga()` é síncrona, porque só faz conta.

## Estrutura

```
app.js                                 ponto de entrada (carrega o .env)
servidor.js                            configuração do Express, Swagger, rotas e tratamento de erros
routes/jogadorRoutes.js                rotas de /jogadores
routes/treinoRoutes.js                 rotas de /treinos
routes/configuracaoRoutes.js           rotas de /configuracao
routes/relatorioRoutes.js              rota de /relatorios
middlewares/jogadorMiddleware.js       validações de entrada de jogadores
middlewares/treinoMiddleware.js        validações de entrada e filtros de treinos
middlewares/configuracaoMiddleware.js  validação do limite semanal
middlewares/relatorioMiddleware.js     validação da data do relatório
controllers/jogadorController.js       fluxo das requisições de jogadores
controllers/treinoController.js        fluxo das requisições de treinos
controllers/configuracaoController.js  fluxo da configuração
controllers/relatorioController.js     fluxo do relatório
services/JogadorService.js             acesso a jogadores (Sequelize)
services/TreinoService.js              registro com carga, listagens e exclusão de treinos
services/ConfiguracaoService.js        limite de carga semanal
services/RelatorioService.js           agregações do relatório semanal
models/Banco.js                        instância do Sequelize (credenciais do .env)
models/Jogador.js                      model Jogador
models/Treino.js                       model Treino
models/Configuracao.js                 model Configuracao
models/index.js                        inicialização dos models e associações
config/database.js                     configuração do banco (usada pelo Sequelize CLI e pela API)
database/migrations/                   criação das tabelas
database/seeders/                      massa de dados de teste
utils/carga.js                         calcularCarga() e arredondamento
utils/data.js                          validação de datas e cálculo da semana
utils/validacao.js                     funções de apoio dos middlewares
utils/ErroNegocio.js                   erro de regra de negócio com código HTTP
utils/responderErro.js                 resposta de erro padrão dos controllers
scripts/testarApi.js                   testes obrigatórios automatizados (npm run test:api)
docs/swagger.js                        especificação OpenAPI usada em /api-docs
docs/prints/                           capturas de tela das requisições
.sequelizerc                           caminhos usados pelo Sequelize CLI
.env.example                           modelo das variáveis de ambiente
```
