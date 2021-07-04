import React from 'react';


type RequiredPropNames = 'alt' | 'src';
type AllImgProps = React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;
type RequiredProps = Pick<Required<AllImgProps>, RequiredPropNames>;
type OptionalProps = Omit<Partial<AllImgProps>, RequiredPropNames>;

interface Props extends OptionalProps, RequiredProps {

};
interface State {
};

const EMPTY_SRC = '';

/**
 * An <img> tag whose `src` attribute is emptied when it is unmounted
 * and reset when it is mounted again.
 * 
 * React hangs on to DOM nodes even when they're not in use. This is
 * generally a good thing, but for MJPEG streams in an <img> tag, this
 * means the browser continues to read the stream and keeps the connection
 * open, which can have its own performance penalties.
 * 
 * This implementation should provide the best of both worlds; DOM node
 * caching without keeping the MJPEG stream open in the background.
 */
export class StreamImg extends React.Component<Props, State> {
    private readonly ref: React.RefObject<HTMLImageElement>;
    
    constructor(props: Props) {
        super(props);
        this.ref = React.createRef();
    }

    setSrc(src: string) {
        const node = this.ref.current;
        if (node) {
            node.src = src;
        }
    }

    componentDidMount() {
        this.setSrc(this.props.src);
    }

    componentWillUnmount() {
        this.setSrc(EMPTY_SRC);
    }

    render() {
        return <img ref={this.ref} {...this.props} />
    }
}