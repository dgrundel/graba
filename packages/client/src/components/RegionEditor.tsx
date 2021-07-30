import React from 'react';
import { Feed } from 'hastycam.interface';

interface Props {
    feed: Feed;
}

interface State {
}

type Rect = [number, number, number, number];

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
            const rects: Rect[] = [];

            let mousedown = false;
            let originX = -1;
            let originY = -1;
            let x = -1;
            let y = -1;
            let lastRect: Rect | undefined;

            const frameHandler = () => {
                if (!mousedown) {
                    return;
                }

                // TODO: scaling

                // TODO: normalize these to prevent negative numbers
                const width = x - originX;
                const height = y - originY;
                lastRect = [originX, originY, width, height];
                
                ctx.clearRect(0, 0, c.width, c.height);
                ctx.drawImage(image, 0 , 0);
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#0f0';
                rects.forEach(r => ctx.strokeRect(...r));
                ctx.strokeRect(...lastRect);

                window.requestAnimationFrame(frameHandler);
            };
            this.onMouseDown = (e: MouseEvent) => {
                const rect = c.getBoundingClientRect();
                mousedown = true;
                originX = e.clientX - rect.x;
                originY = e.clientY - rect.y;
                window.requestAnimationFrame(frameHandler);
            };
            this.onMouseUp = () => {
                mousedown = false;
                originX = -1;
                originY = -1;

                if (lastRect) {
                    rects.push(lastRect);
                    console.log('all rects', rects);
                }

                lastRect = undefined;
            };
            this.onMouseMove = (e: MouseEvent) => {
                const rect = c.getBoundingClientRect();
                x = e.clientX - rect.x;
                y = e.clientY - rect.y;
            };

            window.addEventListener('mousedown', this.onMouseDown);
            window.addEventListener('mouseup', this.onMouseUp);
            window.addEventListener('mousemove', this.onMouseMove);
            
            image.addEventListener('load', () => {
                c.width = image.width;
                c.height = image.height;
                ctx.drawImage(image, 0 , 0);
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