import { ChildProcess, spawn } from 'child_process';
import { nanoid } from 'nanoid';

export class AltRecorder {
    private ff: ChildProcess;

    constructor() {
        const outfile = `output-${Date.now()}-${nanoid(3)}.mkv`;
        const args = [
            // use current time as timestamp for each frame
            // we're piping in frames in real time, so use the
            // actual current time as the timestamp
            '-use_wallclock_as_timestamps', '1', 
            // get input piped from stdin
            '-f', 'image2pipe',
            // input format is jpeg
            '-c:v', 'mjpeg',
            // input file is stdin/pipe
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