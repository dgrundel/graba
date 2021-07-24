import fs from 'fs';
import express from 'express';
import { getAllVideoRecords, getRecordById } from '../background/feed/VideoStorage';
import { Chain } from '../background/Chain';

const JPG_END = Buffer.from([0xff, 0xd9]);
const MJPEG_BOUNDARY = 'mjpegBoundary';
const CHAIN_END_SIGNAL = Buffer.from([0xff, 0xd9, 0xff, 0xd9]);

export const router = express.Router();

const getFirstFrame = async (filePath: string): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(filePath);
        let buf: Buffer = Buffer.alloc(0);

        stream.on('data', (chunk: Buffer) => {
            const endMarker = chunk.indexOf(JPG_END);
            if (endMarker === -1) {
                buf = Buffer.concat([ buf, chunk ]);
            } else {
                buf = Buffer.concat([buf, chunk.slice(0, endMarker + JPG_END.length)]);
                resolve(buf);
                stream.destroy();
            }
        });

        stream.on('error', err => reject(err));
        stream.on('end', () => resolve(buf));
    });
}

router.get('/list', (req: any, res: any, next: () => void) => {
    res.json(getAllVideoRecords());
});

router.get('/stream/:id', (req: any, res: any, next: () => void) => {
    const id = req.params.id;
    const record = getRecordById(id);

    if (!record) {
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

    const chainProcessor = (chunk: Buffer, prev?: Buffer) => new Promise<Buffer>(resolve => {
        
        if (Buffer.compare(chunk, CHAIN_END_SIGNAL) === 0) {
            res.end();
            resolve(chunk);
            return;
        }

        const endMarker = chunk.indexOf(JPG_END);
        if (endMarker === -1) {
            // no end marker, just append the bytes to buffer
            resolve(Buffer.concat([
                prev!,
                chunk
            ]));

        } else {
            const frame = Buffer.concat([
                prev!,
                chunk.slice(0, endMarker + JPG_END.length)
            ]);

            res.write(Buffer.from(`\r\n--${MJPEG_BOUNDARY}`));
            res.write(Buffer.from(`\r\nContent-Type: image/jpeg`));
            res.write(Buffer.from(`\r\nContent-length: ${frame.length}\r\n\r\n`));
            res.write(frame);

            // Send the remaining data into next round of processing
            const remaining = chunk.slice(endMarker + JPG_END.length);

            // add delay
            setTimeout(() => resolve(remaining), 100);
        }
    });

    const streamListener = (chunk: Buffer) => chain.put(chunk);

    const chain = new Chain<Buffer>(chainProcessor, Buffer.alloc(0));
    const stream = fs.createReadStream(record.path);


    stream.on('data', streamListener);
    stream.on('error', () => res.end());
    stream.on('end', () => chain.put(CHAIN_END_SIGNAL));
    res.socket!.on('close', () => {
        stream.off('data', streamListener);
    });
});

router.get('/still/:id', async (req: any, res: any, next: () => void) => {
    const id = req.params.id;
    const record = getRecordById(id);

    if (!record) {
        res.writeHead(404);
        res.end('Not found.');
        return;
    }

    const frame = await getFirstFrame(record.path);

    res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Content-length': frame.length
    });
    res.write(frame);
    res.end();
});

