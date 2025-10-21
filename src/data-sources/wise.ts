import { Page } from 'puppeteer';
import { Quote } from '../types';

export async function scrapeWise(page: Page): Promise<Quote> {
  const SOURCE_URL = 'https://wise.com/es/currency-converter/usd-to-brl-rate?amount=1';
  const WISE_SPREAD_PERCENTAGE = 0.005; // 0.5% typical spread for Wise

  try {
    await page.goto(SOURCE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for the rate to be visible on the page
    await page.waitForFunction(
      () => {
        const text = document.body.innerText;
        return text.includes('USD') && text.includes('BRL') && text.includes('=');
      },
      { timeout: 10000 }
    );

    const rateData = await page.evaluate(() => {
      // Strategy 1: Look for the mid-market rate container
      let rateElement = document.querySelector('[class*="midMarketRate"] span[dir="ltr"]');

      // Strategy 2: Find spans with dir="ltr" containing the rate pattern
      if (!rateElement) {
        const spans = document.querySelectorAll('span[dir="ltr"]');
        for (const span of spans) {
          const text = span.textContent || '';
          // Looking for pattern like "$1 USD = 5,385 BRL" or "5,385 BRL"
          if (text.includes('USD') && text.includes('BRL') && text.includes('=')) {
            rateElement = span;
            break;
          }
        }
      }

      // Strategy 3: Tree walker to find text nodes
      if (!rateElement) {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null
        );

        let node;
        while ((node = walker.nextNode())) {
          const text = node.textContent || '';
          if (text.includes('USD') && text.includes('BRL') && text.includes('=')) {
            rateElement = node.parentElement;
            break;
          }
        }
      }
      
      if (!rateElement) {
        throw new Error('Rate element not found with any strategy');
      }

      const rateText = rateElement.textContent?.trim() || '';
      
      // Parse rate from text like "$1 USD = 5,385 BRL" or "= 5,385 BRL"
      // The rate represents how many BRL you get for 1 USD
      const match = rateText.match(/=\s*([\d,\.]+)\s*BRL/i);
      if (!match) {
        throw new Error(`Could not parse rate from text: "${rateText}"`);
      }

      // Replace comma with dot for decimal point (Spanish format uses comma)
      const rateString = match[1].replace(',', '.');
      const rateValue = parseFloat(rateString);
      
      if (isNaN(rateValue) || rateValue <= 0) {
        throw new Error(`Invalid rate value: ${rateValue}`);
      }

      return {
        rate: rateValue,
        rawText: rateText
      };
    });

    // The rate from Wise is USD to BRL (how many BRL per 1 USD)
    // For buy_price: you BUY USD with BRL (so you need more BRL per USD)
    // For sell_price: you SELL USD for BRL (so you get less BRL per USD)
    const midRate = rateData.rate;
    const buyPrice = midRate * (1 + WISE_SPREAD_PERCENTAGE);  // Buy USD costs more BRL
    const sellPrice = midRate * (1 - WISE_SPREAD_PERCENTAGE); // Sell USD gets less BRL

    const quote: Quote = {
      buy_price: parseFloat(buyPrice.toFixed(4)),
      sell_price: parseFloat(sellPrice.toFixed(4)),
      source: SOURCE_URL,
      timestamp: new Date().toISOString(),
      additional_info: {
          mid_market_rate: midRate,
          spread_percentage: WISE_SPREAD_PERCENTAGE,
          raw_text: rateData.rawText,
          currency_pair: 'USD/BRL',
          provider: 'Wise'
      }
    };

    return quote;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Wise] Scraping error:', errorMessage);
    
    throw new Error(`Wise scraping failed: ${errorMessage}`);
  }
}

export function validateWiseQuote(quote: Quote): boolean {
  if (!quote.buy_price || !quote.sell_price) {
    throw new Error('Missing buy_price or sell_price');
  }

  if (quote.buy_price <= 0 || quote.sell_price <= 0) {
    throw new Error('Invalid price values (must be positive)');
  }

  if (quote.buy_price <= quote.sell_price) {
    throw new Error('Buy price must be higher than sell price for USD/BRL');
  }

  // Reasonable range for USD to BRL rate (around 5-6 BRL per USD as of the HTML)
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

export async function scrapeWiseWithRetry(
  page: Page,
  maxRetries: number = 3
): Promise<Quote> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const quote = await scrapeWise(page);
      validateWiseQuote(quote);
      
      return quote;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`[Wise] Attempt ${attempt} failed:`, lastError.message);

      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw new Error(`Wise scraping failed after ${maxRetries} attempts: ${lastError?.message}`);
}