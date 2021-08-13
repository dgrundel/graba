import React from 'react';
import { Text, PrimaryButton, Stack } from '@fluentui/react';
import { Config, Feed } from 'graba.interface';
import { Spinner } from './Spinner';
import { theme } from '../theme';
import { FeedEditor } from './FeedEditor';
import { nanoid } from 'nanoid';
import { deleteRequest, getJson } from '../fetch';
import { Grid } from './Grid';

interface State {
    config: Config;
}

export class FeedConfigEditor extends React.Component<{}, State> {
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
        this.updateFeed = this.updateFeed.bind(this);
    }

    componentDidMount() {
        this.loader.then((config: Config) => {
            this.setState({
                config
            });
        });
    }

    addFeed() {
        const newFeed: Feed = { 
            id: nanoid(Feed.ID_LENGTH),
            name: '',
            streamUrl: '',
            maxFps: Feed.DEFAULT_MAX_FPS,
            videoQuality: Feed.DEFAULT_VIDEO_QUALITY,
            scaleFactor: 1.0,
            motionSampleInterval: Feed.DEFAULT_MOTION_SAMPLE_INTERVAL,
            motionDiffThreshold: Feed.DEFAULT_MOTION_DIFF_THRESHOLD,
        };
        this.setState(prev => {
            const feeds = prev.config.feeds.concat(newFeed);
            return {
                config: {
                    ...prev.config,
                    feeds
                }
            }
        });
    }

    deleteFeed(id: string) {
        deleteRequest(`/feed/${id}`)
            .then(() => getJson<Config>('/config'))
            .then(config => this.setState({ config }));
    }

    updateFeed(feed: Feed) {
        this.setState(prev => {
            const feeds = prev.config.feeds.slice();
            const i = feeds.findIndex(f => f.id === feed.id);
            if (i !== -1) {
                feeds.splice(i, 1, feed);
            }

            return {
                config: {
                    ...prev.config,
                    feeds,
                },
            };
        });
    }

    render() {
        return <Spinner waitFor={this.loader}>
            <Stack tokens={{ childrenGap: 'm', }}>
                <Text block variant="xLarge">Feeds</Text>

                <Stack horizontal horizontalAlign="start">
                    <PrimaryButton iconProps={{ iconName: 'Plus' }} text="Add Feed" onClick={this.addFeed}/>
                </Stack>

                <Grid columns={2}>
                    {this.state.config.feeds.map(feed => {
                        return <Stack key={feed.id} tokens={{ childrenGap: 's1', padding: 'm' }} style={{ backgroundColor: theme.palette.neutralLighter }}>
                            <FeedEditor feed={feed} deleteFeed={this.deleteFeed} updateConfig={this.updateFeed} />
                        </Stack>;
                    })}
                </Grid>

                {this.state.config.feeds.length > 0 ? <Stack horizontal horizontalAlign="start">
                    <PrimaryButton iconProps={{ iconName: 'Plus' }} text="Add Feed" onClick={this.addFeed}/>
                </Stack> : ''}
            </Stack>
        </Spinner>;
    }
}