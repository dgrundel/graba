import React, { CSSProperties } from 'react';
import { Text, Stack, ProgressIndicator } from '@fluentui/react';
import { Config, Feed, SystemStats } from 'hastycam.interface';
import { Spinner } from './Spinner';
import { getJson } from '../fetch';
import { Grid } from './Grid';
import { Overlay } from './Overlay';
import { humanSize } from '../display';

interface LoaderResult {
    config: Config;
    stats: SystemStats;
}

interface State {
    feeds: Feed[];
    stats?: SystemStats;
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
    private readonly loader: Promise<LoaderResult>;

    constructor(props: any) {
        super(props);

        this.state = {
            feeds: [],
        };

        this.loader = Promise.all([
            getJson<Config>('http://localhost:4000/config'),
            getJson<SystemStats>('http://localhost:4000/dashboard/stats')
        ]).then(([config, stats]) => ({ config, stats }));
    }

    componentDidMount() {
        this.loader.then(({ config, stats }) => {
            this.setState({
                feeds: config.feeds,
                stats,
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


                {this.renderStats()}
            </Stack>
        </Spinner>;
    }
    renderStats() {
        const stats = this.state.stats;

        if (!stats) {
            return undefined;
        }

        return <>
            <Text block variant="xLarge">System Information</Text>

            <Grid columns={4}>
                {stats.load.cpus.map((cpu, i) => <ProgressIndicator 
                    label={`CPU Core ${i + 1} Load`}
                    description={`${cpu.load.toFixed(2)}%`}
                    percentComplete={cpu.load / 100}
                />)}

                <ProgressIndicator 
                    label="Memory Usage" 
                    description={`${humanSize(stats.memory.used)} / ${humanSize(stats.memory.total)}`} 
                    percentComplete={stats.memory.used / stats.memory.total}
                />

                {stats.disks.map(disk => <ProgressIndicator 
                    label={`Disk Usage: ${disk.mount}`}
                    description={`${humanSize(disk.used)} / ${humanSize(disk.size)}`}
                    percentComplete={disk.used / disk.size}
                />)}

                {stats.network.map(net => <>
                    <ProgressIndicator 
                        label={`${net.iface} TX`}
                        description={humanSize(net.tx_sec)}
                        percentComplete={net.tx_sec / 1000000000}
                    />
                    <ProgressIndicator 
                        label={`${net.iface} RX`}
                        description={humanSize(net.rx_sec)}
                        percentComplete={net.rx_sec / 1000000000}
                    />
                </>)}
            </Grid>
        </>;
    }
}