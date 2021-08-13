import React from 'react';
import { Text, PrimaryButton, Stack, TextField, Toggle, Separator } from '@fluentui/react';
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

const separatorStyles = {
    root: {
        '::before': { 
            background: theme.palette.neutralQuaternaryAlt,
        }
    }
};

const Note = (props: { field: keyof Config; }) => {
    const content = Config.FIELD_TOOLTIPS[props.field] || null;
    if (content) {
        return <Text block variant="small" style={{ 
            color: theme.palette.neutralTertiary,
            marginTop: 0,
            marginBottom: theme.spacing.s1,
        }}>{content}</Text>
    }
    return null;
};

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
        this.updateFeed = this.updateFeed.bind(this);
    }

    componentDidMount() {
        this.loader.then((config: Config) => {
            this.setState({
                config
            });
        });
    }

    setConfigData(data: Partial<Config>) {
        this.setState(prev => ({
            config: {
                ...prev.config,
                ...data,
            }
        }))
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

    renderMailConfig() {
        return <>
            <Text block variant="xLarge">Outgoing Mail</Text>

            <Stack tokens={{ childrenGap: 's2', }}>
                <Grid columns="3fr 1fr">
                    <div>
                        <TextField
                            label={Config.FIELD_NAMES.smtpServer}
                            value={this.state.config.smtpServer}
                            onChange={(e, smtpServer) => { this.setConfigData({ smtpServer }) }}
                        />
                        <Note field="smtpServer" />
                    </div>
                    <div>
                        <TextField
                            label={Config.FIELD_NAMES.smtpPort}
                            value={this.state.config.smtpPort ? this.state.config.smtpPort.toFixed(0) : undefined}
                            onChange={(e, value) => { 
                                if (value) {
                                    const smtpPort = +value;
                                    if (!isNaN(smtpPort)) {
                                        this.setConfigData({ smtpPort })
                                    }
                                }
                            }}
                        />
                        <Note field="smtpPort" />
                    </div>
                </Grid>

                <Toggle 
                    label={Config.FIELD_NAMES.smtpSecure} 
                    inlineLabel
                    defaultChecked={this.state.config.smtpSecure !== false}
                    onChange={(e, smtpSecure) => this.setConfigData({ smtpSecure })}
                />
                <Note field="smtpSecure" />

                <Grid columns={2}>
                    <div>
                        <TextField
                            label={Config.FIELD_NAMES.smtpUser}
                            value={this.state.config.smtpUser}
                            onChange={(e, smtpUser) => { this.setConfigData({ smtpUser }) }}
                        />
                        <Note field="smtpUser" />
                    </div>
                    <div>
                        <TextField
                            label={Config.FIELD_NAMES.smtpPassword}
                            value={this.state.config.smtpPassword}
                            onChange={(e, smtpPassword) => { this.setConfigData({ smtpPassword }) }}
                        />
                        <Note field="smtpPassword" />
                    </div>
                </Grid>
            </Stack>
        </>;
    }

    renderFeeds() {
        return <>
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
        </>;
    }

    render() {
        return <Spinner waitFor={this.loader}>
            <Stack tokens={{ childrenGap: 'm', }}>
                {this.renderFeeds()}

                <Separator styles={separatorStyles} />

                {this.renderMailConfig()}
            </Stack>
        </Spinner>;
    }
}