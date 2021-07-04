import express from 'express';
import { config } from '../background/config';

export const router = express.Router();

router.get('/', function(req: any, res: any, next: () => void) {
    res.json(config.all());
});

router.post('/', function(req: any, res: any, next: () => void) {
    console.log(req.body);
    res.json(config.all());
});

