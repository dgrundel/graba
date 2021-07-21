import React, { CSSProperties, ReactNode } from 'react';
import { VideoRecord } from 'hastycam.interface';
import { Spinner } from './Spinner';
import { getJson } from '../fetch';
import { DetailsList, DetailsListLayoutMode, IColumn, SelectionMode } from '@fluentui/react';

interface DisplayRecord extends VideoRecord {
    stillUrl: string;
}

interface State {
    records: DisplayRecord[];
}

const col = (fieldName: keyof DisplayRecord, name: string, props?: Partial<IColumn>): IColumn => ({
    name,
    fieldName, 
    key: fieldName, 
    minWidth: 50, 
    maxWidth: 200, 
    isResizable: true,
    ...props,
});

const detailListColumns: IColumn[] = [
    col('stillUrl', 'Preview', { minWidth: 60, maxWidth: 60 }),
    col('id', 'id', { minWidth: 75, maxWidth: 200 }),
    col('feedId', 'Feed'),
    col('start', 'Start'),
    col('end', 'End'),
    col('path', 'Path', { minWidth: 150, maxWidth: 300 }),
];

const thumbStyle: CSSProperties = {
    maxWidth: '100%',
};

const renderItemColumn = (item?: DisplayRecord, index?: number, column?: IColumn): ReactNode => {
    const prop = column!.fieldName as keyof DisplayRecord;
    
    switch (prop) {
        case 'stillUrl':
            return <img src={item!.stillUrl} alt={item!.id} style={thumbStyle} />;

        case 'start':
        case 'end':
            const n = item![prop] as number;
            return n === -1 ? '-' : new Date(n).toLocaleString();

        default:
            return item![prop] as string;
    }
}

export class Playback extends React.Component<{}, State> {
    private readonly loader: Promise<VideoRecord[]>;

    constructor(props: any) {
        super(props);

        this.state = {
            records: []
        };

        this.loader = getJson<VideoRecord[]>('http://localhost:4000/playback/list');
    }

    componentDidMount() {
        this.loader.then((response) => {
            const records: DisplayRecord[] = response.map(r => ({
                ...r,
                stillUrl: `http://localhost:4000/playback/still/${r.id}`
            }));

            this.setState({ records });
        });
    }

    render() {
        return <Spinner waitFor={this.loader}>
            <DetailsList
                items={this.state.records}
                columns={detailListColumns}
                layoutMode={DetailsListLayoutMode.justified}
                selectionMode={SelectionMode.none}
                onRenderItemColumn={renderItemColumn}
            />
        </Spinner>;
    }
}