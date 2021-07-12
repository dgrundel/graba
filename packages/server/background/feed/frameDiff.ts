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

    const options = Object.assign({}, defaultOptions, userOptions) as Required<Options>;

    if (img1.length !== width * height * 3) {
        throw new Error('Image data size does not match width/height.');
    }

    let output: Buffer | undefined;
    if (options.generateOutput) {
        output = Buffer.alloc(img1.length);
    }

    // maximum acceptable square distance between two colors;
    // 35215 is the maximum possible value for the YIQ difference metric
    const maxDelta = 35215 * options.threshold * options.threshold;
    let diffCount = 0;

    // compare each pixel of one image against the other one
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {

            const pos = (y * width + x) * 3;

            // squared YUV distance between colors at this pixel position, negative if the img2 pixel is darker
            const delta = colorDelta(img1, img2, pos, pos);

            // the color difference is above the threshold
            if (Math.abs(delta) > maxDelta) {
                // found substantial difference; draw it as such
                if (output) {
                    drawPixel(output, pos, ...(delta < 0 && options.diffColorAlt || options.diffColor));
                }
                diffCount++;

            } else if (output && options.diffMask !== true) {
                // pixels are similar; draw background as grayscale image blended with white
                // since a diff mask was not requested, we draw the non-diff px
                // drawGrayPixel(img1, pos, options.alpha, output);
                copyPixel(img1, pos, output);
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
function colorDelta(img1: Pixels, img2: Pixels, k: number, m: number) {
    let r1 = img1[k + 0];
    let g1 = img1[k + 1];
    let b1 = img1[k + 2];

    let r2 = img2[m + 0];
    let g2 = img2[m + 1];
    let b2 = img2[m + 2];

    if (r1 === r2 && g1 === g2 && b1 === b2) return 0;

    const y1 = rgb2y(r1, g1, b1);
    const y2 = rgb2y(r2, g2, b2);
    const y = y1 - y2;

    const i = rgb2i(r1, g1, b1) - rgb2i(r2, g2, b2);
    const q = rgb2q(r1, g1, b1) - rgb2q(r2, g2, b2);

    const delta = 0.5053 * y * y + 0.299 * i * i + 0.1957 * q * q;

    // encode whether the pixel lightens or darkens in the sign
    return y1 > y2 ? -delta : delta;
}

function rgb2y(r: number, g: number, b: number) { return r * 0.29889531 + g * 0.58662247 + b * 0.11448223; }
function rgb2i(r: number, g: number, b: number) { return r * 0.59597799 - g * 0.27417610 - b * 0.32180189; }
function rgb2q(r: number, g: number, b: number) { return r * 0.21147017 - g * 0.52261711 + b * 0.31114694; }

function drawPixel(output: Pixels, pos: number, r: number, g: number, b: number) {
    output[pos + 0] = r;
    output[pos + 1] = g;
    output[pos + 2] = b;
}

// blend semi-transparent color with white
// function blend(color: number, alpha: number) {
//     return 255 + (color - 255) * alpha;
// }

// function drawGrayPixel(img: Pixels, i: number, alpha: number, output: Pixels) {
//     const r = img[i + 0];
//     const g = img[i + 1];
//     const b = img[i + 2];
//     const val = blend(rgb2y(r, g, b), alpha * img[i + 3] / 255);
//     drawPixel(output, i, val, val, val);
// }

function copyPixel(img: Pixels, i: number, output: Pixels) {
    const r = img[i + 0];
    const g = img[i + 1];
    const b = img[i + 2];
    drawPixel(output, i, r, g, b);
}
