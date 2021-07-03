import React from 'react';
import { Config } from 'hastycam.interface';
import { Spinner } from './Spinner';

interface State {
    config?: Config;
}

export class Options extends React.Component<{}, State> {
    private readonly loader: Promise<void>;

    constructor() {
        super({});

        this.state = {};
        this.loader = fetch('http://localhost:4000/config')
            .then(response => response.json())
            .then(config => {
                this.setState({
                    config
                });
            });
    }

    render() {
        return <Spinner waitFor={this.loader}>
            {JSON.stringify(this.state.config, null, 4)}
        </Spinner>;
    }
}