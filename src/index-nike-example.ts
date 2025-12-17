import CatalogScraper from './scrapers/catalogScraper';
import prisma from './lib/prisma';

/**
 * Пример скраппинга для Nike
 * Для запуска: npx tsx src/index-nike-example.ts
 */
async function main() {
	try {
		const TARGET_WEBSITE = 'https://www.nike.com';
		const BRAND_NAME = 'nike';

		console.log('🎯 Скраппер каталогов запущен!');
		console.log(`📍 Бренд: ${BRAND_NAME.toUpperCase()}`);
		console.log('================================\n');

		// Создаем экземпляр скраппера для Nike
		const scraper = new CatalogScraper(TARGET_WEBSITE, BRAND_NAME);

		// Показываем текущую статистику
		await scraper.getStats();

		// Запускаем скраппинг
		console.log('\n🔍 Начинаю поиск ссылок на каталоги...\n');
		await scraper.scrapeCatalogs();

		// Показываем обновленную статистику
		await scraper.getStats();

		console.log('\n✅ Готово!');
	} catch (error) {
		console.error('❌ Критическая ошибка:', error);
		process.exit(1);
	} finally {
		// Закрываем соединение с БД
		await prisma.$disconnect();
	}
}

// Запускаем
main();
