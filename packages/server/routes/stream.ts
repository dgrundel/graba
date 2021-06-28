import express from 'express';
import { ServerResponse } from 'http';
import { FeedEventType, getFeed } from '../feeds/feeds';

export const router = express.Router();

// stream dashboard
// router.get('/', function(req, res, next) {
//     res.send('Express + TypeScript Server');
// });
const MJPEG_BOUNDARY = 'mjpegBoundary';

router.get('/:name', function(req, res: ServerResponse, next) {
    const name = req.params.name;

    const feed = getFeed(name);
    if (!feed) {
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

    feed.on(FeedEventType.JpgChunk, data => {
        const jpgData = data.data!;
        
        if (data.isStart) {
            res.write(Buffer.from(`\r\n--${MJPEG_BOUNDARY}`));
            res.write(Buffer.from(`\r\nContent-Type: image/jpeg`));
            res.write(Buffer.from(`\r\nContent-length: ${jpgData.length}\r\n\r\n`));
        }

        res.write(jpgData);
    });

    feed.on(FeedEventType.FeedClose, () => {
        res.end();
    });
    
    // httpListeners.push(res);

    res.socket!.on('close', () => {
        // httpListeners.splice(httpListeners.indexOf(res), 1);
    });
});
