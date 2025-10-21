// src/scrapers/nubank.ts
import { Page } from 'puppeteer';
import { Quote } from '../types';

export async function scrapeNubank(page: Page): Promise<Quote> {
  const SOURCE_URL = 'https://nubank.com.br/dados-abertos/taxas-conversao';
  
  try {
    console.log('[Nubank] Starting scrape...');
    
    await page.goto(SOURCE_URL, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('[Nubank] Page loaded, waiting for table...');

    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    console.log('[Nubank] Table found, extracting rate...');

    // Extract the conversion rate from the first row (most recent date)
    const rateData = await page.evaluate(() => {
      const firstRow = document.querySelector('table tbody tr');
      if (!firstRow) {
        throw new Error('Table row not found');
      }

      // Get the date from first cell
      const dateCell = firstRow.querySelectorAll('td')[0];
      const dateText = dateCell?.textContent?.trim() || 'Unknown date';

      // Get the second cell (Taxa USD/BRL column)
      const rateCell = firstRow.querySelectorAll('td')[1];
      if (!rateCell) {
        throw new Error('Rate cell not found');
      }

      const rateText = rateCell.textContent?.trim();
      if (!rateText) {
        throw new Error('Rate text not found');
      }

      const rate = parseFloat(rateText);
      
      return {
        rate,
        date: dateText,
        rawText: rateText,
        timestamp: new Date().toISOString()
      };
    });

    if (!rateData.rate || isNaN(rateData.rate)) {
      throw new Error(`Failed to parse Nubank conversion rate: ${rateData.rawText}`);
    }

    console.log('[Nubank] Successfully extracted rate:', rateData.rate);

    // Nubank displays the USD to BRL conversion rate
    // The rate represents how many BRL you get for 1 USD
    // For buy_price and sell_price, we use the same rate as Nubank
    // doesn't differentiate between buy and sell on this page
    return {
      buy_price: parseFloat(rateData.rate.toFixed(4)),
      sell_price: parseFloat(rateData.rate.toFixed(4)),
      source: SOURCE_URL,
      timestamp: rateData.timestamp,
      additional_info: {
        date: rateData.date,
        raw_text: rateData.rawText,
        currency_pair: 'USD/BRL',
        provider: 'Nubank',
        note: 'Rate for international credit card purchases'
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Nubank] Scraping error:', errorMessage);
    
    throw new Error(`Nubank scraping failed: ${errorMessage}`);
  }
}

/**
 * Validates that the scraped Nubank quote has reasonable values
 * 
 * @param quote - Quote to validate
 * @returns boolean - true if valid, throws error if invalid
 */
export function validateNubankQuote(quote: Quote): boolean {
  // Check that prices exist and are positive numbers
  if (!quote.buy_price || !quote.sell_price) {
    throw new Error('Missing buy_price or sell_price');
  }

  if (quote.buy_price <= 0 || quote.sell_price <= 0) {
    throw new Error('Invalid price values (must be positive)');
  }

  // Check that prices are within reasonable range for USD/BRL
  // As of 2024/2025, USD/BRL is typically between 4.5 and 6.5
  const MIN_RATE = 4.0;
  const MAX_RATE = 7.0;

  if (quote.buy_price < MIN_RATE || quote.buy_price > MAX_RATE) {
    throw new Error(`Buy price ${quote.buy_price} outside reasonable range [${MIN_RATE}, ${MAX_RATE}]`);
  }

  if (quote.sell_price < MIN_RATE || quote.sell_price > MAX_RATE) {
    throw new Error(`Sell price ${quote.sell_price} outside reasonable range [${MIN_RATE}, ${MAX_RATE}]`);
  }

  return true;
}

/**
 * Retry wrapper for scrapeNubank with exponential backoff
 * 
 * @param page - Puppeteer page instance
 * @param maxRetries - Maximum number of retry attempts
 * @returns Promise<Quote>
 */
export async function scrapeNubankWithRetry(
  page: Page,
  maxRetries: number = 3
): Promise<Quote> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Nubank] Attempt ${attempt}/${maxRetries}`);
      
      const quote = await scrapeNubank(page);
      validateNubankQuote(quote);
      
      return quote;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`[Nubank] Attempt ${attempt} failed:`, lastError.message);

      if (attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`[Nubank] Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw new Error(`Nubank scraping failed after ${maxRetries} attempts: ${lastError?.message}`);
}