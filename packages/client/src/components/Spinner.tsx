import React from 'react';
import spinnerSvg from '../svg/hasty-nostroke.svg';
import './Spinner.scss';

interface Props {
    waitFor: Promise<any>;
}

interface State {
    ready: boolean;
}

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
            <div className="spinner">
                <img alt="Loading..." src={spinnerSvg}/>
            </div>
        );
    }
}