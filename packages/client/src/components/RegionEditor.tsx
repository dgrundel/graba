import React from 'react';
import { Feed, MotionRegion as Region } from 'hastycam.interface';

interface Props {
    feed: Feed;
    onChange?: (regions: Region[]) => void;
}

interface State {
}

type Point = [number, number];

const isPointInRegion = (p: Point, r: Region): boolean => {
    const [x, y] = p;
    const [xMin, yMin, w, h] = r;
    const xMax = xMin + w;
    const yMax = yMin + h;

    return x <= xMax && x >= xMin && y <= yMax && y >= yMin;
};

const scaleAndOffsetPoint = (p: Point, rect?: DOMRect, c?: HTMLCanvasElement): Point => {
    if (!rect || !c) {
        return [-1, -1];
    }

    const [x, y] = p;

    const scaleX = c.width / rect.width;
    const scaleY = c.height / rect.height;

    const offsetX = x - rect.x;
    const offsetY = y - rect.y;

    return [
        offsetX * scaleX,
        offsetY * scaleY,
    ];
};

const viewportPxToOffsetPercent = (pt: Point, rect?: DOMRect, c?: HTMLCanvasElement): Point => {
    if (!rect || !c) {
        return [-1, -1];
    }

    const [viewportX, viewportY] = pt;

    const offsetX = viewportX - rect.x;
    const offsetY = viewportY - rect.y;

    const scaleX = c.width / rect.width;
    const scaleY = c.height / rect.height;

    return [
        (offsetX * scaleX) / c.width,
        (offsetY * scaleY) / c.height,
    ];
};

const percentToCanvasOffsetPx = (pt: Point, rect?: DOMRect, c?: HTMLCanvasElement): Point => {
    if (!rect || !c) {
        return [-1, -1];
    }

    const [percentX, percentY] = pt;

    return [
        percentX * c.width,
        percentY * c.height,
    ];
};

export class RegionEditor extends React.Component<Props, State> {
    private readonly ref: React.RefObject<HTMLCanvasElement>;
    private image?: HTMLImageElement;
    private regions: Region[];
    private mousedown = false;
    private viewportClickX = -1;
    private viewportClickY = -1;
    private viewportMouseX = -1;
    private viewportMouseY = -1;
    private canvasRect: DOMRect | undefined;
    private activeRegion: Region | undefined;
    private selectedRegion: Region | undefined;

    constructor(props: Props) {
        super(props);

        this.ref = React.createRef();
        this.regions = props.feed.motionRegions || [];

        this.addRegion = this.addRegion.bind(this);
        this.deleteRegion = this.deleteRegion.bind(this);
        this.withCanvas = this.withCanvas.bind(this);
        this.drawRect = this.drawRect.bind(this);
        this.highlightRect = this.highlightRect.bind(this);
        this.drawFrame = this.drawFrame.bind(this);
        this.frameHandler = this.frameHandler.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onCanvasKeyUp = this.onCanvasKeyUp.bind(this);
    }

    addRegion(r: Region) {
        this.regions.push(r);
        if (this.props.onChange) {
            this.props.onChange(this.regions);
        }
    }

    deleteRegion(r: Region) {
        const i = this.regions.findIndex(region => r === region);
        if (i !== -1) {
            this.regions.splice(i, 1);
            if (this.props.onChange) {
                this.props.onChange(this.regions);
            }
        }
    }

