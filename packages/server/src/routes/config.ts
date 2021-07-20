import express from 'express';
import { config } from '../background/config';

export const router = express.Router();

router.get('/', (req: any, res: any, next: () => void) => {
    res.json(config.all());
});

