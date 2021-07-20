import express from 'express';
import { getAllVideoRecords } from '../background/feed/VideoStorage';

export const router = express.Router();

router.get('/list', function(req: any, res: any, next: () => void) {
    res.json(getAllVideoRecords());
});

