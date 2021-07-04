import React from 'react';
import { Text, PrimaryButton, Stack } from '@fluentui/react';
import { Config } from 'hastycam.interface';
import { Spinner } from './Spinner';
import { theme } from '../theme';
import { FeedEditor } from './FeedEditor';

interface State extends Config {
}

export class Options extends React.Component<{}, State> {
    private readonly loader: Promise<any>;

    constructor(props: any) {
        super(props);

        this.state = {
            feeds: [],
        };
        this.loader = fetch('http://localhost:4000/config')
            .then(response => response.json());

        this.addFeed = this.addFeed.bind(this);
    }

    componentDidMount() {
        this.loader.then((config: Config) => {
            this.setState({
                ...config
            });
        });
    }

    addFeed() {
        this.setState(prev => ({
            ...prev,
            feeds: prev.feeds.concat({ name: '', streamUrl: '' })
        }));
    }

    render() {
        return <Spinner waitFor={this.loader}>
            <h2><Text variant="xLarge">Feeds</Text></h2>

            <Stack tokens={{ childrenGap: 's1', }}>
                {this.state.feeds.map(feed => {
                    return <Stack tokens={{ childrenGap: 's1', padding: 'm' }} style={{ backgroundColor: theme.palette.neutralLighter }}>
                        <FeedEditor feed={feed}/>
                    </Stack>;
                })}

                <Stack horizontal horizontalAlign="start">
                    <PrimaryButton iconProps={{ iconName: 'Plus' }} text="Add Feed" onClick={this.addFeed}/>
                </Stack>

            </Stack>
        </Spinner>;
    }
}