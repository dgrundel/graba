import express from 'express';
import { config } from '../background/config';

export const router = express.Router();

router.get('/', function(req: any, res: any, next: () => void) {
    res.json(config.all());
});

router.post('/feed/:id', function(req: any, res: any, next: () => void) {
    console.log('id', req.params.id);
    console.log('body', req.body);
    
    res.writeHead(400);
    res.end('Invalid input!');
});

