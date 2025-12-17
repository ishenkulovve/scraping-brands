import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';
import prisma from '../lib/prisma';

// Добавляем stealth плагин для обхода детектирования ботов
puppeteer.use(StealthPlugin());

/**
 * Класс для скраппинга ссылок на каталоги
 */
class CatalogScraper {
	private baseUrl: string;
	private brand: string;
	private browser: Browser | null = null;

	constructor(baseUrl: string, brand: string = 'adidas') {
		this.baseUrl = baseUrl;
		this.brand = brand;
	}

	/**
	 * Запустить браузер
	 */
	private async launchBrowser(): Promise<Browser> {
		if (!this.browser) {
			this.browser = await puppeteer.launch({
				headless: true,
				args: [
					'--no-sandbox',
					'--disable-setuid-sandbox',
					'--disable-blink-features=AutomationControlled',
					'--disable-web-security',
				],
			});
		}
		return this.browser;
	}

	/**
	 * Закрыть браузер
	 */
	async closeBrowser(): Promise<void> {
		if (this.browser) {
			await this.browser.close();
			this.browser = null;
		}
	}

	/**
	 * Получить HTML страницы с помощью Puppeteer
	 */
	private async fetchPage(url: string): Promise<string> {
		let page: Page | null = null;
		try {
			const browser = await this.launchBrowser();
			page = await browser.newPage();

			// Устанавливаем User-Agent
			await page.setUserAgent(
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
			);

			console.log(`🌐 Загружаю страницу: ${url}`);
			await page.goto(url, {
				waitUntil: 'networkidle2',
				timeout: 30000,
			});

			// Ждем немного, чтобы JavaScript отрендерился
			await new Promise(resolve => setTimeout(resolve, 2000));

			const html = await page.content();
			await page.close();

			return html;
		} catch (error) {
			if (page) await page.close();
			console.error(`❌ Ошибка при загрузке ${url}:`, error);
			throw error;
		}
	}

	/**
	 * Извлечь ссылки на каталоги из страницы с помощью Puppeteer
	 */
	private async extractCatalogLinks(
		url: string
	): Promise<Array<{ url: string; isSale: boolean }>> {
		let page: Page | null = null;
		try {
			const browser = await this.launchBrowser();
			page = await browser.newPage();

			await page.setUserAgent(
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
			);

			console.log(`🔍 Анализирую ссылки на странице: ${url}`);
			await page.goto(url, {
				waitUntil: 'domcontentloaded',
				timeout: 60000,
			});

			// Ждем загрузки контента
			await new Promise(resolve => setTimeout(resolve, 5000));

			// Извлекаем все ссылки на категории товаров
			const links = await page.evaluate(() => {
				const anchors = Array.from(document.querySelectorAll('a'));
				const catalogLinks: Array<{ url: string; isSale: boolean }> = [];

				anchors.forEach(anchor => {
					const href = anchor.href;
					if (
						href &&
						// Ссылки на мужские товары
						(href.includes('/men-') ||
							href.includes('/men/') ||
							// Ссылки на женские товары
							href.includes('/women-') ||
							href.includes('/women/') ||
							// Ссылки на детские товары
							href.includes('/kids-') ||
							href.includes('/kids/') ||
							// Ссылки на распродажу
							href.includes('/sale/') ||
							href.includes('-sale-') ||
							// Ссылки на обувь
							href.includes('/shoes') ||
							href.includes('/sneakers') ||
							// Ссылки на одежду
							href.includes('/clothing') ||
							href.includes('/apparel'))
					) {
						// Фильтруем только те ссылки, которые ведут на каталоги, а не на отдельные товары
						if (
							!href.includes('.html') &&
							!href.match(/\/[A-Z0-9]{6,}\.html$/i)
						) {
							// Проверяем, является ли это ссылкой на распродажу
							const isSale =
								href.includes('sale') ||
								href.includes('Sale') ||
								href.includes('outlet') ||
								href.includes('Outlet');

							catalogLinks.push({ url: href, isSale });
						}
					}
				});

				return catalogLinks;
			});

			await page.close();

			// Удаляем дубликаты по URL
			const uniqueLinks = Array.from(
				new Map(links.map(item => [item.url, item])).values()
			);
			return uniqueLinks;
		} catch (error) {
			if (page) await page.close();
			console.error(`❌ Ошибка при извлечении ссылок:`, error);
			throw error;
		}
	}

