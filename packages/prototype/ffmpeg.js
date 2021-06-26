const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const os = require('os');

const QUALITY_LEVEL = 24;
const MAX_FRAME_RATE = 10;

const sourceUrl = require('./secrets.json').feeds[1];
const outputDir = path.resolve('./output');

const JPG_START = 'ffd8';
const JPG_END = 'ffd9';

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

console.log(ffmpegArgs.join(' '));

let fileStream;

ff.stdout.on('data', data => {
    const startBytes = data.slice(0, 2).toString('hex');
    if (startBytes === JPG_START) {
        fileStream = fs.createWriteStream(path.join(outputDir, `output-${+new Date()}.jpg`));
    }
    
    // console.log('contains EOL', data.toString().indexOf(os.EOL));

    // should handle rejection here and skip
    // frame if need be
    // sharp(data, { sequentialRead: true })
    //     .ensureAlpha()
    //     .jpeg()
    //     .toFile(path.join(outputDir, `output-${+new Date()}.jpg`))
    //     .catch(err => console.error(err));

    fileStream.write(data);

    const endBytes = data.slice(-2).toString('hex');
    if (endBytes === JPG_END) {
        fileStream.end();
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