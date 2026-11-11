# jwt-api — Sistema de Biblioteca (back-end)

API REST em Node.js + Express 5 + Sequelize + SQLite com autenticação JWT (access token + refresh token com rotação).

## Instalação

```bash
npm install
cp .envex .env     # Windows: copy .envex .env
npm start          # http://localhost:3000
```

Variáveis do `.env` (modelo em `.envex`):

| Variável | Para quê |
|---|---|
| `JWT_SECRET` | assina o access token |
| `JWT_REFRESH_SECRET` | assina o refresh token (use valor diferente) |
| `ACCESS_TOKEN_EXPIRES_IN` | validade do access token (padrão `15m`; use `30s` para demonstrar o refresh no vídeo) |
| `PORT` | porta da API (padrão 3000) |
| `CORS_ORIGIN` | origens permitidas, separadas por vírgula (padrão `http://localhost:3001`, o front) |
| `ADMIN_*` | dados do admin criado pelo seed |

> Se você já tinha um `database.sqlite` da versão anterior, apague-o: a tabela de usuários ganhou a coluna `active`.

**Admin do seed** (criado no primeiro start se não houver nenhum admin): `admin@biblioteca.com` / `123456`.

Testes das regras puras (prazo, multa, CPF, ISBN): `npm run test:rules`.
Coleção Postman/Insomnia: `biblioteca.postman_collection.json` (o login e o refresh salvam os tokens nas variáveis da coleção).

## Estrutura

```
auth/ user/ category/ author/ book/ reader/ loan/ report/   router → controller → service → model
models/index.js    associações (hasMany, belongsTo, belongsToMany)
config/            db.js e seed.js
utils/             erros HTTP, validações, handler global de erros
```

Associações: Categoria 1:N Livro · Livro N:N Autor (`BookAuthor`) · Leitor 1:N Empréstimo · Livro 1:N Empréstimo · User 1:N Empréstimo · User 1:N RefreshToken.

## Autenticação

1. `POST /v1/auth/login` → `{ accessToken, refreshToken, user }`. Access: 15 min, payload `id, name, email, isAdmin`. Refresh: JWT de 7 dias assinado com `JWT_REFRESH_SECRET`.
2. Rotas protegidas: `Authorization: Bearer <accessToken>`. Token ausente, inválido ou expirado → **401** (com `code` `TOKEN_EXPIRED`/`INVALID_TOKEN`). Atendente em rota de admin → **403**.
3. `POST /v1/auth/refresh { refreshToken }` → novo par; o refresh usado é **revogado** (rotação).
4. Reuso de um refresh já revogado → revoga **todos** os refresh tokens do usuário (suspeita de roubo) e responde 401.
5. `POST /v1/auth/logout { refreshToken }` revoga o refresh (idempotente). `GET /v1/auth/me` devolve o usuário logado.

### Decisões

- **Refresh no banco só como hash SHA-256**: se o banco vazar, os tokens não servem para nada.
- **`logout_list` removida**: o access token vive só 15 min e o logout revoga o refresh, então a blacklist de access tokens deixou de ser necessária (o preço: após o logout o access atual ainda vale até expirar, no máximo 15 min).
- **O middleware consulta o usuário no banco a cada requisição**, então desativar um atendente ou mudar seu perfil vale imediatamente (e desativar também revoga seus refresh tokens).
- Senha nunca é devolvida (`defaultScope` do model `User`).
- `POST /v1/user` agora é só para administrador; o primeiro admin vem do seed.

## Regras de negócio (empréstimos)

- Prazo de 7 dias; máximo de 3 empréstimos em aberto por leitor; leitor com atraso não retira livros (409).
- Estoque: decremento condicional (`availableCopies > 0`) dentro de `db.transaction`; a devolução incrementa na mesma transação.
- Multa de R$ 1,00 por dia de atraso (dia iniciado conta como dia), gravada em `fine` na devolução. Empréstimos atrasados em aberto mostram `currentFine`.
- `status` no banco é `ATIVO`/`DEVOLVIDO`; `ATRASADO` é calculado na resposta (`returnDate` nulo e `dueDate` no passado).
- Excluir categoria/autor com livros, ou livro com empréstimos (ativos ou histórico), retorna **409** com mensagem clara. Atendente desativado não loga (403).

## Endpoints

Todos exigem access token, exceto login/refresh/logout. **(A)** = só administrador.

| Método | Rota |
|---|---|
| POST | `/v1/auth/login`, `/v1/auth/refresh`, `/v1/auth/logout` |
| GET | `/v1/auth/me` |
| GET, POST · GET `/:id` · PUT/PATCH `/:id` · PATCH `/:id/active` | `/v1/user` **(A)** |
| GET, GET `/:id` · POST, PUT, DELETE **(A)** | `/v1/categories`, `/v1/authors`, `/v1/books` |
| GET `/v1/books?title=&categoryId=&authorId=&available=true` | busca com filtros |
| GET, POST, GET `/:id`, PUT `/:id`, GET `/:id/loans` | `/v1/readers` (`?name=&cpf=`) |
| POST `/v1/loans` `{ bookId, readerId }` · PATCH `/v1/loans/:id/return` · GET `/v1/loans?status=` | empréstimos |
| GET `/v1/reports/dashboard` **(A)** | totais |

Erros: `{ "error": "mensagem" }` com 400 (validação), 401, 403, 404, 409 (conflito/regra de negócio).
