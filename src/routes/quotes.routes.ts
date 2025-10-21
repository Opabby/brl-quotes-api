import { Router, Request, Response } from 'express';
import { quotesService } from '../services/quotes.service';

const router = Router();


router.get('/quotes', async (req: Request, res: Response) => {
  
  try {
    const quotes = await quotesService.getQuotes();
    
    res.status(200).json(quotes);
  } catch (error) {
    console.error('[API] Error in GET /quotes:', error);
    
    res.status(500).json({
      error: 'Failed to fetch quotes',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/average', async (req: Request, res: Response) => {
  
  try {
    const average = await quotesService.getAverage();
    
    res.status(200).json(average);
  } catch (error) {
    console.error('[API] Error in GET /average:', error);
    
    res.status(500).json({
      error: 'Failed to calculate average',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/slippage', async (req: Request, res: Response) => {
  
  try {
    const slippage = await quotesService.getSlippage();
    
    res.status(200).json(slippage);
  } catch (error) {
    console.error('[API] Error in GET /slippage:', error);
    
    res.status(500).json({
      error: 'Failed to calculate slippage',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;