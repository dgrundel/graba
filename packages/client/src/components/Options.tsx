import React from 'react';
import { DefaultButton, PrimaryButton, Stack } from '@fluentui/react';
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
            <h2>Feeds</h2>

            <Stack tokens={{ childrenGap: 's1', }}>
                {this.state.config?.feeds.map(feed => <div key={feed.name} className="feed-edit-box" style={{ backgroundColor: theme.palette.neutralLighter }}>
                    <label className="block-label">
                        <span>Feed Name</span>
                        <input type="text" value={feed.name} onChange={() => { /* fuck off, react */ }} />
                    </label>
                    <label className="block-label">
                        <span>Stream URL</span>
                        <input type="text" value={feed.streamUrl} onChange={() => { /* fuck off, react */ }} />
                    </label>
                    <DefaultButton text="Delete Feed"/>
                </div>)}
            </Stack>

            <PrimaryButton text="Add Feed"/>
        </Spinner>;
    }
}