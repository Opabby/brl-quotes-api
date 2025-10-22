# BRL Quotes API 💱

A real-time currency exchange rate API that aggregates USD to BRL quotes from multiple Brazilian financial platforms. Built as part of the Pluggy Full-Stack Challenge.

## 📋 Overview

This REST API collects, normalizes, and analyzes USD to BRL (Dollar to Brazilian Real) exchange rates from three major sources:
- **Wise** - International money transfer service
- **Nubank** - Leading Brazilian digital bank
- **Nomad** - Global financial platform

The API provides real-time quotes, calculates averages, and computes slippage percentages to help users find the best exchange rates.

## 🚀 Features

- ✅ Real-time data scraping from multiple sources
- ✅ TypeScript for type safety
- ✅ In-memory caching (60-second TTL)
- ✅ Comprehensive error handling
- ✅ CORS enabled for frontend integration
- ✅ Graceful shutdown handling
- ✅ Retry mechanisms with exponential backoff
- ✅ Rate validation and sanity checks
- ✅ Deployed on Heroku

## 📡 API Endpoints

### 1. Get All Quotes
```http
GET /quotes
```

Returns an array of current exchange rate quotes from all available sources.

**Response Example:**
```json
[
  {
    "buy_price": 5.8234,
    "sell_price": 5.7456,
    "source": "https://wise.com/es/currency-converter/brl-to-usd-rate",
    "timestamp": "2025-10-22T14:30:00.000Z",
    "additional_info": {
      "mid_market_rate": 5.7845,
      "spread_percentage": 0.0067,
      "currency_pair": "USD/BRL",
      "provider": "Wise"
    }
  },
  {
    "buy_price": 5.8123,
    "sell_price": 5.8123,
    "source": "https://nubank.com.br/dados-abertos/taxas-conversao",
    "timestamp": "2025-10-22T14:30:00.000Z",
    "additional_info": {
      "date": "22/10/2025",
      "currency_pair": "USD/BRL",
      "provider": "Nubank",
      "note": "Rate for international credit card purchases"
    }
  },
  {
    "buy_price": 5.8567,
    "sell_price": 5.7234,
    "source": "https://www.nomadglobal.com",
    "timestamp": "2025-10-22T14:30:00.000Z",
    "additional_info": {
      "mid_market_rate": 5.7900,
      "spread_percentage": 1.15,
      "currency_pair": "USD/BRL",
      "provider": "Nomad Global",
      "note": "Includes IOF tax and spread"
    }
  }
]
```

### 2. Get Average Rates
```http
GET /average
```

Returns the arithmetic mean of buy and sell prices across all sources.

**Response Example:**
```json
{
  "average_buy_price": 5.8308,
  "average_sell_price": 5.7604,
  "timestamp": "2025-10-22T14:30:00.000Z",
  "sources_count": 3,
  "additional_info": {
    "calculation_method": "arithmetic_mean",
    "sources": [
      "https://wise.com/es/currency-converter/brl-to-usd-rate",
      "https://nubank.com.br/dados-abertos/taxas-conversao",
      "https://www.nomadglobal.com"
    ]
  }
}
```

### 3. Get Slippage Analysis
```http
GET /slippage
```

Returns the percentage difference between each source's rates and the market average.

**Response Example:**
```json
[
  {
    "buy_price_slippage": -0.13,
    "sell_price_slippage": -0.26,
    "source": "https://wise.com/es/currency-converter/brl-to-usd-rate",
    "timestamp": "2025-10-22T14:30:00.000Z",
    "additional_info": {
      "quote_buy_price": 5.8234,
      "quote_sell_price": 5.7456,
      "average_buy_price": 5.8308,
      "average_sell_price": 5.7604,
      "provider": "Wise"
    }
  },
  {
    "buy_price_slippage": -0.32,
    "sell_price_slippage": 0.90,
    "source": "https://nubank.com.br/dados-abertos/taxas-conversao",
    "timestamp": "2025-10-22T14:30:00.000Z",
    "additional_info": {
      "quote_buy_price": 5.8123,
      "quote_sell_price": 5.8123,
      "average_buy_price": 5.8308,
      "average_sell_price": 5.7604,
      "provider": "Nubank"
    }
  },
  {
    "buy_price_slippage": 0.44,
    "sell_price_slippage": -0.64,
    "source": "https://www.nomadglobal.com",
    "timestamp": "2025-10-22T14:30:00.000Z",
    "additional_info": {
      "quote_buy_price": 5.8567,
      "quote_sell_price": 5.7234,
      "average_buy_price": 5.8308,
      "average_sell_price": 5.7604,
      "provider": "Nomad Global"
    }
  }
]
```

