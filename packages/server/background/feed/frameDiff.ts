/**
 * This code is based on PixelMatch:
 * https://github.com/mapbox/pixelmatch
 */

type Pixels = Uint8ClampedArray | Buffer;

interface Options {
    // matching threshold (0 to 1); smaller is more sensitive
    threshold?: number; 
    // opacity of original image in diff output
    alpha?: number; 
    // color of anti-aliased pixels in diff output
    aaColor?: [number, number, number]; 
    // color of different pixels in diff output
    diffColor?: [number, number, number]; 
    // whether to detect dark on light differences between img1 and img2 and set an alternative color to differentiate between the two
    diffColorAlt?: [number, number, number] | null; 
    // draw the diff over a transparent background (a mask)
    diffMask?: boolean; 
    // generate an output image
    generateOutput?: boolean;
}

interface Result {
    diffCount: number;
    diffImage?: Buffer;
}

const defaultOptions: Options = {
    threshold: 0.1,
    alpha: 0.1,
    aaColor: [255, 255, 0],
    diffColor: [255, 0, 0],
    diffColorAlt: null,
    diffMask: false,
    generateOutput: false,
};

export const frameDiff = (img1: Pixels, img2: Pixels, width: number, height: number, userOptions: Options): Result => {

    if (img1.length !== img2.length) {
        throw new Error('Image sizes do not match.');
    }

    if (img1.length !== width * height * 4) {
        throw new Error('Image data size does not match width/height.');
    } 

    const options = Object.assign({}, defaultOptions, userOptions) as Required<Options>;

    let output: Buffer | undefined;
    if (options.generateOutput) {
        output = Buffer.alloc(img1.length);
    }

    // check if images are identical
    const len = width * height;
    const a32 = new Uint32Array(img1.buffer, img1.byteOffset, len);
    const b32 = new Uint32Array(img2.buffer, img2.byteOffset, len);
    let identical = true;

    for (let i = 0; i < len; i++) {
        if (a32[i] !== b32[i]) { identical = false; break; }
    }
    if (identical) { // fast path if identical
        if (output && !options.diffMask) {
            for (let i = 0; i < len; i++) drawGrayPixel(img1, 4 * i, options.alpha, output);
        }
        return { diffCount: 0 };
    }

    // maximum acceptable square distance between two colors;
    // 35215 is the maximum possible value for the YIQ difference metric
    const maxDelta = 35215 * options.threshold * options.threshold;
    let diffCount = 0;

    // compare each pixel of one image against the other one
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {

            const pos = (y * width + x) * 4;

            // squared YUV distance between colors at this pixel position, negative if the img2 pixel is darker
            const delta = colorDelta(img1, img2, pos, pos);

            // the color difference is above the threshold
            if (Math.abs(delta) > maxDelta) {
                // found substantial difference not caused by anti-aliasing; draw it as such
                if (output) {
                    drawPixel(output, pos, ...(delta < 0 && options.diffColorAlt || options.diffColor));
                }
                diffCount++;

            } else if (output) {
                // pixels are similar; draw background as grayscale image blended with white
                if (!options.diffMask) drawGrayPixel(img1, pos, options.alpha, output);
            }
        }
    }

    // return the number of different pixels
    return {
        diffCount: diffCount,
        diffImage: output
    };
}

// calculate color difference according to the paper "Measuring perceived color difference
// using YIQ NTSC transmission color space in mobile applications" by Y. Kotsarenko and F. Ramos

function colorDelta(img1: Pixels, img2: Pixels, k: number, m: number, yOnly?: boolean) {
    let r1 = img1[k + 0];
    let g1 = img1[k + 1];
    let b1 = img1[k + 2];
    let a1 = img1[k + 3];

    let r2 = img2[m + 0];
    let g2 = img2[m + 1];
    let b2 = img2[m + 2];
    let a2 = img2[m + 3];

    if (a1 === a2 && r1 === r2 && g1 === g2 && b1 === b2) return 0;

    if (a1 < 255) {
        a1 /= 255;
        r1 = blend(r1, a1);
        g1 = blend(g1, a1);
        b1 = blend(b1, a1);
    }

    if (a2 < 255) {
        a2 /= 255;
        r2 = blend(r2, a2);
        g2 = blend(g2, a2);
        b2 = blend(b2, a2);
    }

    const y1 = rgb2y(r1, g1, b1);
    const y2 = rgb2y(r2, g2, b2);
    const y = y1 - y2;

    if (yOnly) return y; // brightness difference only

    const i = rgb2i(r1, g1, b1) - rgb2i(r2, g2, b2);
    const q = rgb2q(r1, g1, b1) - rgb2q(r2, g2, b2);

    const delta = 0.5053 * y * y + 0.299 * i * i + 0.1957 * q * q;

    // encode whether the pixel lightens or darkens in the sign
    return y1 > y2 ? -delta : delta;
}

function rgb2y(r: number, g: number, b: number) { return r * 0.29889531 + g * 0.58662247 + b * 0.11448223; }
function rgb2i(r: number, g: number, b: number) { return r * 0.59597799 - g * 0.27417610 - b * 0.32180189; }
function rgb2q(r: number, g: number, b: number) { return r * 0.21147017 - g * 0.52261711 + b * 0.31114694; }

// blend semi-transparent color with white
function blend(color: number, alpha: number) {
    return 255 + (color - 255) * alpha;
}

function drawPixel(output: Pixels, pos: number, r: number, g: number, b: number) {
    output[pos + 0] = r;
    output[pos + 1] = g;
    output[pos + 2] = b;
    output[pos + 3] = 255;
}

function drawGrayPixel(img: Pixels, i: number, alpha: number, output: Pixels) {
    const r = img[i + 0];
    const g = img[i + 1];
    const b = img[i + 2];
    const val = blend(rgb2y(r, g, b), alpha * img[i + 3] / 255);
    drawPixel(output, i, val, val, val);
}
