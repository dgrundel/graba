import express from 'express';
import { Feed, validateFeed } from 'hastycam.interface';
import { config } from '../background/config';
import { getAllStreams, getStream, addStream } from '../background/feed/streams';
import { ErrorMessage, mergeErrors } from '../../../interface/build/validator/validators';
import path from 'path';
import fs from 'fs';

export const router = express.Router();

const MJPEG_BOUNDARY = 'mjpegBoundary';

router.get('/list', (req: any, res: any, next: () => void) => {
    const streams = getAllStreams();
    res.json(streams.map(stream => {
        const feed = stream.getFeed();
        return { 
            id: feed.id,
            name: feed.name,
        };
    }));
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

    const off = stream.onFrame(jpgData => {
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

    stream.getFrame().then(jpgData => {
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
        const feeds = config.get('feeds');
        const i = feeds.findIndex(f => f.id === feed.id);
        if (i !== -1) {
            feeds.splice(i, 1, feed);
        } else {
            feeds.push(feed);
        }
        config.set('feeds', feeds);

        // create/update stream
        const stream = getStream(feed.id);
        if (stream) {
            // update existing
            stream.updateFeed(feed);
        } else {
            // create new
            addStream(feed);
        }

        res.json("OK!");
    } else {
        res.status(400).json(errors);
    }
});