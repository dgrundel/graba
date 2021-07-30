import React from 'react';

interface Props {
    callback: () => void;
    interval: number; // ms
}

interface State {
}

export class Interval extends React.Component<Props, State> {
    private intervalId: any;

    componentDidMount() {
        this.intervalId = setInterval(this.props.callback, this.props.interval);
    }

    componentWillUnmount() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }

    render() {
        return this.props.children;
    }
}