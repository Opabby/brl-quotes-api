import express, { Application, Request, Response } from 'express';
import cors from 'cors';
// import dotenv from 'dotenv';
import router from './routes/quotes.routes';
import { quotesService } from './services/quotes.service';

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next) => {
  next();
});

app.use('/', router);

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Pluggy Full-Stack Challenge - Currency Exchange API',
    endpoints: {
      quotes: 'GET /quotes - Get all exchange rate quotes',
      average: 'GET /average - Get average exchange rates',
      slippage: 'GET /slippage - Get slippage percentages'
    },
    documentation: 'See README.md for more details',
    version: '1.0.0'
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist`,
    timestamp: new Date().toISOString()
  });
});

app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(PORT, () => {});

process.on('SIGINT', async () => {
  
  await quotesService.closeBrowser();
  
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  
  await quotesService.closeBrowser();
  
  server.close(() => {
    process.exit(0);
  });
});

export default app;