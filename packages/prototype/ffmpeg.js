const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const QUALITY_LEVEL = 24;
const MAX_FRAME_RATE = 20;

const sourceUrl = 'rtsp://user:pass@ipaddr:8554/unicast';

const ffmpegPath = path.resolve(__dirname, 'bin/ffmpeg.exe');
const ff = child_process.spawn(ffmpegPath, [
    '-i', sourceUrl,
    '-filter:v', `fps='fps=min(${MAX_FRAME_RATE},source_fps)'`,
    '-f', 'image2', // force output format to image
    '-c:v', 'mjpeg', // format output to jpeg
    '-qscale:v', QUALITY_LEVEL, // quality, 1-31 where 1 is best
    '-update', '1', // keep writing to the same output (pipe/stdout in this case)
    'pipe:1', // output to stdout
]);

ff.stdout.on('data', data => {
    // console.log('stdout', data);

    // should handle rejection here and skip
    // frame if need be
    sharp(data)
        .jpeg()    
        .toFile(`output-${+new Date()}.jpg`);
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