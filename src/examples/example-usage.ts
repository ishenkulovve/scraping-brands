/**
 * ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ СКРАППЕРА
 * 
 * Этот файл показывает различные способы использования CatalogScraper
 */

import CatalogScraper from '../scrapers/catalogScraper';
import prisma from '../lib/prisma';

// ============================================
// ПРИМЕР 1: Базовое использование
// ============================================
async function example1_basic() {
  const scraper = new CatalogScraper('https://example.com');
  
  // Скраппим главную страницу
  await scraper.scrapeCatalogs();
  
  // Показываем статистику
  await scraper.getStats();
}

// ============================================
// ПРИМЕР 2: Скраппинг конкретной страницы
// ============================================
async function example2_specificPage() {
  const scraper = new CatalogScraper('https://example.com');
  
  // Скраппим конкретную страницу
  await scraper.scrapeCatalogs('https://example.com/categories');
}

// ============================================
// ПРИМЕР 3: Получение несобранных каталогов
// ============================================
async function example3_getPendingCatalogs() {
  // Получаем все несобранные каталоги
  const pendingCatalogs = await prisma.catalogLink.findMany({
    where: { scrapped: false },
    take: 10, // Берем первые 10
  });

  console.log('📋 Несобранные каталоги:');
  pendingCatalogs.forEach((catalog, index) => {
    console.log(`${index + 1}. ${catalog.url}`);
  });
}

// ============================================
// ПРИМЕР 4: Обновление статуса каталога
// ============================================
async function example4_updateCatalogStatus() {
  const catalogUrl = 'https://example.com/catalog/electronics';
  
  // Обновляем статус на "собрано"
  await prisma.catalogLink.update({
    where: { url: catalogUrl },
    data: { scrapped: true },
  });

  console.log(`✅ Каталог ${catalogUrl} отмечен как собранный`);
}

// ============================================
// ПРИМЕР 5: Добавление каталогов вручную
// ============================================
async function example5_manualAdd() {
  const catalogUrls = [
    'https://example.com/catalog/electronics',
    'https://example.com/catalog/clothing',
    'https://example.com/catalog/home',
  ];

  for (const url of catalogUrls) {
    await prisma.catalogLink.upsert({
      where: { url },
      update: {}, // Ничего не обновляем, если существует
      create: {
        url,
        scrapped: false,
      },
    });
  }

  console.log(`✅ Добавлено ${catalogUrls.length} каталогов`);
}

// ============================================
// ПРИМЕР 6: Полная статистика
// ============================================
async function example6_fullStats() {
  const total = await prisma.catalogLink.count();
  const scrapped = await prisma.catalogLink.count({ where: { scrapped: true } });
  const pending = await prisma.catalogLink.count({ where: { scrapped: false } });

  const latestCatalogs = await prisma.catalogLink.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  console.log('\n📊 ПОЛНАЯ СТАТИСТИКА');
  console.log('==================');
  console.log(`Всего каталогов: ${total}`);
  console.log(`Собрано: ${scrapped} (${total > 0 ? Math.round((scrapped / total) * 100) : 0}%)`);
  console.log(`Ожидает: ${pending}`);
  console.log('\n🕒 Последние добавленные:');
  latestCatalogs.forEach((catalog, index) => {
    const status = catalog.scrapped ? '✅' : '⏳';
    console.log(`${index + 1}. ${status} ${catalog.url}`);
  });
}

// ============================================
// ПРИМЕР 7: Очистка базы данных
// ============================================
async function example7_cleanup() {
  // ВНИМАНИЕ: Это удалит все каталоги из БД!
  const deleted = await prisma.catalogLink.deleteMany({});
  console.log(`🗑️  Удалено каталогов: ${deleted.count}`);
}

// Экспортируем примеры
export {
  example1_basic,
  example2_specificPage,
  example3_getPendingCatalogs,
  example4_updateCatalogStatus,
  example5_manualAdd,
  example6_fullStats,
  example7_cleanup,
};

