import puppeteer, { Browser, Page } from 'puppeteer';
import { Quote, Average, Slippage } from '../types';
import { scrapeWiseWithRetry } from '../data-sources/wise';
import { scrapeNubankWithRetry } from '../data-sources/nubank';

export class QuotesService {
  private browser: Browser | null = null;
//   private cachedQuotes: Quote[] | null = null;
//   private cacheTimestamp: number | null = null;
//   private readonly CACHE_DURATION_MS = 60000;

  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
    }
    return this.browser;
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

//   private isCacheValid(): boolean {
//     if (!this.cachedQuotes || !this.cacheTimestamp) {
//       return false;
//     }

//     const now = Date.now();
//     const cacheAge = now - this.cacheTimestamp;
//     const isValid = cacheAge < this.CACHE_DURATION_MS;

//     if (isValid) {
//       console.log(`[Service] Cache is valid (${Math.round(cacheAge / 1000)}s old)`);
//     } else {
//       console.log(`[Service] Cache expired (${Math.round(cacheAge / 1000)}s old)`);
//     }

//     return isValid;
//   }

  private async scrapeFreshQuotes(): Promise<Quote[]> {
    const browser = await this.initBrowser();
    const quotes: Quote[] = [];
    const errors: { source: string; error: string }[] = [];

    try {
      try {
        console.log('[Service] Creating page for Wise...');
        const wisePage = await browser.newPage();
        const wiseQuote = await scrapeWiseWithRetry(wisePage);
        quotes.push(wiseQuote);
        console.log('[Service] ✓ Wise scraped successfully');
        await wisePage.close();
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Service] ✗ Wise scraping failed:', errorMsg);
        errors.push({ source: 'Wise', error: errorMsg });
      }

      try {
        console.log('[Service] Creating page for Nubank...');
        const nubankPage = await browser.newPage();
        const nubankQuote = await scrapeNubankWithRetry(nubankPage);
        quotes.push(nubankQuote);
        console.log('[Service] ✓ Nubank scraped successfully');
        await nubankPage.close();  
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Service] ✗ Nubank scraping failed:', errorMsg);
        errors.push({ source: 'Nubank', error: errorMsg });
      }

      if (quotes.length === 0) {
        throw new Error(`All scrapers failed: ${JSON.stringify(errors)}`);
      }

      if (errors.length > 0) {
        console.warn(`[Service] Completed with ${errors.length} error(s):`, errors);
      }
      
      // Update cache
      // this.cachedQuotes = quotes;
      // this.cacheTimestamp = Date.now();

      return quotes;

    } catch (error) {
      console.error('[Service] Error during scraping:', error);
      throw new Error(`Failed to scrape quotes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getQuotes(): Promise<Quote[]> {

    // if (this.isCacheValid() && this.cachedQuotes) {
    //   console.log('[Service] Returning cached quotes');
    //   return this.cachedQuotes;
    // }

    const quotes = await this.scrapeFreshQuotes();

    // Update cache
    // this.cachedQuotes = quotes;
    // this.cacheTimestamp = Date.now();
    // console.log('[Service] Cache updated');

    return quotes;
  }

  calculateAverage(quotes: Quote[]): Average {

    if (quotes.length === 0) {
      throw new Error('Cannot calculate average: no quotes available');
    }

    const totalBuy = quotes.reduce((sum, quote) => sum + quote.buy_price, 0);
    const totalSell = quotes.reduce((sum, quote) => sum + quote.sell_price, 0);

    const average: Average = {
      average_buy_price: parseFloat((totalBuy / quotes.length).toFixed(4)),
      average_sell_price: parseFloat((totalSell / quotes.length).toFixed(4)),
      timestamp: new Date().toISOString(),
      sources_count: quotes.length,
      additional_info: {
        calculation_method: 'arithmetic_mean',
        sources: quotes.map(q => q.source)
      }
    };

    return average;
  }

  calculateSlippage(quotes: Quote[], average: Average): Slippage[] {

    const slippages: Slippage[] = quotes.map(quote => {
      const buySlippage = ((quote.buy_price - average.average_buy_price) / average.average_buy_price) * 100;
      const sellSlippage = ((quote.sell_price - average.average_sell_price) / average.average_sell_price) * 100;

      const slippage: Slippage = {
        buy_price_slippage: parseFloat(buySlippage.toFixed(2)),
        sell_price_slippage: parseFloat(sellSlippage.toFixed(2)),
        source: quote.source,
        timestamp: new Date().toISOString(),
        additional_info: {
          quote_buy_price: quote.buy_price,
          quote_sell_price: quote.sell_price,
          average_buy_price: average.average_buy_price,
          average_sell_price: average.average_sell_price,
          provider: quote.additional_info?.provider || 'Unknown'
        }
      };

      return slippage;
    });

    return slippages;
  }

  async getAverage(): Promise<Average> {
    const quotes = await this.getQuotes();
    return this.calculateAverage(quotes);
  }

  async getSlippage(): Promise<Slippage[]> {
    const quotes = await this.getQuotes();
    const average = this.calculateAverage(quotes);
    return this.calculateSlippage(quotes, average);
  }

//   clearCache(): void {
//     console.log('[Service] Clearing cache');
//     this.cachedQuotes = null;
//     this.cacheTimestamp = null;
//   }

//   getCacheStatus(): {
//     hasCache: boolean;
//     cacheAge: number | null;
//     isValid: boolean;
//   } {
//     const hasCache = this.cachedQuotes !== null;
//     const cacheAge = this.cacheTimestamp ? Date.now() - this.cacheTimestamp : null;
//     const isValid = this.isCacheValid();

//     return { hasCache, cacheAge, isValid };
//   }
}

export const quotesService = new QuotesService();