import fs from 'fs';
import express from 'express';
import { getAllVideoRecords, getRecordById } from '../background/feed/VideoStorage';

const JPG_END = Buffer.from([0xff, 0xd9]);

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

