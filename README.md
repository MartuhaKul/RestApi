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
npm test            # одноразово
npm run test:watch  # watch-режим
npm run test:coverage  # з покриттям коду
```

Покривають: успішні CRUD-флоу, валідаційні помилки (422), не знайдено (404), конфлікт email (409), пагінацію, пошук, health, неіснуючі маршрути.

---

# Завдання TEST

Цей проєкт також містить три завдання з тестування:

## 1. Code coverage (≥30%)

```bash
npm run test:coverage
```

**Інструменти**: Vitest + `@vitest/coverage-v8`. Конфіг у `vitest.config.ts`, поріг 30% по `lines/functions/branches/statements`. Звіт зберігається в `coverage/index.html`.

**Поточні результати**: **89.33% statements / 88.46% branches / 96.15% functions / 89.33% lines** (13 тестів). Результати по файлах:

| Файл | % Lines |
|------|---------|
| user.controller.ts | 100% |
| user.repository.ts | 100% |
| user.routes.ts | 100% |
| user.schema.ts | 100% |
| user.service.ts | 86.79% |
| validate.ts | 100% |
| http-error.ts | 93.1% |
| async-handler.ts | 100% |

## 2. Performance testing — chained scenario

```bash
# 1) Запустити сервер у одному терміналі
npm run build && npm start

# 2) У іншому — навантажувальний тест
npm run perf
```

**Інструмент**: [Artillery](https://www.artillery.io/). Конфіг у `perf/load-test.yml`, JS-процесор для генерації унікальних даних — `perf/processor.js`.

**Сценарій (output → input ланцюг)**:

1. **POST** `/api/v1/users` — створити користувача → захопити `userId` та `userEmail` з відповіді
2. **GET** `/api/v1/users/{{ userId }}` — прочитати щойно створеного користувача
3. **PUT** `/api/v1/users/{{ userId }}` — оновити age=30
4. **GET** `/api/v1/users?search={{ userEmail }}` — знайти його через пошук
5. **DELETE** `/api/v1/users/{{ userId }}` — видалити
6. **GET** `/api/v1/users/{{ userId }}` — підтвердити 404

**Фази навантаження**: warm-up (10s @ 5 req/s) → ramp-up (30s до 50 req/s) → sustained (20s @ 50 req/s).

**Останні результати** (60s):
- 11,610 запитів, **0 фейлів**
- 219 req/sec
- p95: **1ms**, p99: **5ms**, max: 475ms
- Розподіл статусів: 5904×200, 1902×201, 1902×204, 1902×404 (всі очікувані)

JSON-звіт: `perf/report.json`.

## 3. Web scraping з Selenium

```bash
npm run scrape
```

**Інструмент**: `selenium-webdriver` (Chrome у headless режимі). Скрипт у `scraper/scrape.ts`.

**Сценарій**:
1. Відкрити https://quotes.toscrape.com/login
2. **Заповнити форму авторизації** (username/password) і сабмітнути
3. Перевірити, що залогінилися (поява лінку `Logout`)
4. Переходити по сторінках `/page/N/` (до 5)
5. Зі сторінки витягати: текст цитати, автора, теги, лінк `(about)` (видимий лише авторизованим користувачам)
6. Зберегти у `scraper/scraped-data.json`

**Останні результати**:
- 5 сторінок відвідано
- **50 цитат** виявлено
- 28 унікальних авторів
- 79 унікальних тегів
- Авторизація успішна (поле `authenticated: true`)

Структура збереженого JSON:
```json
{
  "scrapedAt": "2026-05-06T...",
  "source": "https://quotes.toscrape.com",
  "authenticated": true,
  "pagesVisited": 5,
  "totalQuotes": 50,
  "uniqueAuthors": [...],
  "uniqueTags": [...],
  "quotes": [{ "text", "author", "tags", "authorAboutHref" }]
}
```

**Примітка**: ChromeDriver автоматично завантажується через Selenium Manager (вбудований у `selenium-webdriver` 4.6+) — потрібен лише встановлений Chrome.
