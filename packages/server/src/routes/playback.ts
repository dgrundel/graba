import fs, { promises as fsPromises } from 'fs';
import express from 'express';
import { deleteRecordById, getAllVideoRecords, getRecordById } from '../background/feed/VideoStorage';
import { Chain } from '../background/Chain';
import sharp from 'sharp';

const MJPEG_BOUNDARY = 'mjpegBoundary';
const JPG_START = Buffer.from([0xff, 0xd8]);
const JPG_END = Buffer.from([0xff, 0xd9]);
const CHAIN_END_SIGNAL = Buffer.from([0xff, 0xd9, 0xff, 0xd9]);

export const router = express.Router();

const getFirstFrame = async (filePath: string): Promise<Buffer> => {
    return Buffer.alloc(0);
    // return new Promise((resolve, reject) => {
    //     const stream = fs.createReadStream(filePath);
    //     let buf: Buffer = Buffer.alloc(0);

    //     stream.on('data', (chunk: Buffer) => {
    //         const endMarker = chunk.indexOf(JPG_END);
    //         if (endMarker === -1) {
    //             buf = Buffer.concat([ buf, chunk ]);
    //         } else {
    //             buf = Buffer.concat([buf, chunk.slice(0, endMarker + JPG_END.length)]);
    //             resolve(buf);
    //             stream.destroy();
    //         }
    //     });

    //     stream.on('error', err => reject(err));
    //     stream.on('end', () => resolve(buf));
    // });
}

router.get('/list', (req: any, res: any, next: () => void) => {
    res.json(getAllVideoRecords());
});

router.delete('/:id', (req: any, res: any, next: () => void) => {
    const id = req.params.id;
    const record = getRecordById(id);

    if (!record) {
        res.writeHead(404);
        res.json('Not found.');
        return;
    }

    fsPromises.unlink(record.path)
        .then(() => deleteRecordById(id))
        .then(() => res.json('OK!'))
        .catch(err => res.status(500).json(err));
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

    const chainProcessor = async (data: Buffer, prev?: Buffer): Promise<Buffer> => {
        let frame = data;

        const isChainEnd = Buffer.compare(frame, CHAIN_END_SIGNAL) === 0;
        if (isChainEnd) {
            
            // two end signals in a row means _really_ end
            if (Buffer.compare(prev!, CHAIN_END_SIGNAL) === 0) {
                return frame;
            }

            // send a copy of the last frame, darkened
            frame = await sharp(prev)
                .modulate({
                    brightness: 0.25,
                    saturation: 0.25,
                })
                .toBuffer();
        }

        res.write(Buffer.from(`\r\n--${MJPEG_BOUNDARY}`));
        res.write(Buffer.from(`\r\nContent-Type: image/jpeg`));
        res.write(Buffer.from(`\r\nContent-length: ${frame.length}\r\n\r\n`));
        res.write(frame);

        if (isChainEnd) {
            res.end();
            return frame;

        } else {
            // add delay
            return new Promise(resolve => {
                setTimeout(() => resolve(frame), 100);
            });
        }
    };

    // data listener for FS read stream
    // breaks data into jpg frames
    let frameBuf = Buffer.alloc(0);
    const streamListener = (chunk: Buffer) => {
        frameBuf = Buffer.concat([
            frameBuf,
            chunk
        ]);

        let hasStart = frameBuf.length >= 2 && frameBuf[0] === 0xff && frameBuf[1] === 0xd8;
        if (!hasStart) {
            throw new Error('frameBuf is missing expected JPG start marker.');
        }

        while (hasStart) {
            // look for end marker after start marker
            let endMarker = frameBuf.indexOf(JPG_END, JPG_START.length);
            if (endMarker === -1) {
                break;
            }

            const end = endMarker + JPG_END.length;
            const frame = frameBuf.slice(0, end);
            chain.put(frame);
            
            frameBuf = frameBuf.slice(end);
            hasStart = frameBuf.length >= 2 && frameBuf[0] === 0xff && frameBuf[1] === 0xd8;
        }
    };

    const chain = new Chain<Buffer>(chainProcessor, Buffer.alloc(0));
    const stream = fs.createReadStream(record.path);


    stream.on('data', streamListener);
    stream.on('error', () => res.end());
    stream.on('end', () => chain.put(CHAIN_END_SIGNAL));
    res.socket!.on('close', () => {
        chain.stop();
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