	/**
	 * Сохранить ссылки на каталоги в базу данных
	 */
	private async saveCatalogLinks(
		links: Array<{ url: string; isSale: boolean }>
	): Promise<void> {
		let addedCount = 0;
		let skippedCount = 0;
		let saleCount = 0;

		for (const { url, isSale } of links) {
			try {
				// Проверяем, существует ли уже такая ссылка
				const existing = await prisma.catalogLink.findUnique({
					where: { url },
				});

				if (!existing) {
					await prisma.catalogLink.create({
						data: {
							url,
							brand: this.brand,
							scrapped: false,
							isSale,
						},
					});
					addedCount++;
					if (isSale) {
						saleCount++;
						console.log(
							`✅ Добавлена ссылка 🔥 [SALE] [${this.brand.toUpperCase()}]: ${url}`
						);
					} else {
						console.log(
							`✅ Добавлена ссылка [${this.brand.toUpperCase()}]: ${url}`
						);
					}
				} else {
					skippedCount++;
					console.log(`⏭️  Пропущена (уже существует): ${url}`);
				}
			} catch (error) {
				console.error(`❌ Ошибка при сохранении ${url}:`, error);
			}
		}

		console.log(
			`\n📊 Итого: добавлено ${addedCount} (из них распродаж: ${saleCount} 🔥), пропущено ${skippedCount}`
		);
	}

	/**
	 * Запустить скраппинг каталогов
	 */
	async scrapeCatalogs(startUrl?: string): Promise<void> {
		const url = startUrl || this.baseUrl;

		console.log(`🚀 Начинаю скраппинг каталогов с ${url}...`);

		try {
			// Извлекаем ссылки на каталоги (Puppeteer уже загрузит страницу внутри)
			const catalogLinks = await this.extractCatalogLinks(url);
			console.log(`\n📦 Найдено ссылок на каталоги: ${catalogLinks.length}`);

			if (catalogLinks.length === 0) {
				console.log(
					'⚠️  Ссылки не найдены. Проверьте селекторы в extractCatalogLinks()'
				);
				await this.closeBrowser();
				return;
			}

			// Выводим первые 10 найденных ссылок для проверки
			console.log('\n🔗 Примеры найденных ссылок:');
			catalogLinks.slice(0, 10).forEach((link, index) => {
				const saleTag = link.isSale ? ' 🔥 [SALE]' : '';
				console.log(`   ${index + 1}. ${link.url}${saleTag}`);
			});

			// Сохраняем в базу данных
			await this.saveCatalogLinks(catalogLinks);

			// Закрываем браузер
			await this.closeBrowser();

			console.log('\n✅ Скраппинг завершен!');
		} catch (error) {
			console.error('❌ Ошибка при скраппинге:', error);
			await this.closeBrowser();
			throw error;
		}
	}

	/**
	 * Получить статистику из базы данных
	 */
	async getStats(): Promise<void> {
		const total = await prisma.catalogLink.count();
		const scrapped = await prisma.catalogLink.count({
			where: { scrapped: true },
		});
		const pending = await prisma.catalogLink.count({
			where: { scrapped: false },
		});
		const sales = await prisma.catalogLink.count({
			where: { isSale: true },
		});

		// Получаем статистику по брендам
		const brands = await prisma.catalogLink.groupBy({
			by: ['brand'],
			_count: true,
		});

		console.log('\n📊 Статистика каталогов:');
		console.log(`   Всего: ${total}`);
		console.log(`   Распродаж: ${sales} 🔥`);
		console.log(`   Собрано: ${scrapped}`);
		console.log(`   Ожидает: ${pending}`);

		if (brands.length > 0) {
			console.log('\n🏷️  По брендам:');
			brands.forEach(brand => {
				console.log(`   - ${brand.brand}: ${brand._count}`);
			});
		}
	}
}

export default CatalogScraper;
