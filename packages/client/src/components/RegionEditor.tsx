import React, { Component } from 'react';
import { Feed } from 'hastycam.interface';

interface Props {
    feed: Feed;
    onChange?: (regions: Region[]) => void;
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

export class RegionEditor extends React.Component<Props, State> {
    private readonly ref: React.RefObject<HTMLCanvasElement>;
    private onMouseDown?: (e: MouseEvent) => void;
    private onMouseUp?: (e: MouseEvent) => void;
    private onMouseMove?: (e: MouseEvent) => void;
    private onCanvasKeyUp?: (e: KeyboardEvent) => void;
    private regions: Region[];

    constructor(props: Props) {
        super(props);

        this.ref = React.createRef();
        this.regions = props.feed.motionRegions || [];
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

    componentDidMount() {
        const feed = this.props.feed;

        this.withCanvas((c, ctx) => {
            const image = new Image();

            let mousedown = false;
            let clickX = -1;
            let clickY = -1;
            let mouseX = -1;
            let mouseY = -1;
            let canvasRect: DOMRect | undefined;
            let activeRegion: Region | undefined;
            let selectedRegion: Region | undefined;

            const drawRect = (r: Region) => {
                ctx.fillStyle = 'rgba(255,0,0,0.4)';
                ctx.fillRect(...r);
            };

            const highlightRect = (r: Region) => {
                ctx.strokeStyle = '#f00';
                ctx.lineWidth = 3;
                ctx.strokeRect(...r);
            };

            const drawFrame = () => {
                ctx.clearRect(0, 0, c.width, c.height);
                if (image.width && image.height) {
                    ctx.drawImage(image, 0 , 0);
                }
                this.regions.forEach(drawRect);
                
                if (activeRegion) {
                    drawRect(activeRegion);
                }
                if (selectedRegion) {
                    highlightRect(selectedRegion);
                }
            };

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

                if (width !== 0 && height !== 0) {
                    // prevent negative widths and heights
                    const originX = (offsetClickX * scaleX) + (width < 0 ? width : 0)
                    const originY = (offsetClickY * scaleY) + (height < 0 ? height : 0)

                    activeRegion = [originX, originY, Math.abs(width), Math.abs(height)];    
                } else {
                    activeRegion = undefined;
                }
                
                drawFrame();

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

                // clear selection, we might reset it in a minute
                selectedRegion = undefined;

                if (activeRegion) {
                    // we're just finished drawing a rectangle
                    // so add it to the list

                    // make sure it's visible
                    const [,,width,height] = activeRegion;
                    if (width > 0 && height > 0) {
                        this.addRegion(activeRegion);
                    }

                    // select our newly created region
                    selectedRegion = activeRegion;
                } else {
                    // we weren't drawing a rectangle 
                    // this is just a click
                    // so we modify the active selection

                    const p: Point = scaleAndOffsetPoint([
                        mouseX,
                        mouseY,
                    ], canvasRect, c);
                    
                    // see if the mouse click happened within a region
                    // iterate in reverse order so that for overlapping
                    // regions we get the most recent one first
                    let i = this.regions.length;
                    while (i--) {
                        if (isPointInRegion(p, this.regions[i])) {
                            selectedRegion = this.regions[i];
                            break;
                        }
                    }
                }

                window.requestAnimationFrame(drawFrame);
                activeRegion = undefined;
            };
            
            this.onMouseMove = (e: MouseEvent) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
            };

            this.onCanvasKeyUp = (e: KeyboardEvent) => {
                const key = e.key;
                if (key === 'Delete' && selectedRegion) {
                    this.deleteRegion(selectedRegion);
                    selectedRegion = undefined;
                    window.requestAnimationFrame(drawFrame);
                }
            };

            window.addEventListener('mousedown', this.onMouseDown);
            window.addEventListener('mouseup', this.onMouseUp);
            window.addEventListener('mousemove', this.onMouseMove);
            c.addEventListener('keyup', this.onCanvasKeyUp);
            
            image.addEventListener('load', () => {
                if (image.width && image.height) {
                    c.width = image.width;
                    c.height = image.height;
                    drawFrame();
                }
            }, false);
            image.src = `/feed/still/${feed.id}`;
        });
    }

    componentWillUnmount() {
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

        this.withCanvas((c, ctx) => {
            ctx.clearRect(0, 0, c.width, c.height);

            if (this.onCanvasKeyUp) {
                c.removeEventListener('keyup', this.onCanvasKeyUp);
                this.onCanvasKeyUp = undefined;
            }
        });
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

        return <div>
            <canvas tabIndex={10000} ref={this.ref} style={canvasStyle}></canvas>
        </div>;
    }
}