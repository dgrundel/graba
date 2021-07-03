import React from 'react';
import { Config } from 'hastycam.interface';

interface State {
    config?: Config;
}

export class Options extends React.Component<{}, State> {

    constructor() {
        super({});

        this.state = {};
    }

    componentDidMount() {
        fetch('http://localhost:4000/config')
            .then(response => response.json())
            .then(config => {
                this.setState({
                    config
                });
            });
    }

    render() {
        return (
            <div>
                <pre>{JSON.stringify(this.state.config, null, 4)}</pre>
            </div>
        );
    }
}