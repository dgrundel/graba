import React from 'react';
import { VideoRecord } from 'hastycam.interface';
import { Spinner } from './Spinner';
import { getJson } from '../fetch';
import { DetailsList, DetailsListLayoutMode, SelectionMode } from '@fluentui/react';

interface State {
    records: VideoRecord[];
}

const detailListColumns = [
    { key: 'c1', name: 'id', fieldName: 'id', minWidth: 75, maxWidth: 200, isResizable: true },
    { key: 'c2', name: 'Feed id', fieldName: 'feedId', minWidth: 50, maxWidth: 200, isResizable: true },
    { key: 'c3', name: 'Date', fieldName: 'date', minWidth: 50, maxWidth: 200, isResizable: true },
    { key: 'c4', name: 'Path', fieldName: 'path', minWidth: 150, maxWidth: 300, isResizable: true },
];

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
        this.loader.then((records) => {
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
            />
        </Spinner>;
    }
}