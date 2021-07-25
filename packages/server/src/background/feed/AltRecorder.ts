import { performance } from 'perf_hooks';
import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'stream';
import { Feed } from 'hastycam.interface';
import { FeedConsumer } from './FeedConsumer';
import { MotionDetector } from './MotionDetector';
import { VideoRecorder } from './VideoRecorder';
import { Chain } from '../Chain';
import { nanoid } from 'nanoid';

// const streamUrl = '';
// const filters: string[] = [];

// // scale video
// const scaleFactor = 0.5;
// filters.push(`scale='iw*${scaleFactor}:ih*${scaleFactor}'`);  

// // set max fps
// const maxFps = 10;
// filters.push(`fps='fps=min(${maxFps},source_fps)'`); 

// const qualityLevel = 24;

// const ffmpegArgs = [
//     '-re', // read input at native frame rate, "good for live streams"
//     '-i', streamUrl, // input
//     '-filter:v', filters.join(','), 
//     '-f', 'image2', // use image processor
//     '-c:v', 'mjpeg', // output a jpg
//     '-qscale:v', qualityLevel.toString(), // set quality level
//     // '-frames:v', '1', // output a single frame
//     '-update', '1', // reuse the same output (stdout in this case)
//     'pipe:1', // pipe to stdout
//     '-hide_banner', // don't output copyright notice, build options, library versions
// ];

export class AltRecorder {
    private ff: ChildProcess;

    constructor() {
        const outfile = `output-${Date.now()}-${nanoid(3)}.mkv`;
        const args = [
            '-framerate', '10',
            '-f', 'image2pipe',
            '-c:v', 'mjpeg',
            '-i', '-', 
            '-codec', 'copy',
            outfile,
        ];

        // cat *.jpg | ffmpeg -f image2pipe -c:v mjpeg -i - output.mpg
        console.log('outfile', outfile);
        console.log('args', args);

        this.ff = spawn('ffmpeg', args);
        this.ff.on('close', this.ffmpegClose.bind(this));
        this.ff.on('error', this.ffmpegError.bind(this));
        this.ff.stderr!.on('data', this.ffmpegStderr.bind(this));
        this.ff.stdout!.on('data', this.ffmpegStdout.bind(this));

        this.frame = this.frame.bind(this);
    }

    frame (buffer: Buffer) {
        const data = Buffer.concat([
            buffer,
            Buffer.from('\n'),
        ]);

        this.ff.stdin!.write(data);
    }
    
    private ffmpegClose (code: number) {
        console.log('[ffmpeg]', `exited with code ${code}`);
        // this.emitter.emit(JpegStream.Events.StreamEnd);
    }
    
    private ffmpegError (err: Error) {
        console.error('[ffmpeg]', `Error in ffmpeg.`, err);
    }
    
    private ffmpegStderr (buffer: Buffer) {
        console.error('[ffmpeg]', buffer.toString());
    }

    private ffmpegStdout (buffer: Buffer) {
        console.error('[ffmpeg]', buffer.toString());
    }
}