import express from 'express';
import { Feed, validateFeed, ErrorMessage, mergeErrors } from 'graba.interface';
import { config } from '../background/config';
import { getStream, stopStream, updateStream } from '../background/streams';
import fs from 'fs';

export const router = express.Router();

const MJPEG_BOUNDARY = 'mjpegBoundary';

router.get('/list', (req: any, res: any, next: () => void) => {
    res.json(config.feeds.map(f => ({ id: f.id, name: f.name })));
});

router.get('/stream/:id', (req: any, res: any, next: () => void) => {
    const id = req.params.id;

    const stream = getStream(id);
    if (!stream) {
        res.writeHead(404);
        res.end('Not found.');
        return;
    }

    res.writeHead(200, {
        'Expires': 'Mon, 01 Jul 1980 00:00:00 GMT',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Connection': 'keep-alive',
        'Content-Type': 'multipart/x-mixed-replace;boundary=' + MJPEG_BOUNDARY
    });

    const off = stream.onFrame(frame => {
        const jpgData = frame.buffer;
        res.write(Buffer.from(`\r\n--${MJPEG_BOUNDARY}`));
        res.write(Buffer.from(`\r\nContent-Type: image/jpeg`));
        res.write(Buffer.from(`\r\nContent-length: ${jpgData.length}\r\n\r\n`));
        res.write(jpgData);
    });

    stream.onEnd(() => res.end());
    res.socket!.on('close', off);
});

router.get('/still/:id', (req: any, res: any, next: () => void) => {
    const id = req.params.id;

    const stream = getStream(id);
    if (!stream) {
        res.writeHead(404);
        res.end('Not found.');
        return;
    }

    stream.getFrame().then(frame => {
        const jpgData = frame.buffer;
        res.writeHead(200, {
            'Expires': 'Mon, 01 Jul 1980 00:00:00 GMT',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Content-Type': 'image/jpeg',
            'Content-length': jpgData.length
        });
        res.write(jpgData);
        res.end();
    })
});

const savePathValidator = (feed: Feed): ErrorMessage[] => {
    if (feed.saveVideo && feed.savePath) {
        try {
            fs.accessSync(feed.savePath, fs.constants.R_OK | fs.constants.W_OK);
        } catch (e) {
            return [{ field: 'savePath', message: e.message }];
        }
    }

    return [];
};

router.post('/', (req: any, res: any, next: () => void) => {
    const feed = req.body;
        
    const errors = mergeErrors(
        ...validateFeed(feed),
        ...savePathValidator(feed)
    );
    if (errors.length === 0) {
        // add to or update config file
        config.createOrUpdateFeed(feed);
        // create/update stream
        updateStream(feed);

        res.json(feed);
    } else {
        res.status(400).json(errors);
    }
});

router.delete('/:id', (req: any, res: any, next: () => void) => {
    const id = req.params.id;

    try {
        stopStream(id);
        config.deleteFeed(id);
        res.json(true);
    } catch (e) {
        res.status(500).json(e);
    }
});