### Root Endpoint
```http
GET /
```

Returns API information and available endpoints.

**Response Example:**
```json
{
  "message": "Pluggy Full-Stack Challenge - Currency Exchange API",
  "endpoints": {
    "quotes": "GET /quotes - Get all exchange rate quotes",
    "average": "GET /average - Get average exchange rates",
    "slippage": "GET /slippage - Get slippage percentages"
  },
  "documentation": "See README.md for more details",
  "version": "1.0.0"
}
```

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Web Scraping**: Puppeteer
- **HTTP Client**: Axios
- **Deployment**: Heroku

## 📦 Installation & Local Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd brl-quotes-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:3000`

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Start production server**
   ```bash
   npm start
   ```

## 📁 Project Structure

```
brl-quotes-api/
├── src/
│   ├── index.ts                 # Express server setup
│   ├── types.ts                 # TypeScript interfaces
│   ├── routes/
│   │   └── quotes.routes.ts     # API route definitions
│   ├── services/
│   │   └── quotes.service.ts    # Business logic & caching
│   └── data-sources/
│       ├── wise.ts              # Wise scraper
│       ├── nubank.ts            # Nubank scraper
│       └── nomad.ts             # Nomad API client
├── dist/                        # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## 🧩 Architecture

### Data Flow
1. **Request** → API endpoint receives request
2. **Cache Check** → Service checks if cached data is valid (<60s old)
3. **Data Collection** → If cache expired, scrapes/fetches from all sources in parallel
4. **Processing** → Calculates averages and slippage
5. **Response** → Returns formatted JSON response
6. **Cache Update** → Stores results with timestamp

### Scraping Strategy
- **Wise**: Puppeteer web scraping with DOM parsing
- **Nubank**: Puppeteer scraping from public data table
- **Nomad**: Direct API call with axios

### Error Handling
- Retry mechanism with exponential backoff (3 attempts)
- Rate validation (checks if values are within reasonable ranges)
- Partial failure support (API works even if one source fails)
- Detailed error logging

## ⚡ Performance & Caching

- **Cache Duration**: 60 seconds
- **Cache Strategy**: In-memory caching
- **Cache Invalidation**: Automatic after TTL expires
- **Fresh Data**: Always fetches new data if cache is stale

## 🔒 Error Responses

All error responses follow this format:

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "timestamp": "2025-10-22T14:30:00.000Z"
}
```

Common HTTP status codes:
- `200` - Success
- `404` - Endpoint not found
- `500` - Internal server error (scraping failure, etc.)

## 🚢 Deployment

Deployed on Heroku with the following configuration:

**Buildpacks:**
- `heroku/nodejs`
- `jontewks/puppeteer` (for Chromium dependencies)

**Environment Variables:**
- `PORT`: Automatically set by Heroku

**Start Command:**
```json
"start": "node dist/index.js"
```

## 📊 Data Sources

| Source | Type | Update Frequency | Reliability |
|--------|------|------------------|-------------|
| Wise | Web Scraping | Real-time | High |
| Nubank | Web Scraping | Daily | High |
| Nomad | API | Real-time | High |

## 🎯 Use Cases

- Compare exchange rates across platforms
- Find the best USD to BRL conversion rate
- Track rate volatility and spreads
- Integrate into financial dashboards
- Market analysis and research

## 👤 Author

**Thaís Rodeiro**

## 🤝 Contributing

This is a challenge project, but suggestions and feedback are welcome!

---

**Built with ❤️ for the Pluggy Full-Stack Challenge**
