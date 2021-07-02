import express from 'express';
import { FeedEvent, FeedEventType, getAllFeeds, getFeed } from '../background/feeds';

export const router = express.Router();

const MJPEG_BOUNDARY = 'mjpegBoundary';

router.get('/list', function(req: any, res: any, next: () => void) {
    const feeds = getAllFeeds();
    res.json(feeds.map(f => f.name));
});

router.get('/view/:name', function(req: any, res: any, next: () => void) {
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

    const jpgListener = (data: FeedEvent) => {
        const jpgData = data.data!;
        
        res.write(Buffer.from(`\r\n--${MJPEG_BOUNDARY}`));
        res.write(Buffer.from(`\r\nContent-Type: image/jpeg`));
        res.write(Buffer.from(`\r\nContent-length: ${jpgData.length}\r\n\r\n`));
        res.write(jpgData);
    };

    feed.on(FeedEventType.JpgComplete, jpgListener);

    feed.once(FeedEventType.FeedClose, () => {
        res.end();
    });
    
    res.socket!.on('close', () => {
        feed.off(FeedEventType.JpgComplete, jpgListener);
    });
});
