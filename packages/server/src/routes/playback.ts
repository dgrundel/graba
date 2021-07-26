import fs, { promises as fsPromises } from 'fs';
import express from 'express';
import { deleteRecordById, getAllVideoRecords, getRecordById } from '../background/feed/VideoStorage';
import { Chain } from '../background/Chain';
import sharp from 'sharp';
import { spawn } from 'child_process';
import { FFmpegToJpeg } from '../background/feed/FFmpegToJpeg';

const MJPEG_BOUNDARY = 'mjpegBoundary';
const JPG_START = Buffer.from([0xff, 0xd8]);
const JPG_END = Buffer.from([0xff, 0xd9]);
const CHAIN_END_SIGNAL = Buffer.from([0xff, 0xd9, 0xff, 0xd9]);

export const router = express.Router();

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

    const ffArgGenerator = (): string[] => [
        '-re', // read input at native frame rate, "good for live streams"
        '-i', record.path, // input
        '-f', 'image2', // use image processor
        '-c:v', 'mjpeg', // output a jpg
        '-update', '1', // reuse the same output (stdout in this case)
        'pipe:1', // pipe to stdout
        '-hide_banner', // don't output copyright notice, build options, library versions
    ];

    const writeFrame = (frame: Buffer) => {
        res.write(Buffer.from(`\r\n--${MJPEG_BOUNDARY}`));
        res.write(Buffer.from(`\r\nContent-Type: image/jpeg`));
        res.write(Buffer.from(`\r\nContent-length: ${frame.length}\r\n\r\n`));
        res.write(frame);
    };

    const ffToJpeg = new FFmpegToJpeg(ffArgGenerator, { debug: true });
    let prev: Buffer | undefined;

    ffToJpeg.onFrame((frame: Buffer) => {
        prev = frame;
        writeFrame(frame);
    });

    ffToJpeg.onEnd(async () => {
        // send a copy of the last frame, darkened
        const frame = await sharp(prev)
            .modulate({
                brightness: 0.25,
                saturation: 0.25,
            })
            .toBuffer();
        writeFrame(frame);

        // close connection
        res.end();
    })

    res.socket!.on('close', () => {
        ffToJpeg.stop();
    });
});

router.get('/still/:id', async (req: any, res: any, next: () => void) => {
    const id = req.params.id;
    const record = getRecordById(id);

    if (!record || !record.thumbnailPath) {
        res.writeHead(404);
        res.end('Not found.');
        return;
    }

    const chunks: Buffer[] = [];
    const stream = fs.createReadStream(record.thumbnailPath);
    const frame: Buffer = await new Promise<Buffer>((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });

    res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Content-length': frame.length
    });
    res.write(frame);
    res.end();
});

