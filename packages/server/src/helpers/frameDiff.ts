import { isPointInRegion, MotionRegion } from 'hastycam.interface';

type Pixels = Uint8ClampedArray | Buffer;
type MinMaxXY = {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
};

export interface FrameDiffOptions {
    // matching threshold (0 to 1); smaller is more sensitive
    colorThreshold: number;
    // color of different pixels in diff output
    diffColor: [number, number, number];
    // whether to detect dark on light differences between img1 and img2 and set an alternative color to differentiate between the two
    diffColorAlt: [number, number, number];
    // check for diff every {n} pixels. A value of 1 checks every pixel. Applied to x and y directions.
    sampleInterval: number;
    // regions.
    regions: MotionRegion[];
}

export interface FrameDiffResult {
    pxDiffCount: number;
    pxAnalyzeCount: number;
    pixelData: Buffer;
}

const defaultOptions: FrameDiffOptions = {
    colorThreshold: 0.1,
    diffColor: [255, 0, 0],
    diffColorAlt: [255, 0, 0],
    sampleInterval: 1,
    regions: [],
};

const CHANNELS = 3;

/**
 * This code is based on PixelMatch:
 * https://github.com/mapbox/pixelmatch
 * 
 * However, there are lots of modifications:
 * - dropped alpha channel
 * - added sampling
 * - added regions
 */
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
        regions,
    } = Object.assign({}, defaultOptions, options) as FrameDiffOptions;

    // maximum acceptable square distance between two colors;
    // 35215 is the maximum possible value for the YIQ difference metric
    const maxDelta = 35215 * colorThreshold * colorThreshold;
    
    let pxDiffCount = 0;
    let pxAnalyzeCount = 0;
    const output = Buffer.from(img2, img2.byteOffset, img2.length);

    // convert motion regions from % to px
    const pxRegions = percentRegionsToPixels(regions, width, height);
    
    // get extremes from the motion detection regions
    const minMaxXY = getMinMaxXY(pxRegions);

    // calc min and max y pixel values
    const yStart = minMaxXY ? minMaxXY.minY : 0;
    const yMax = minMaxXY ? minMaxXY.maxY : height;

    // sample pixels every ${step} pixels
    for (let y = yStart; y < yMax; y += sampleInterval) {

        // calc min and max x pixel values
        // stagger the x start point using the current y value and sample interval
        const xStart = (minMaxXY ? minMaxXY.minX : 0) + (y % sampleInterval);
        const xMax = minMaxXY ? minMaxXY.maxX : width;

        for (let x = xStart; x < xMax; x += sampleInterval) {
            // if this point is outside motion detection regions, skip it.
            if (pxRegions.length > 0 && !isPointInRegionSet(x, y, pxRegions)) {
                continue;
            }

            const pos = (y * width + x) * CHANNELS;

            // squared YUV distance between colors at this pixel position,
            // negative if the img2 pixel is darker
            const delta = colorDelta(img1, img2, pos);

            // the color difference for sample pixel is above the threshold
            if (abs(delta) > maxDelta) {
                const color = delta < 0 ? diffColorAlt : diffColor;
                // found substantial difference; draw it as such
                drawPixel(output, pos, ...color);
                pxDiffCount++;
            }

            pxAnalyzeCount++;
        }
    }

    // return the number of different pixels
    return {
        pxDiffCount,
        pxAnalyzeCount,
        pixelData: output
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

/**
 * Get largest and smallest values for x and y.
 * 
 * @param regions Regions as percentages
 */
const getMinMaxXY = (regions: MotionRegion[]): MinMaxXY | undefined => {
    if (regions.length === 0) {
        return undefined;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let i = regions && regions.length || 0;
    while (i--) {
        const [x, y, w, h] = regions[i];
        minX = Math.min(x, minX);
        minY = Math.min(y, minY);
        maxX = Math.max(x + w, maxX);
        maxY = Math.max(y + h, maxY);
    }

    return { minX, minY, maxX, maxY };
};

const isPointInRegionSet = (x: number, y: number, regions: MotionRegion[]) => {
    let i = regions.length;
    while(i--) {
        const isInThisRegion = isPointInRegion([x, y], regions[i]);
        if (isInThisRegion){
            return true;
        }
    }

    return false;
};

const percentRegionsToPixels = (regions: MotionRegion[] | undefined, pxWidth: number, pxHeight: number): MotionRegion[] => {
    return (regions || []).map(r => {
        const [x, y, w, h] = r;
        return [
            Math.max(0, Math.floor(x * pxWidth)),
            Math.max(0, Math.floor(y * pxHeight)),
            Math.min(pxWidth, Math.ceil(w * pxWidth)),
            Math.min(pxHeight, Math.ceil(h * pxHeight)),
        ];
    });
};