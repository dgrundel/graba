import React from 'react';
import { ActionButton, Text, PrimaryButton, Stack, TextField } from '@fluentui/react';
import { Config } from 'hastycam.interface';
import { Spinner } from './Spinner';
import './Options.scss';
import { theme } from '../theme';

interface State {
    config?: Config;
}

export class Options extends React.Component<{}, State> {
    private readonly loader: Promise<any>;

    constructor(props: any) {
        super(props);

        this.state = {};
        this.loader = fetch('http://localhost:4000/config')
            .then(response => response.json());
    }

    componentDidMount() {
        this.loader.then(config => {
            this.setState({
                config
            });
        });
    }

    render() {
        return <Spinner waitFor={this.loader}>
            <h2><Text variant="xLarge">Feeds</Text></h2>

            <Stack tokens={{ childrenGap: 's1', }}>
                {this.state.config?.feeds.map(feed => {
                    return <Stack tokens={{ childrenGap: 's1', padding: 'm' }} style={{ backgroundColor: theme.palette.neutralLighter }}>
                        <TextField
                            label="Feed Name"
                            value={feed.name}
                            onChange={() => { /* fuck off, react */ }}
                        />
                        <TextField
                            label="Stream URL"
                            value={feed.streamUrl}
                            onChange={() => { /* fuck off, react */ }}
                        />
                        <Stack horizontal horizontalAlign="end">
                            <ActionButton text="Delete Feed"/>
                        </Stack>
                    </Stack>;
                })}
            </Stack>

            <PrimaryButton text="Add Feed"/>
        </Spinner>;
    }
}