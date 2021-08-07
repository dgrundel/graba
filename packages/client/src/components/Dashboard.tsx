import React, { CSSProperties } from 'react';
import { Text, Stack, ProgressIndicator, DetailsList, IColumn, DetailsListLayoutMode, SelectionMode, Separator, Callout, DirectionalHint } from '@fluentui/react';
import { Config, Feed, SystemStats } from 'hastycam.interface';
import { Spinner } from './Spinner';
import { getJson } from '../fetch';
import { Grid } from './Grid';
import { Overlay } from './Overlay';
import { col, humanSize } from '../util';
import { Interval } from './Interval';
import { nanoid } from 'nanoid';
import { theme } from '../theme';
import { AppIcon } from './AppIcon';
import { IconRun } from '@tabler/icons';

interface LoaderResult {
    config: Config;
    stats: SystemStats;
}

interface State {
    feeds: Feed[];
    stats?: SystemStats;
    processTooltipPid?: number;
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
const motionRecIndicatorStyle: CSSProperties = {
    ...recIndicatorStyle,
    backgroundColor: 'rgba(255, 205, 0, 0.5)',
    color: '#000',
};
const alwaysRecIndicator = <Text block variant="small" style={recIndicatorStyle}>Rec</Text>;
const motionRecIndicator = <Text block variant="small" style={motionRecIndicatorStyle}>
    <AppIcon icon={IconRun} size={'small'} />Rec
</Text>;

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

        this.updateStats = this.updateStats.bind(this);
    }

    componentDidMount() {
        this.loader.then(({ config, stats }) => {
            this.setState({
                feeds: config.feeds,
                stats,
            });
        });
    }

    updateStats() {
        getJson<SystemStats>('http://localhost:4000/dashboard/stats')
            .then(stats => this.setState({ stats }));
    }

    render() {

        return <Spinner waitFor={this.loader}>
            <Interval callback={this.updateStats} interval={5000}>
                <Stack tokens={{ childrenGap: 'm', }}>
                    <Text block variant="xLarge">Feeds</Text>

                    <Grid columns={4}>
                        {this.state.feeds.map(feed => {
                            let recIndicator: React.ReactNode | undefined;
                            if (feed.saveVideo) {
                                recIndicator = feed.onlySaveMotion ? motionRecIndicator : alwaysRecIndicator;
                            }
                            return <Overlay position="tr" element={feed.saveVideo ? recIndicator : undefined}>
                                <img alt={feed.name} src={`http://localhost:4000/feed/still/${feed.id}`} style={{ maxWidth: '100%', objectFit: 'contain' }}/>
                            </Overlay>
                        })}
                    </Grid>

                    {this.renderStats()}
                </Stack>
            </Interval>
        </Spinner>;
    }

    renderStats() {
        const stats = this.state.stats;

        if (!stats) {
            return undefined;
        }

        return <>
            <Text block variant="xLarge">System Information</Text>

            <Grid columns="1fr 1fr 3fr">

                <Stack tokens={{ childrenGap: 's2', }}>
                    <Text block variant="large">CPU Load</Text>

                    {stats.load.cpus.map((cpu, i) => <ProgressIndicator 
                        description={`Core ${i + 1} / ${cpu.load.toFixed(2)}%`}
                        percentComplete={cpu.load / 100}
                    />)}
                </Stack>

                <Stack tokens={{ childrenGap: 's2', }}>
                    <Text block variant="large">Memory Usage</Text>

                    <ProgressIndicator 
                        description={`${humanSize(stats.memory.used)} / ${humanSize(stats.memory.total)}`} 
                        percentComplete={stats.memory.used / stats.memory.total}
                    />

                    <Separator/>
                    
                    <Text block variant="large">Disk Usage</Text>

                    {stats.disks.map(disk => <ProgressIndicator 
                        label={disk.mount}
                        description={`${humanSize(disk.used)} / ${humanSize(disk.size)}`}
                        percentComplete={disk.used / disk.size}
                    />)}

                    <Separator/>

                    <Text block variant="large">Network Activity</Text>

                    {stats.network.map(net => <Stack tokens={{ childrenGap: 's2', }}>
                        <Text block variant="medium">{net.iface}</Text>
    
                        <Grid columns={2}>
                            <div>
                                <Text variant="xxLarge">{humanSize(net.tx_sec)}</Text>
                                <Text variant="medium">tx</Text>
                            </div>
                            <div>
                                <Text variant="xxLarge">{humanSize(net.rx_sec)}</Text>
                                <Text variant="medium">rx</Text>
                            </div>
                        </Grid>
                    </Stack>)}
                </Stack>

                <Stack tokens={{ childrenGap: 's2', }}>
                    <Text block variant="large">Processes</Text>

                    {this.renderProcessList()}
                </Stack>
            </Grid>
        </>;
    }

    renderProcessList() {
        const stats = this.state.stats;

        if (!stats) {
            return undefined;
        }

        const detailListColumns: IColumn[] = [
            col<SystemStats.Process>('pid', 'id', { minWidth: 40, maxWidth: 40 }),
            col<SystemStats.Process>('name', 'Name', { minWidth: 80, maxWidth: 80 }),
            col<SystemStats.Process>('cpu', 'CPU', { minWidth: 60, maxWidth: 60 }),
            col<SystemStats.Process>('mem', 'Memory', { minWidth: 60, maxWidth: 60 }),
            col<SystemStats.Process>('command', 'Command'),
        ];

        const items = stats.processes.list
            .filter(p => p.parentPid === stats.serverPid || p.pid === stats.serverPid);

        const renderItemColumn = (item?: SystemStats.Process, index?: number, column?: IColumn): React.ReactNode => {
                const prop = column!.fieldName as keyof SystemStats.Process;
                
                switch (prop) {
                    case 'cpu':
                    case 'mem':
                        const n = item![prop] as number | undefined;
                        return (n && n > 0 ? n : 0).toFixed(2) + '%';

                    case 'command':
                        const calloutId = 'callout-' + nanoid(6);
                        return <>
                            <span id={calloutId} onClick={() => this.setState({ processTooltipPid: item?.pid })}>{item?.command}</span>
                            {this.state.processTooltipPid === item?.pid ? <Callout
                                role="alertdialog"
                                gapSpace={0}
                                target={'#' + calloutId}
                                setInitialFocus
                                style={{ maxWidth: '50vw', padding: theme.spacing.l1 }}
                                onDismiss={() => this.setState({ processTooltipPid: undefined })}
                                directionalHint={DirectionalHint.leftBottomEdge}
                            ><code>{item?.command}</code></Callout> : ''}
                        </>;
            
                    default:
                        return item![prop] as string;
                }
            }

        return <DetailsList
            items={items}
            columns={detailListColumns}
            layoutMode={DetailsListLayoutMode.justified}
            selectionMode={SelectionMode.none}
            onRenderItemColumn={renderItemColumn}
        />
    }
}