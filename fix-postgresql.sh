#!/bin/bash

echo "🔧 Исправление настроек PostgreSQL..."
echo ""

# Проверяем что Docker запущен
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker не запущен!"
    echo ""
    echo "Пожалуйста:"
    echo "1. Откройте Docker Desktop"
    echo "2. Подождите пока он запустится"
    echo "3. Запустите этот скрипт снова: ./fix-postgresql.sh"
    exit 1
fi

echo "✅ Docker запущен"
echo ""

# Останавливаем контейнер если он уже есть
docker stop scrapper-postgres 2>/dev/null
docker rm scrapper-postgres 2>/dev/null

# Запускаем PostgreSQL
echo "🐘 Запускаю PostgreSQL..."
docker-compose up -d

# Ждем запуска
echo "⏳ Жду запуска PostgreSQL..."
sleep 5

# Обновляем .env
echo ""
echo "📝 Обновляю .env файл..."
cat > .env << 'EOF'
# PostgreSQL Connection String (Docker)
DATABASE_URL="postgresql://scrapper:password@localhost:5432/scrapper_db"

# Scraper Settings
TARGET_WEBSITE="https://example.com"
REQUEST_TIMEOUT=10000
USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
EOF

echo "✅ .env обновлен"
echo ""

# Удаляем старые миграции SQLite
echo "🗑️  Удаляю старые миграции SQLite..."
rm -rf prisma/migrations
rm -f prisma/dev.db prisma/dev.db-journal

# Создаем новые миграции для PostgreSQL
echo ""
echo "🔄 Создаю миграции для PostgreSQL..."
npx prisma migrate dev --name init

# Тестируем
echo ""
echo "🧪 Тестирую подключение..."
npm test

echo ""
echo "✅ Готово!"
echo ""
echo "📊 Проверьте результат выше. Должно быть:"
echo "   ✅ Подключение к базе данных успешно"
echo "   ✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!"

