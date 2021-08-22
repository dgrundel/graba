import express from 'express';
import { getStats } from '../background/stats';

export const router = express.Router();

router.get('/stats', async (req: any, res: any, next: () => void) => {
    const stats = await getStats();
    res.json(stats);
});

