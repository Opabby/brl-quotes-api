import axios from 'axios';
import { Quote, NomadRateResponse } from '../types';

export async function fetchNomadRate(): Promise<Quote> {
  try {
    const apiUrl = 'https://api.benomad.us/forex-rates-s3/v1/calculator';
    
    const response = await axios.get<NomadRateResponse>(apiUrl, {
      headers: {
        'authority': 'api.benomad.us',
        'accept': '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'origin': 'https://site.nomadglobal.com',
        'referer': 'https://site.nomadglobal.com/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const data = response.data;

    const baseRate = parseFloat(data.rate.value);

    const iofBanking = parseFloat(data.iof.banking);

    const spreadDefault = parseFloat(data.spread.default);
    const spreadCustom = parseFloat(data.spread.custom);
    
    const buyPrice = baseRate * (1 + spreadDefault + iofBanking);

    const sellPrice = baseRate * (1 - spreadCustom);
    
    return {
      buy_price: parseFloat(buyPrice.toFixed(4)),
      sell_price: parseFloat(sellPrice.toFixed(4)),
      source: 'https://www.nomadglobal.com',
      timestamp: new Date().toISOString(),
      additional_info: {
        mid_market_rate: baseRate,
        spread_percentage: spreadDefault * 100,
        currency_pair: 'USD/BRL',
        provider: 'Nomad Global',
        note: 'Includes IOF tax and spread'
      }
    };
    
  } catch (error) {
    console.error('Error fetching Nomad rate:', error);
    throw new Error('Failed to fetch rates from Nomad');
  }
}

export async function fetchNomadRateSimple(): Promise<Quote> {
  try {
    const apiUrl = 'https://api.benomad.us/forex-rates-s3/v1/calculator';
    
    const response = await axios.get<NomadRateResponse>(apiUrl, {
      headers: {
        'authority': 'api.benomad.us',
        'accept': '*/*',
        'origin': 'https://site.nomadglobal.com',
        'referer': 'https://site.nomadglobal.com/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const data = response.data;
    const baseRate = parseFloat(data.rate.value);

    return {
      buy_price: parseFloat(baseRate.toFixed(4)),
      sell_price: parseFloat(baseRate.toFixed(4)),
      source: 'https://www.nomadglobal.com',
      timestamp: new Date().toISOString(),
      additional_info: {
        mid_market_rate: baseRate,
        currency_pair: 'USD/BRL',
        provider: 'Nomad Global'
      }
    };
    
  } catch (error) {
    console.error('Error fetching Nomad rate:', error);
    throw new Error('Failed to fetch rates from Nomad');
  }
}