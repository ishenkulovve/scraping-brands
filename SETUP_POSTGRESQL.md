# 🐘 Настройка PostgreSQL

## Шаг 1: Установка PostgreSQL

### macOS (через Homebrew)
```bash
brew install postgresql@16
brew services start postgresql@16
```

### Или используйте Postgres.app
Скачайте с https://postgresapp.com/

### Docker (рекомендуется для разработки)
```bash
docker run --name scrapper-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_USER=scrapper \
  -e POSTGRES_DB=scrapper_db \
  -p 5432:5432 \
  -d postgres:16-alpine
```

## Шаг 2: Создание базы данных

### Если PostgreSQL установлен локально:
```bash
# Подключитесь к PostgreSQL
psql postgres

# Создайте пользователя
CREATE USER scrapper WITH PASSWORD 'your_password';

# Создайте базу данных
CREATE DATABASE scrapper_db OWNER scrapper;

# Дайте права
GRANT ALL PRIVILEGES ON DATABASE scrapper_db TO scrapper;

# Выйдите
\q
```

### Если используете Docker:
База уже создана автоматически!

## Шаг 3: Настройка .env

Создайте или обновите файл `.env` в корне проекта:

```env
# PostgreSQL Connection String
DATABASE_URL="postgresql://scrapper:your_password@localhost:5432/scrapper_db"

# Для Docker используйте:
# DATABASE_URL="postgresql://scrapper:password@localhost:5432/scrapper_db"

# Scraper Settings
TARGET_WEBSITE="https://example.com"
REQUEST_TIMEOUT=10000
USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
```

### Формат PostgreSQL Connection String:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

Примеры:
- Локальный: `postgresql://scrapper:password123@localhost:5432/scrapper_db`
- Docker: `postgresql://scrapper:password@localhost:5432/scrapper_db`
- Облачный (Render/Supabase): `postgresql://user:pass@host.com:5432/db?sslmode=require`

## Шаг 4: Применение миграций

```bash
# Удалите старые миграции SQLite
rm -rf prisma/migrations

# Создайте новые миграции для PostgreSQL
npx prisma migrate dev --name init

# Сгенерируйте Prisma Client
npx prisma generate
```

## Шаг 5: Тестирование

```bash
# Запустите тест
npx tsx src/test-scraper.ts
```

Вы должны увидеть:
```
✅ Подключение к базе данных успешно
✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!
```

## 🎯 Готово!

Теперь ваш проект использует PostgreSQL вместо SQLite.

## 🛠 Дополнительные команды PostgreSQL

### Подключение к БД
```bash
psql postgresql://scrapper:password@localhost:5432/scrapper_db
```

### Полезные SQL команды
```sql
-- Список таблиц
\dt

-- Описание таблицы
\d "CatalogLink"

-- Просмотр данных
SELECT * FROM "CatalogLink";

-- Количество записей
SELECT COUNT(*) FROM "CatalogLink";

-- Очистка таблицы
TRUNCATE TABLE "CatalogLink";
```

## 🐳 Docker Compose (опционально)

Создайте `docker-compose.yml` для удобного запуска:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: scrapper-postgres
    environment:
      POSTGRES_USER: scrapper
      POSTGRES_PASSWORD: password
      POSTGRES_DB: scrapper_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U scrapper"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

Запуск:
```bash
docker-compose up -d
```

Остановка:
```bash
docker-compose down
```

## 🌐 Облачные решения PostgreSQL

### 1. Supabase (бесплатный tier)
- https://supabase.com/
- 500MB бесплатно
- Автоматические бэкапы

### 2. Render (бесплатный tier)
- https://render.com/
- PostgreSQL в облаке
- Простая настройка

### 3. Railway
- https://railway.app/
- $5 бесплатного кредита
- Очень простой деплой

### 4. Neon (serverless PostgreSQL)
- https://neon.tech/
- 3GB бесплатно
- Автомасштабирование

## ⚙️ Переменные окружения для продакшена

```env
# Production
DATABASE_URL="postgresql://user:pass@prod-host.com:5432/db?sslmode=require"
NODE_ENV="production"

# Development
# DATABASE_URL="postgresql://scrapper:password@localhost:5432/scrapper_db"
# NODE_ENV="development"
```

## 🔒 Безопасность

1. **Не коммитьте .env в Git** (уже в .gitignore)
2. **Используйте сильные пароли** в продакшене
3. **Включайте SSL** для облачных БД (`sslmode=require`)
4. **Ограничьте доступ** по IP в настройках PostgreSQL

## 📊 Преимущества PostgreSQL над SQLite

✅ **Производительность**: Лучше для больших объемов данных  
✅ **Конкурентность**: Множество одновременных подключений  
✅ **Типы данных**: JSON, массивы, full-text search  
✅ **Масштабирование**: Легко масштабируется  
✅ **Бэкапы**: Продвинутые инструменты для резервного копирования  
✅ **Продакшен**: Готово для боевого окружения  

## ❓ Проблемы и решения

### Ошибка: "password authentication failed"
Проверьте пароль в DATABASE_URL

### Ошибка: "database does not exist"
Создайте базу данных: `createdb scrapper_db`

### Ошибка: "connection refused"
Убедитесь что PostgreSQL запущен:
```bash
brew services list  # macOS
docker ps           # Docker
```

### Ошибка при миграции
```bash
# Сбросьте базу и пересоздайте
npx prisma migrate reset
npx prisma migrate dev --name init
```

