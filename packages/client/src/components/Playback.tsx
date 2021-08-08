import React, { CSSProperties, ReactNode } from 'react';
import { Feed, VideoRecord } from 'hastycam.interface';
import { Spinner } from './Spinner';
import { deleteRequest, getJson } from '../fetch';
import { ActionButton, DefaultButton, DetailsList, DetailsListLayoutMode, IColumn, MessageBarType, PrimaryButton, SelectionMode, Stack } from '@fluentui/react';
import { StreamImg } from './StreamImg';
import { col, humanSize } from '../util';
import { Modal } from './Modal';
import { connect } from 'react-redux';
import { flashMessage } from '../store/appReducer';
import { Centered } from './Centered';
import { Sorter } from './Sorter';
import { DateFilter } from './DateFilter';

type FeedDisplay = Pick<Feed, 'name' | 'id'>;
type RemoteData = [VideoRecord[], FeedDisplay[]];

interface DisplayRecord extends VideoRecord {
    stillUrl: string;
    feedName?: string;
    actions?: ReactNode;
    hidden?: boolean;
}

interface Props {
    flashMessage: typeof flashMessage;
}

interface State {
    records: DisplayRecord[];
    playId?: string;
    confirmDeleteId?: string;
}

const sortFieldNames = {
    feedName: 'Feed',
    startTime: 'Start time',
    endTime: 'End time',
    byteLength: 'Size',
};

const detailListColumns: IColumn[] = [
    col<DisplayRecord>('stillUrl', 'Preview', { minWidth: 60, maxWidth: 60 }),
    col<DisplayRecord>('feedName', 'Feed'),
    col<DisplayRecord>('startTime', 'Start'),
    col<DisplayRecord>('endTime', 'End'),
    col<DisplayRecord>('byteLength', 'Size', { minWidth: 60, maxWidth: 100 }),
    col<DisplayRecord>('path', 'Path', { minWidth: 150, maxWidth: 300 }),
    col<DisplayRecord>('actions', ''),
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
            return (n && n > 0) ? new Date(n).toLocaleString() : '-';

        case 'byteLength':
            return item?.byteLength ? humanSize(item.byteLength, 1) : '-';

        case 'actions':
            return item?.actions || '';

        default:
            return item![prop] as string;
    }
}

class Component extends React.Component<Props, State> {
    private readonly loader: Promise<RemoteData>;

    constructor(props: any) {
        super(props);

        this.state = {
            records: [],
        };

        this.loader = this.getData();

        this.transformData = this.transformData.bind(this);
        this.deleteItem = this.deleteItem.bind(this);
    }

    getData(): Promise<RemoteData> {
        return Promise.all([
            getJson<VideoRecord[]>('/playback/list'),
            getJson<FeedDisplay[]>('http://localhost:4000/feed/list'),
        ]);
    }

    transformData(data: RemoteData) {
        const [response, feeds] = data;

        const feedNames = feeds.reduce((map: Record<string, string>, feed: FeedDisplay) => {
            map[feed.id] = feed.name;
            return map;
        }, {});

        const records: DisplayRecord[] = response.map(r => ({
            ...r,
            feedName: feedNames[r.feedId],
            stillUrl: `/playback/still/${r.id}`,
            actions: <span>
                <ActionButton iconProps={{ iconName: 'PlayerPlay' }} onClick={() => this.setState({ playId: r.id })}>Play</ActionButton>
                <ActionButton iconProps={{ iconName: 'Trash' }} onClick={() => this.setState({ confirmDeleteId: r.id})}>Delete</ActionButton>
                <ActionButton iconProps={{ iconName: 'Download' }} href={`/playback/download/${r.id}`}>Download</ActionButton>
            </span>
        }));

        this.setState({ records, });
    }

    deleteItem(id: string) {
        deleteRequest(`/playback/${id}`)
            .catch(err => {
                console.error(err);
                this.props.flashMessage({
                    type: MessageBarType.error,
                    body: JSON.stringify(err),
                });
            })
            .then(() => this.getData())
            .then(this.transformData)
            .then(() => this.setState({ confirmDeleteId: undefined }));
    }

    componentDidMount() {
        this.loader.then(this.transformData);
    }

    render() {
        const listItems = this.state.records.filter(r => r.hidden !== true);
        const emptyListMessage = this.state.records.length === 0
            ? 'No videos yet. Configure one or more feeds to save video.'
            : 'No videos matched your filters.';

        return <Spinner waitFor={this.loader}>

            <Stack horizontal verticalAlign={'end'} tokens={{ childrenGap: 'm', }}>
                <Sorter 
                    items={this.state.records}
                    sortBy={'startTime'}
                    sortableBy={sortFieldNames}
                    onSort={(records: DisplayRecord[]) => this.setState({ records })}
                />

                <DateFilter
                    items={this.state.records}
                    itemRangeStart={r => new Date(r.startTime)}
                    itemRangeEnd={r => r.endTime ? new Date(r.endTime) : undefined}
                    onFilter={(records) => this.setState({ records })}
                    itemSetVisibility={(r, visible) => { r.hidden = visible !== true }}
                />
            </Stack>

            {listItems.length > 0 ? <DetailsList
                items={listItems}
                columns={detailListColumns}
                layoutMode={DetailsListLayoutMode.justified}
                selectionMode={SelectionMode.none}
                onRenderItemColumn={renderItemColumn}
            /> : <Centered>{emptyListMessage}</Centered>}

            <Modal
                open={this.state.playId !== undefined}
                onCancel={() => this.setState({ playId: undefined })}
            >{
                this.state.playId === undefined
                    ? undefined
                    : <StreamImg
                        style={{ maxWidth: '90vw', maxHeight: '90vh' }}
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

const mapDispatchToProps: Partial<Props> = {
    flashMessage,
};

export const Playback = connect(undefined, mapDispatchToProps)(Component);
