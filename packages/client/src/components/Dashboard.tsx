import React, { CSSProperties } from 'react';
import { Text, Stack } from '@fluentui/react';
import { Config, Feed } from 'hastycam.interface';
import { Spinner } from './Spinner';
import { getJson } from '../fetch';
import { Grid } from './Grid';
import { Overlay } from './Overlay';

interface State {
    feeds: Feed[];
}

const recIndicatorStyle: CSSProperties = {
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
    color: '#fff',
    padding: '0.1em',
    display: 'inline-block',
    lineHeight: 1,
    fontSize: '12px',
    textTransform: 'uppercase',
    borderRadius: '0.2em',
};

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
        const recIndicator = <Text block variant="smallPlus" style={recIndicatorStyle}>Rec</Text>;

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