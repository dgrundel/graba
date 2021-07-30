import React from 'react';
import { Feed } from 'hastycam.interface';

interface Props {
    feed: Feed;
}

interface State {
}

type Point = [number, number];
type Region = [number, number, number, number];

const isPointInRegion = (p: Point, r: Region): boolean => {
    const [x, y] = p;
    const [xMin, yMin, w, h] = r;
    const xMax = xMin + w;
    const yMax = yMin + h;

    return x <= xMax && x >= xMin && y <= yMax && y >= yMin;
};

const getCorners = (r: Region): [Point, Point, Point, Point] => {
    const [x, y, w, h] = r;
    const tl: Point = [x, y];
    const tr: Point = [x + w, y];
    const br: Point = [x + w, y + h];
    const bl: Point = [x, y + h];

    return [ tl, tr, br, bl, ];
};

const isOverlap = (r1: Region, r2: Region): boolean => {
    return getCorners(r1).some(p => isPointInRegion(p, r2)) ||
        getCorners(r2).some(p => isPointInRegion(p, r1));
};

// https://codereview.stackexchange.com/a/196783
const getIntersectingRectangle = (reg1: Region, reg2: Region): Region | undefined => {
    const [rx1, rx2] = [reg1, reg2].map(reg => ({
        x: [
            reg[0],
            reg[0] + reg[2],
        ].sort((a,b) => a - b),
        y: [
            reg[1],
            reg[1] + reg[3],
        ].sort((a,b) => a - b)
    }));

    const noIntersect = rx2.x[0] > rx1.x[1] || rx2.x[1] < rx1.x[0] ||
                        rx2.y[0] > rx1.y[1] || rx2.y[1] < rx1.y[0];
    if (noIntersect) {
        return undefined;
    }

    const x1 = Math.max(rx1.x[0], rx2.x[0]); // _[0] is the lesser,
    const y1 = Math.max(rx1.y[0], rx2.y[0]); // _[1] is the greater
    const x2 = Math.min(rx1.x[1], rx2.x[1]);
    const y2 = Math.min(rx1.y[1], rx2.y[1]);

    return [
        x1,
        y1,
        x2 - x1,
        y2 - y1,
    ];
};

const findIntersections = (regions: Region[]): Region[] => {
    const intersections: Region[] = [];

    for (let i = 0; i < regions.length; i++) {
        const r1 = regions[i];
        for (let j = i+1; j < regions.length; j++) {
            const r2 = regions[j];
            const intersect = getIntersectingRectangle(r1, r2);
            if (intersect) {
                intersections.push(intersect);
            }
        }
    }

    return intersections;
};

export class RegionEditor extends React.Component<Props, State> {
    private readonly ref: React.RefObject<HTMLCanvasElement>;
    private onMouseDown?: (e: MouseEvent) => void;
    private onMouseUp?: (e: MouseEvent) => void;
    private onMouseMove?: (e: MouseEvent) => void;

    constructor(props: Props) {
        super(props);

        this.ref = React.createRef();
    }

    componentDidMount() {
        const feed = this.props.feed;

        this.withCanvas((c, ctx) => {
            const image = new Image();
            const regions: Region[] = [];

            let mousedown = false;
            let clickX = -1;
            let clickY = -1;
            let mouseX = -1;
            let mouseY = -1;
            let canvasRect: DOMRect | undefined;
            let lastRegion: Region | undefined;

            const frameHandler = () => {
                if (!mousedown) {
                    return;
                }

                const rect = canvasRect!;

                const scaleX = c.width / rect.width;
                const scaleY = c.height / rect.height;

                const offsetMouseX = mouseX - rect.x;
                const offsetMouseY = mouseY - rect.y;

                const offsetClickX = clickX - rect.x;
                const offsetClickY = clickY - rect.y

                const width = (offsetMouseX - offsetClickX) * scaleX;
                const height = (offsetMouseY - offsetClickY) * scaleY;
                
                // prevent negative widths and heights
                const originX = (offsetClickX * scaleX) + (width < 0 ? width : 0)
                const originY = (offsetClickY * scaleY) + (height < 0 ? height : 0)

                lastRegion = [originX, originY, Math.abs(width), Math.abs(height)];
                
                ctx.clearRect(0, 0, c.width, c.height);
                if (image.width && image.height) {
                    ctx.drawImage(image, 0 , 0);
                }
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#f00';
                regions.forEach(r => ctx.strokeRect(...r));
                ctx.strokeRect(...lastRegion);

                window.requestAnimationFrame(frameHandler);
            };
            
            this.onMouseDown = (e: MouseEvent) => {
                mousedown = true;
                
                canvasRect = c.getBoundingClientRect();
                clickX = e.clientX;
                clickY = e.clientY;
                
                window.requestAnimationFrame(frameHandler);
            };
            
            this.onMouseUp = () => {
                mousedown = false;

                if (lastRegion) {
                    const [,,width,height] = lastRegion;
                    if (width > 0 && height > 0) {
                        regions.push(lastRegion);
                        console.log('all rects', regions);
                    }
                }

                ctx.fillStyle = '#0f0';
                findIntersections(regions).forEach(intersect => ctx.fillRect(...intersect));

                lastRegion = undefined;
            };
            
            this.onMouseMove = (e: MouseEvent) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
            };

            window.addEventListener('mousedown', this.onMouseDown);
            window.addEventListener('mouseup', this.onMouseUp);
            window.addEventListener('mousemove', this.onMouseMove);
            
            image.addEventListener('load', () => {
                if (image.width && image.height) {
                    c.width = image.width;
                    c.height = image.height;
                    ctx.drawImage(image, 0 , 0);
                }
            }, false);
            image.src = `/feed/still/${feed.id}`;
        });
    }

    componentWillUnmount() {
        this.withCanvas((c, ctx) => {
            ctx.clearRect(0, 0, c.width, c.height);
        });

        if (this.onMouseDown) {
            window.removeEventListener('mousedown', this.onMouseDown);
            this.onMouseDown = undefined;
        }
        if (this.onMouseUp) {
            window.removeEventListener('mouseup', this.onMouseUp);
            this.onMouseUp = undefined;
        }
        if (this.onMouseMove) {
            window.removeEventListener('mousemove', this.onMouseMove);
            this.onMouseMove = undefined;
        }
    }

    withCanvas(callback: (c: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void) {
        const c = this.ref.current;
        if (c) {
            const ctx = c.getContext('2d');
            if (ctx) {
                callback(c, ctx);
            }
        }
    }

    render() {
        const canvasStyle: React.CSSProperties = {
            maxWidth: '100%',
        };

        return <canvas ref={this.ref} style={canvasStyle}></canvas>;
    }
}