#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   PostgreSQL Setup для Scrapper          ║${NC}"
echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo ""

# Проверяем наличие Docker
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker найден"
    
    echo ""
    echo -e "${YELLOW}Выберите способ установки:${NC}"
    echo "1) Docker (рекомендуется для разработки)"
    echo "2) Локальный PostgreSQL (уже установлен)"
    echo "3) Облачный PostgreSQL (Supabase/Render)"
    read -p "Выбор [1-3]: " choice
    
    case $choice in
        1)
            echo ""
            echo -e "${BLUE}Запускаю PostgreSQL через Docker...${NC}"
            docker-compose up -d postgres
            
            echo ""
            echo -e "${GREEN}✓${NC} PostgreSQL запущен!"
            echo ""
            echo -e "${YELLOW}Настройте .env файл:${NC}"
            echo ""
            
            if [ ! -f .env ]; then
                cat > .env << 'EOF'
# PostgreSQL Connection String (Docker)
DATABASE_URL="postgresql://scrapper:password@localhost:5432/scrapper_db"

# Scraper Settings
TARGET_WEBSITE="https://example.com"
REQUEST_TIMEOUT=10000
USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
EOF
                echo -e "${GREEN}✓${NC} Создан .env файл с настройками для Docker"
            else
                echo -e "${YELLOW}⚠${NC}  .env уже существует. Добавьте туда:"
                echo 'DATABASE_URL="postgresql://scrapper:password@localhost:5432/scrapper_db"'
            fi
            
            echo ""
            echo -e "${BLUE}Ожидание запуска PostgreSQL...${NC}"
            sleep 5
            
            echo ""
            echo -e "${BLUE}Удаляю старые миграции SQLite...${NC}"
            rm -rf prisma/migrations
            
            echo ""
            echo -e "${BLUE}Создаю новые миграции для PostgreSQL...${NC}"
            npx prisma migrate dev --name init
            
            echo ""
            echo -e "${GREEN}✓${NC} Миграции применены!"
            echo ""
            echo -e "${BLUE}Тестирую подключение...${NC}"
            npx tsx src/test-scraper.ts
            ;;
            
        2)
            echo ""
            echo -e "${YELLOW}Инструкция для локального PostgreSQL:${NC}"
            echo ""
            echo "1. Создайте пользователя и базу данных:"
            echo -e "${BLUE}   psql postgres${NC}"
            echo -e "${BLUE}   CREATE USER scrapper WITH PASSWORD 'your_password';${NC}"
            echo -e "${BLUE}   CREATE DATABASE scrapper_db OWNER scrapper;${NC}"
            echo -e "${BLUE}   GRANT ALL PRIVILEGES ON DATABASE scrapper_db TO scrapper;${NC}"
            echo ""
            echo "2. Создайте/обновите .env:"
            echo -e "${BLUE}   DATABASE_URL=\"postgresql://scrapper:your_password@localhost:5432/scrapper_db\"${NC}"
            echo ""
            echo "3. Примените миграции:"
            echo -e "${BLUE}   rm -rf prisma/migrations${NC}"
            echo -e "${BLUE}   npx prisma migrate dev --name init${NC}"
            ;;
            
        3)
            echo ""
            echo -e "${YELLOW}Для облачного PostgreSQL:${NC}"
            echo ""
            echo "1. Создайте базу данных на одном из сервисов:"
            echo "   • Supabase: https://supabase.com/"
            echo "   • Render: https://render.com/"
            echo "   • Railway: https://railway.app/"
            echo "   • Neon: https://neon.tech/"
            echo ""
            echo "2. Скопируйте Connection String из панели управления"
            echo ""
            echo "3. Добавьте в .env:"
            echo -e "${BLUE}   DATABASE_URL=\"postgresql://user:pass@host.com:5432/db?sslmode=require\"${NC}"
            echo ""
            echo "4. Примените миграции:"
            echo -e "${BLUE}   rm -rf prisma/migrations${NC}"
            echo -e "${BLUE}   npx prisma migrate dev --name init${NC}"
            ;;
    esac
    
else
    echo -e "${RED}✗${NC} Docker не найден"
    echo ""
    echo -e "${YELLOW}Установите Docker:${NC} https://www.docker.com/get-started"
    echo -e "${YELLOW}Или следуйте инструкциям в:${NC} SETUP_POSTGRESQL.md"
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Настройка завершена!                   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Полная документация:${NC} SETUP_POSTGRESQL.md"
echo ""

