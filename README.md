# REST API

Production-grade REST API на TypeScript + Express з шаровою архітектурою, валідацією, структурованим логуванням, обробкою помилок та тестами.

## Можливості

- **Шарова архітектура**: `routes → controller → service → repository`
- **Валідація** через Zod (body, params, query) з коерцією типів
- **Уніфіковані помилки** з кодами (`NOT_FOUND`, `CONFLICT`, `UNPROCESSABLE_ENTITY` тощо)
- **Безпека**: `helmet`, `cors`, обмеження тіла запиту, вимкнений `x-powered-by`
- **Логування**: `pino` (структуроване) + `morgan` (HTTP-доступ)
- **Конфігурація** через `dotenv` з валідацією змінних оточення
- **Graceful shutdown** на SIGINT/SIGTERM
- **Пагінація** і пошук у списку (`?page=1&limit=20&search=...`)
- **UUID-ідентифікатори**, поля `createdAt`/`updatedAt`
- **Тести**: Vitest + Supertest (13 тестів, 100% покриття CRUD-флоу)

## Стек

TypeScript • Express 4 • Zod • Pino • Helmet • CORS • Vitest • Supertest • tsx

## Структура

```
src/
├── config/           # env validation, logger
├── middleware/       # validate, error-handler, request-logger
├── modules/users/    # types, schema, repository, service, controller, routes
├── routes/           # API router root
├── utils/            # HttpError, asyncHandler
├── app.ts            # Express app factory
└── server.ts         # entrypoint + graceful shutdown
tests/
└── users.test.ts     # supertest e2e suite
```

## Запуск

```bash
npm install
cp .env.example .env

npm run dev      # tsx watch (hot reload)
npm test         # vitest
npm run build    # компіляція TS → dist/
npm start        # node dist/server.js
```

Сервер: `http://localhost:3000` (базовий префікс — `/api/v1`).

## Endpoints

| Метод  | URL                      | Опис                                    | Статуси            |
|--------|--------------------------|-----------------------------------------|--------------------|
| GET    | `/api/v1/health`         | Health check                            | 200                |
| GET    | `/api/v1/users`          | Список (пагінація + пошук)              | 200, 422           |
| GET    | `/api/v1/users/:id`      | Один користувач                         | 200, 404, 422      |
| POST   | `/api/v1/users`          | Створити                                | 201, 409, 422      |
| PUT    | `/api/v1/users/:id`      | Оновити (часткове)                      | 200, 404, 409, 422 |
| DELETE | `/api/v1/users/:id`      | Видалити                                | 204, 404, 422      |

### Формат відповідей

Успіх:
```json
{ "data": { "id": "uuid", "name": "...", "email": "...", "age": 21, "createdAt": "...", "updatedAt": "..." } }
```

Список:
```json
{ "data": [...], "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 } }
```

Помилка:
```json
{ "error": { "code": "UNPROCESSABLE_ENTITY", "message": "Validation failed", "details": { "email": ["Invalid email"] } } }
```

## Приклади (curl)

```bash
# Створити
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Марта","email":"marta@example.com","age":21}'

# Список з пошуком
curl "http://localhost:3000/api/v1/users?page=1&limit=10&search=marta"

# Оновити
curl -X PUT http://localhost:3000/api/v1/users/<UUID> \
  -H "Content-Type: application/json" -d '{"age":22}'

# Видалити
curl -X DELETE http://localhost:3000/api/v1/users/<UUID>
```

## Змінні оточення

| Назва        | Default        | Опис                                        |
|--------------|----------------|---------------------------------------------|
| `NODE_ENV`   | `development`  | `development` / `production` / `test`       |
| `PORT`       | `3000`         | Порт HTTP-сервера                           |
| `LOG_LEVEL`  | `info`         | `fatal` / `error` / `warn` / `info` / `debug` / `trace` |

## Тести

```bash
npm test           # одноразово
npm run test:watch # у watch-режимі
```

Покривають: успішні CRUD-флоу, валідаційні помилки (422), не знайдено (404), конфлікт email (409), пагінацію, пошук, health, неіснуючі маршрути.
