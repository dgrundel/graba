import React from 'react';

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
            <div>
                Loading...
            </div>
        );
    }
}