const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const QUALITY_LEVEL = 24;
const MAX_FRAME_RATE = 10;

const sourceUrl = require('./secrets.json').feeds[0];
const outputDir = path.resolve('./output');

// https://docs.fileformat.com/image/jpeg/
const JPG_START = Buffer.from([0xff, 0xd8]);
const JPG_END = Buffer.from([0xff, 0xd9]);

const httpListeners = [];
const mjpegBoundary = 'somethingcool';

const ffmpegArgs = [
    '-i', sourceUrl, // input
    '-filter:v', `fps='fps=min(${MAX_FRAME_RATE},source_fps)'`, // set max fps
    '-f', 'image2', // use image processor
    '-c:v', 'mjpeg', // output a jpg
    '-qscale:v', QUALITY_LEVEL.toString(), // set quality level
    // '-frames:v', '1', // output a single frame
    '-update', '1', // reuse the same output (stdout in this case)
    'pipe:1', // pipe to stdout
];
const ff = child_process.spawn('ffmpeg', ffmpegArgs);

console.log('ffmpegArgs', ffmpegArgs.join(' '));

let fileStream;

ff.stdout.on('data', data => {
    if (Buffer.compare(data.slice(0, 2), JPG_START) === 0) {
        fileStream = fs.createWriteStream(path.join(outputDir, `output-${+new Date()}.jpg`));
        // fileStream = sharp({ sequentialRead: true });

        httpListeners.forEach(res => {
            res.write(Buffer.from(`\r\n--${mjpegBoundary}`));
            res.write(Buffer.from(`\r\nContent-Type: image/jpeg`));
            res.write(Buffer.from(`\r\nContent-length: ${data.length}\r\n\r\n`));
        });
    }
        
    fileStream.write(data);
    
    httpListeners.forEach(res => {
        res.write(data);
    });

    if (Buffer.compare(data.slice(-2), JPG_END) === 0) {
        fileStream.end();
        
        // httpListeners.forEach(res => {
        //     res.write(Buffer.from(`\r\n`));
        // });
        // fileStream.ensureAlpha()
        //     .jpeg()
        //     // should handle rejection here and skip frame if need be
        //     .toFile(path.join(outputDir, `output-${+new Date()}.jpg`))
        //     .catch(err => console.error(err));
    }
});

ff.stderr.on('data', data => {
    console.error('stderr', data.toString());
});

ff.on('close', code => {
    console.log(`child process exited with code ${code}`);
});

ff.on('error', err => {
    console.error('Error in subprocess.', err);
});

// stream as MJPEG, maybe

const http = require('http');

const server = http.createServer((req, res) => {
    if (req.url.indexOf('stream') === -1) {
        res.writeHead(404);
        res.end('Sorry');
        return;
    }

    res.writeHead(200, {
        'Expires': 'Mon, 01 Jul 1980 00:00:00 GMT',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Connection': 'keep-alive',
        'Content-Type': 'multipart/x-mixed-replace;boundary=' + mjpegBoundary
    });
    httpListeners.push(res);

    // res.write(Buffer.from('\r\n\r\n'));

    res.socket.on('close', () => {
        httpListeners.splice(httpListeners.indexOf(res), 1);
    });
});
server.listen(8080);
console.log('listening at http://localhost:8080');