    withCanvas<T>(callback: (canvasElem: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => T): T | undefined {
        const canvasElem = this.ref.current;
        const ctx = canvasElem ? canvasElem.getContext('2d') : undefined;
        if (ctx) {
            return callback(canvasElem!, ctx);
        }
    }

    drawRect(r: Region) {
        this.withCanvas((c, ctx) => {
            const [x, y, w, h] = r;
            const scaled: Region = [
                ...percentToCanvasOffsetPx([x, y], this.canvasRect, c),
                ...percentToCanvasOffsetPx([w, h], this.canvasRect, c),
            ];
            
            ctx.fillStyle = 'rgba(255,0,0,0.4)';
            ctx.fillRect(...scaled);
        });
    }

    highlightRect(r: Region) {
        this.withCanvas((c, ctx) => {
            const [x, y, w, h] = r;
            const scaled: Region = [
                ...percentToCanvasOffsetPx([x, y], this.canvasRect, c),
                ...percentToCanvasOffsetPx([w, h], this.canvasRect, c),
            ];

            ctx.strokeStyle = '#f00';
            ctx.lineWidth = 3;
            ctx.strokeRect(...scaled);
        });
    }

    drawFrame() {
        this.withCanvas((c, ctx) => {
            // clear canvas
            ctx.clearRect(0, 0, c.width, c.height);
            
            // redraw still image
            if (this.image?.width && this.image.height) {
                ctx.drawImage(this.image, 0 , 0);
            }

            // draw rectangles
            this.regions.forEach(this.drawRect);
            
            // draw rectange in progress
            if (this.activeRegion) {
                this.drawRect(this.activeRegion);
            }

            // add border to selected rectangle
            if (this.selectedRegion) {
                this.highlightRect(this.selectedRegion);
            }
        });
    }

    frameHandler() {
        if (!this.mousedown) {
            return;
        }

        this.withCanvas(c => {
            const [fromX, fromY] = viewportPxToOffsetPercent([
                this.viewportClickX,
                this.viewportClickY
            ], this.canvasRect, c);
            const [toX, toY] = viewportPxToOffsetPercent([
                this.viewportMouseX,
                this.viewportMouseY
            ], this.canvasRect, c);
            
            const width = toX - fromX;
            const height = toY - fromY;
    
            if (width !== 0 && height !== 0) {
                // prevent negative widths and heights
                const x = fromX + (width < 0 ? width : 0);
                const y = fromY + (height < 0 ? height : 0);
    
                this.activeRegion = [x, y, Math.abs(width), Math.abs(height)];    
            } else {
                this.activeRegion = undefined;
            }
            
            this.drawFrame();
    
            window.requestAnimationFrame(this.frameHandler);
        });
    }

    onMouseDown(e: MouseEvent) {
        this.mousedown = true;
        
        this.canvasRect = this.withCanvas(c => c.getBoundingClientRect());
        this.viewportClickX = e.clientX;
        this.viewportClickY = e.clientY;
        
        window.requestAnimationFrame(this.frameHandler);
    };
    
    onMouseUp() {
        this.mousedown = false;

        // clear selection, we might reset it in a minute
        this.selectedRegion = undefined;

        if (this.activeRegion) {
            // we're just finished drawing a rectangle
            // so add it to the list

            // make sure it's visible
            const [,,width,height] = this.activeRegion;
            if (width > 0 && height > 0) {
                this.addRegion(this.activeRegion);
            }

            // select our newly created region
            this.selectedRegion = this.activeRegion;
        } else {
            // we weren't drawing a rectangle 
            // this is just a click
            // so we modify the active selection

            const clickLoc: Point | undefined = this.withCanvas(c => viewportPxToOffsetPercent([
                this.viewportMouseX,
                this.viewportMouseY,
            ], this.canvasRect, c));
            
            if (clickLoc) {
                // see if the mouse click happened within a region
                // iterate in reverse order so that for overlapping
                // regions we get the most recent one first
                let i = this.regions.length;
                while (i--) {
                    if (isPointInRegion(clickLoc, this.regions[i])) {
                        this.selectedRegion = this.regions[i];
                        break;
                    }
                }
            }
            
        }

        window.requestAnimationFrame(this.drawFrame);
        this.activeRegion = undefined;
    };
    
    onMouseMove(e: MouseEvent) {
        this.viewportMouseX = e.clientX;
        this.viewportMouseY = e.clientY;
    };

    onCanvasKeyUp(e: KeyboardEvent) {
        const key = e.key;
        if (key === 'Delete' && this.selectedRegion) {
            this.deleteRegion(this.selectedRegion);
            this.selectedRegion = undefined;
            window.requestAnimationFrame(this.drawFrame);
        }
    };

    componentDidMount() {
        this.withCanvas(c => {
            window.addEventListener('mousedown', this.onMouseDown);
            window.addEventListener('mouseup', this.onMouseUp);
            window.addEventListener('mousemove', this.onMouseMove);
            c.addEventListener('keyup', this.onCanvasKeyUp);
            
            this.image = new Image();
            this.image.addEventListener('load', () => {
                if (this.image?.width && this.image.height) {
                    // resize the canvas to match the image dimensions
                    // canvas will be scaled down with CSS
                    c.width = this.image.width;
                    c.height = this.image.height;
                    this.drawFrame();
                }
            }, false);
            this.image.src = `/feed/still/${this.props.feed.id}`;
        });
    }

    componentWillUnmount() {
        window.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('mouseup', this.onMouseUp);
        window.removeEventListener('mousemove', this.onMouseMove);

        this.withCanvas((c, ctx) => {
            ctx.clearRect(0, 0, c.width, c.height);
            c.removeEventListener('keyup', this.onCanvasKeyUp);
        });
    }

    render() {
        const canvasStyle: React.CSSProperties = {
            maxWidth: '100%',
        };

        return <div>
            <canvas tabIndex={10000} ref={this.ref} style={canvasStyle}></canvas>
        </div>;
    }
}