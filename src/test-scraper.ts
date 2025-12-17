/**
 * ТЕСТОВЫЙ СКРИПТ
 * Проверяет работу скраппера на простом примере
 */

import prisma from './lib/prisma';

async function testDatabase() {
  console.log('🧪 ТЕСТ 1: Проверка подключения к БД');
  console.log('=====================================\n');

  try {
    // Пытаемся подключиться к БД
    await prisma.$connect();
    console.log('✅ Подключение к базе данных успешно\n');

    // Проверяем, что таблица существует
    const count = await prisma.catalogLink.count();
    console.log(`📊 Текущее количество каталогов в БД: ${count}\n`);

    // Добавляем тестовые данные
    console.log('🧪 ТЕСТ 2: Добавление тестовых каталогов');
    console.log('=========================================\n');

    const testUrls = [
      'https://example.com/catalog/electronics',
      'https://example.com/catalog/clothing',
      'https://example.com/catalog/books',
    ];

    for (const url of testUrls) {
      try {
        const catalog = await prisma.catalogLink.upsert({
          where: { url },
          update: {},
          create: {
            url,
            scrapped: false,
          },
        });
        console.log(`✅ Добавлен/найден: ${catalog.url}`);
      } catch (error) {
        console.error(`❌ Ошибка при добавлении ${url}:`, error);
      }
    }

    // Получаем все каталоги
    console.log('\n🧪 ТЕСТ 3: Получение списка каталогов');
    console.log('======================================\n');

    const allCatalogs = await prisma.catalogLink.findMany({
      orderBy: { createdAt: 'desc' },
    });

    allCatalogs.forEach((catalog, index) => {
      const status = catalog.scrapped ? '✅ Собран' : '⏳ Ожидает';
      console.log(`${index + 1}. ${status} - ${catalog.url}`);
    });

    // Тест обновления статуса
    console.log('\n🧪 ТЕСТ 4: Обновление статуса каталога');
    console.log('=======================================\n');

    if (allCatalogs.length > 0) {
      const firstCatalog = allCatalogs[0];
      const updated = await prisma.catalogLink.update({
        where: { id: firstCatalog.id },
        data: { scrapped: true },
      });
      console.log(`✅ Обновлен статус для: ${updated.url}`);
      console.log(`   scrapped: ${firstCatalog.scrapped} → ${updated.scrapped}`);
    }

    // Статистика
    console.log('\n🧪 ТЕСТ 5: Статистика');
    console.log('=====================\n');

    const total = await prisma.catalogLink.count();
    const scrapped = await prisma.catalogLink.count({ where: { scrapped: true } });
    const pending = await prisma.catalogLink.count({ where: { scrapped: false } });

    console.log(`Всего: ${total}`);
    console.log(`Собрано: ${scrapped}`);
    console.log(`Ожидает: ${pending}`);

    console.log('\n✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!\n');
  } catch (error) {
    console.error('❌ ОШИБКА ПРИ ТЕСТИРОВАНИИ:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем тесты
testDatabase();

