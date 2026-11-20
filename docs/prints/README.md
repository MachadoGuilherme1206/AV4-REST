# Capturas de tela

Evidências das requisições e respostas feitas pelo Swagger
(<http://localhost:3000/api-docs>), com o banco recém-preparado por
`npm run db:reset`. Cada print mostra o exemplo escolhido, a requisição (curl e
URL) e a resposta real da API.

| Arquivo | Requisição | Resultado |
| --- | --- | --- |
| `01-listar-jogadores.png` | GET /jogadores | 200, 8 jogadores nas 4 posições |
| `02-listar-treinos.png` | GET /treinos | 200, 24 treinos com F, T e E |
| `03-configuracao.png` | GET /configuracao | 200, limite 300 |
| `04-registrar-treino-carga.png` | POST /treinos, exemplo do enunciado | 201, carga 72 = (60 / 10) × 8 × 1,5 |
| `05-treino-codigo-duplicado.png` | POST /treinos com o código TR001 | 409 |
| `06-treino-intensidade-invalida.png` | POST /treinos com intensidade 11 | 400 |
| `07-treino-duracao-invalida.png` | POST /treinos com duração 0 | 400 |
| `08-treino-jogador-inexistente.png` | POST /treinos com jogador 999 | 404 |
| `09-treino-jogador-inativo.png` | POST /treinos com jogador 8 | 400 |
| `10-relatorio-semana-1.png` | GET /relatorios/semanal?data=2026-10-05 | 200, Thiago 309,6 em risco, Rafael 298,5 abaixo |
| `11-relatorio-semana-2.png` | GET /relatorios/semanal?data=2026-10-14 | 200, Diego 306 em risco, empate triplo na menor carga |
| `12-desativar-jogador.png` | PATCH /jogadores/7/desativar | 200, histórico mantido |
| `13a-excluir-treino.png` | DELETE /treinos/TR100 | 200 |
| `13b-excluir-treino-inexistente.png` | DELETE /treinos/TR100 de novo | 404 |
| `14-erro-banco.png` | GET /jogadores com a senha do banco errada | 500, `erro: ER_ACCESS_DENIED_ERROR`, sem a senha na resposta |

O print 14 foi feito com uma segunda instância da API (porta 3001) usando uma
senha errada no banco. Com o MySQL parado, a resposta é a mesma, mas com
`erro: ECONNREFUSED`.
