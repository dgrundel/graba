import React from 'react';
import { Feed } from 'hastycam.interface';

interface Props {
    feed: Feed;
}

interface State {
}

type Region = [number, number, number, number];

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
                ctx.strokeStyle = '#0f0';
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