import express from 'express';
import { validateFeed } from 'hastycam.interface';
import { config } from '../background/config';

export const router = express.Router();

router.get('/', function(req: any, res: any, next: () => void) {
    res.json(config.all());
});

router.post('/feed/:id', function(req: any, res: any, next: () => void) {
    console.log('id', req.params.id);
    console.log('body', req.body);
    
    const errors = validateFeed(req.body);
    if (errors.length === 0) {
        res.json("OK!");
    } else {
        res.status(400).json(errors);
    }
});

