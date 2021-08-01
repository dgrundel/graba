
export type Point = [ x: number, y: number];
export type Size = [ width: number, height: number];
export type MotionRegion = [ ...Point, ...Size ];

export const percentToImageOffsetPx = (pt: Point, size: Size): Point => {
    const [percentX, percentY] = pt;
    const [pxWidth, pxHeight] = size;

    return [
        percentX * pxWidth,
        percentY * pxHeight,
    ];
};

export const isPointInRegion = (p: Point, r: MotionRegion): boolean => {
    const [x, y] = p;
    const [xMin, yMin, w, h] = r;
    const xMax = xMin + w;
    const yMax = yMin + h;

    return x <= xMax && x >= xMin && y <= yMax && y >= yMin;
};