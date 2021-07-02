import React from 'react';

interface State {
    config: Record<string, any>;
}

export class Config extends React.Component<{}, State> {

    constructor() {
        super({});

        this.state = {
            config: {}
        };
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
                <pre>{JSON.stringify(this.state.config)}</pre>
            </div>
        );
    }
}