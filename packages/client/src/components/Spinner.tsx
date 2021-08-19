import React from 'react';
import spinnerSvg from '../svg/graba.svg';
import { theme } from '../theme';
import './Spinner.scss';

interface Props {
    waitFor: Promise<any>;
}

interface State {
    ready: boolean;
}

const spinnerStyle: React.CSSProperties = {
    display: 'block',
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    textAlign: 'center',
    lineHeight: '100vh',
    backgroundColor: theme.palette.white,
    opacity: 0.75,
};

const spinnerImgStyle: React.CSSProperties = {
    animationName: 'spinner-animate',
    animationDuration: '1.5s',
    animationIterationCount: 'infinite',
    transformOrigin: '50% 50%',
};

export class Spinner extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            ready: false
        };
    }

    componentDidMount() {
        this.props.waitFor.then(() => this.setState({ ready: true }));
    }

    render() {
        // if ready, return children
        if (this.state.ready) {
            return this.props.children;
        }

        // if not ready, show loading indicator
        return (
            <div className="spinner" style={spinnerStyle}>
                <img alt="Loading..." src={spinnerSvg} style={spinnerImgStyle}/>
            </div>
        );
    }
}