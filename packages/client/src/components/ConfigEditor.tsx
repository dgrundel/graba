import React from 'react';
import { Text, PrimaryButton, Stack, CommandBar, ICommandBarItemProps } from '@fluentui/react';
import { Config } from 'hastycam.interface';
import { Spinner } from './Spinner';
import { theme } from '../theme';
import { FeedEditor } from './FeedEditor';
import { nanoid } from 'nanoid';
import { getJson } from '../fetch';

interface State {
    config: Config;
}

export class ConfigEditor extends React.Component<{}, State> {
    private readonly loader: Promise<Config>;

    constructor(props: any) {
        super(props);

        this.state = {
            config: {
                feeds: [],
            }
        };

        this.loader = getJson<Config>('http://localhost:4000/config');

        this.addFeed = this.addFeed.bind(this);
        this.deleteFeed = this.deleteFeed.bind(this);
    }

    componentDidMount() {
        this.loader.then((config: Config) => {
            this.setState({
                config
            });
        });
    }

    addFeed() {
        this.setState(prev => {
            const feeds = prev.config.feeds.concat({ id: nanoid(), name: '', streamUrl: '' });
            return {
                config: {
                    ...prev.config,
                    feeds
                }
            }
        });
    }

    deleteFeed(id: string) {
        this.setState(prev => {
            const i = prev.config.feeds.findIndex(feed => feed.id === id);
            const feeds = prev.config.feeds.slice();
            if (i !== -1) {
                feeds.splice(i, 1);
            }
            return { 
                config: {
                    ...prev.config,
                    feeds,
                } 
            };
        });
    }

    render() {
        return <Spinner waitFor={this.loader}>
            <Stack tokens={{ childrenGap: 's1', }}>
            <Text block variant="xLarge">Feeds</Text>

                {this.state.config.feeds.map(feed => {
                    return <Stack key={feed.id} tokens={{ childrenGap: 's1', padding: 'm' }} style={{ backgroundColor: theme.palette.neutralLighter }}>
                        <FeedEditor feed={feed} deleteFeed={this.deleteFeed}/>
                    </Stack>;
                })}

                <Stack horizontal horizontalAlign="start">
                    <PrimaryButton iconProps={{ iconName: 'Plus' }} text="Add Feed" onClick={this.addFeed}/>
                </Stack>

            </Stack>
        </Spinner>;
    }
}