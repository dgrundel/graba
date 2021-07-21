import React, { CSSProperties } from 'react';
import { Text, Stack, Icon } from '@fluentui/react';
import { Config, Feed } from 'hastycam.interface';
import { Spinner } from './Spinner';
import { getJson } from '../fetch';
import { Grid } from './Grid';
import { Overlay } from './Overlay';
import { theme } from '../theme';

interface State {
    feeds: Feed[];
}

const FEED_ID_LENGTH = 12;

export class Dashboard extends React.Component<{}, State> {
    private readonly loader: Promise<Config>;

    constructor(props: any) {
        super(props);

        this.state = {
            feeds: [],
        };

        this.loader = getJson<Config>('http://localhost:4000/config');
    }

    componentDidMount() {
        this.loader.then((config: Config) => {
            this.setState({
                feeds: config.feeds
            });
        });
    }

    render() {
        const recIndicator = <Text block variant="smallPlus" style={{ color: 'red' }}>
            <Icon iconName="PlayerRecord"/>
            Rec
        </Text>;

        return <Spinner waitFor={this.loader}>
            <Stack tokens={{ childrenGap: 'm', }}>
                <Text block variant="xLarge">Feeds</Text>

                <Grid columns={4}>
                    {this.state.feeds.map(feed => {
                        return <Overlay position="tr" element={feed.saveVideo ? recIndicator : undefined}>
                            <img alt={feed.name} src={`http://localhost:4000/feed/still/${feed.id}`} style={{ maxWidth: '100%', objectFit: 'contain' }}/>
                        </Overlay>
                    })}
                </Grid>
            </Stack>
        </Spinner>;
    }
}