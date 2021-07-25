import React, { CSSProperties, ReactNode } from 'react';
import { VideoRecord } from 'hastycam.interface';
import { Spinner } from './Spinner';
import { deleteRequest, getJson } from '../fetch';
import { ActionButton, DefaultButton, DetailsList, DetailsListLayoutMode, IColumn, PrimaryButton, SelectionMode } from '@fluentui/react';
import { StreamImg } from './StreamImg';
import { humanSize } from '../display';
import { Modal } from './Modal';

interface DisplayRecord extends VideoRecord {
    stillUrl: string;
    actions?: ReactNode;
}

interface State {
    records: DisplayRecord[];
    playId?: string;
    confirmDeleteId?: string;
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
    col('feedId', 'Feed'),
    col('startTime', 'Start'),
    col('endTime', 'End'),
    col('byteLength', 'Size', { minWidth: 60, maxWidth: 100 }),
    col('path', 'Path', { minWidth: 150, maxWidth: 300 }),
    col('actions', ''),
];

const thumbStyle: CSSProperties = {
    maxWidth: '100%',
};

const renderItemColumn = (item?: DisplayRecord, index?: number, column?: IColumn): ReactNode => {
    const prop = column!.fieldName as keyof DisplayRecord;
    
    switch (prop) {
        case 'stillUrl':
            return <img src={item!.stillUrl} alt={item!.id} style={thumbStyle} />;

        case 'startTime':
        case 'endTime':
            const n = item![prop] as number | undefined;
            return (n && n > 0) ? new Date(n).toLocaleString() : '(Recording)';

        case 'byteLength':
            return item?.byteLength ? humanSize(item.byteLength, 1) : '-';

        case 'actions':
            return item?.actions || '';

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

        this.updateRecords = this.updateRecords.bind(this);
        this.deleteItem = this.deleteItem.bind(this);
    }

    updateRecords(response: VideoRecord[]) {
        const records: DisplayRecord[] = response.map(r => ({
            ...r,
            stillUrl: `http://localhost:4000/playback/still/${r.id}`,
            actions: <span>
                <ActionButton iconProps={{ iconName: 'PlayerPlay' }} onClick={() => this.setState({ playId: r.id })}>Play</ActionButton>
                <ActionButton disabled={!(r.endTime && r.endTime > 0)} iconProps={{ iconName: 'Trash' }} onClick={() => this.setState({ confirmDeleteId: r.id})}>Delete</ActionButton>
            </span>
        }));

        this.setState({ records });
    }

    deleteItem(id: string) {
        deleteRequest(`http://localhost:4000/playback/${id}`)
            .then(() => getJson<VideoRecord[]>('http://localhost:4000/playback/list'))
            .then(this.updateRecords)
            .then(() => this.setState({ confirmDeleteId: undefined }))
            .catch(err => console.error(err));
    }

    componentDidMount() {
        this.loader.then(this.updateRecords);
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
            <Modal
                open={this.state.playId !== undefined}
                onCancel={() => this.setState({ playId: undefined })}
            >{
                this.state.playId === undefined
                    ? undefined
                    : <StreamImg
                        style={{ maxWidth: '80vw', maxHeight: '80vh' }}
                        alt={this.state.playId}
                        src={`http://localhost:4000/playback/stream/${encodeURIComponent(this.state.playId)}`}
                    />
            }</Modal>
            <Modal
                open={this.state.confirmDeleteId !== undefined}
                onCancel={() => this.setState({ confirmDeleteId: undefined })}
                buttons={<>
                    <PrimaryButton onClick={() => { this.deleteItem(this.state.confirmDeleteId!); }}>Yes</PrimaryButton>
                    <DefaultButton onClick={() => this.setState({ confirmDeleteId: undefined })}>No</DefaultButton>
                </>}
            >
                Are you sure you want to delete this recording?
            </Modal>
        </Spinner>;
    }
}