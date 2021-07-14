/**
 * This code is based on PixelMatch:
 * https://github.com/mapbox/pixelmatch
 */

type Pixels = Uint8ClampedArray | Buffer;

export interface FrameDiffOptions {
    // matching threshold (0 to 1); smaller is more sensitive
    colorThreshold: number;
    // color of different pixels in diff output
    diffColor: [number, number, number];
    // whether to detect dark on light differences between img1 and img2 and set an alternative color to differentiate between the two
    diffColorAlt: [number, number, number];
    // check for diff every {n} pixels. A value of 1 checks every pixel. Applied to x and y directions.
    sampleInterval: number;
}

export interface FrameDiffResult {
    count: number;
    pixels: Buffer;
}

const defaultOptions: FrameDiffOptions = {
    colorThreshold: 0.1,
    diffColor: [255, 0, 0],
    diffColorAlt: [255, 0, 0],
    sampleInterval: 1,
};

const CHANNELS = 3;

export const frameDiff = (img1: Pixels, img2: Pixels, width: number, height: number, options: Partial<FrameDiffOptions>): FrameDiffResult => {
    if (img1.length !== img2.length) {
        throw new Error('Image sizes do not match.');
    }
    if (img1.length !== width * height * CHANNELS) {
        throw new Error('Image data size does not match width/height.');
    }

    const {
        colorThreshold,
        diffColor,
        diffColorAlt,
        sampleInterval,
    } = Object.assign({}, defaultOptions, options) as FrameDiffOptions;

    // maximum acceptable square distance between two colors;
    // 35215 is the maximum possible value for the YIQ difference metric
    const maxDelta = 35215 * colorThreshold * colorThreshold;
    
    let count = 0;
    const output = Buffer.from(img2, img2.byteOffset, img2.length);

    // sample pixels every ${step} pixels
    for (let y = 0; y < height; y += sampleInterval) {
        for (let x = y % sampleInterval; x < width; x += sampleInterval) {
            const pos = (y * width + x) * CHANNELS;

            // squared YUV distance between colors at this pixel position,
            // negative if the img2 pixel is darker
            const delta = colorDelta(img1, img2, pos);

            // the color difference for sample pixel is above the threshold
            if (abs(delta) > maxDelta) {
                const color = delta < 0 ? diffColorAlt : diffColor;
                // found substantial difference; draw it as such
                drawPixel(output, pos, ...color);
                count++;
            }
        }
    }

    // return the number of different pixels
    return {
        count,
        pixels: output
    };
}

const abs = (n: number): number => n < 0 ? -n : n;

// calculate color difference according to the paper "Measuring perceived color difference
// using YIQ NTSC transmission color space in mobile applications" by Y. Kotsarenko and F. Ramos
const colorDelta = (img1: Pixels, img2: Pixels, pos: number): number => {
    let r1 = img1[pos + 0];
    let g1 = img1[pos + 1];
    let b1 = img1[pos + 2];

    let r2 = img2[pos + 0];
    let g2 = img2[pos + 1];
    let b2 = img2[pos + 2];

    if (r1 === r2 && g1 === g2 && b1 === b2) return 0;

    const y1 = rgb2y(r1, g1, b1);
    const y2 = rgb2y(r2, g2, b2);
    const y = y1 - y2;

    const i = rgb2i(r1, g1, b1) - rgb2i(r2, g2, b2);
    const q = rgb2q(r1, g1, b1) - rgb2q(r2, g2, b2);

    const delta = 0.5053 * y * y + 0.299 * i * i + 0.1957 * q * q;

    // encode whether the pixel lightens or darkens in the sign
    return y1 > y2 ? -delta : delta;
};

const rgb2y = (r: number, g: number, b: number): number => { return r * 0.29889531 + g * 0.58662247 + b * 0.11448223; };
const rgb2i = (r: number, g: number, b: number): number => { return r * 0.59597799 - g * 0.27417610 - b * 0.32180189; };
const rgb2q = (r: number, g: number, b: number): number => { return r * 0.21147017 - g * 0.52261711 + b * 0.31114694; };

const drawPixel = (output: Pixels, pos: number, r: number, g: number, b: number): void => {
    output[pos + 0] = r;
    output[pos + 1] = g;
    output[pos + 2] = b;
};
