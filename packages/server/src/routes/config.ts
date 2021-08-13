import express from 'express';
import { mergeErrors, validateConfig } from 'graba.interface';
import { config } from '../background/config';

export const router = express.Router();

router.get('/', (req: any, res: any, next: () => void) => {
    res.json(config.toObject());
});

router.post('/', (req: any, res: any, next: () => void) => {
    const updates = req.body;
        
    const errors = mergeErrors(
        ...validateConfig(updates),
    );
    if (errors.length === 0) {
        config.update(updates);
        res.json(config.toObject());
    } else {
        res.status(400).json(errors);
    }
});