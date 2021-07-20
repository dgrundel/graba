import React from 'react';
import { Text, PrimaryButton, Stack } from '@fluentui/react';
import { Config, VideoRecord } from 'hastycam.interface';
import { Spinner } from './Spinner';
import { nanoid } from 'nanoid';
import { getJson } from '../fetch';
import { Grid } from './Grid';

interface State {
    records: VideoRecord[];
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
        this.loader.then((records) => {
            this.setState({ records });
        });
    }

    render() {
        return <Spinner waitFor={this.loader}>
            <table>
                <tbody>
                    {this.state.records.map(record => {
                        return <tr>
                            <td>{record.id}</td>
                            <td>{record.feedId}</td>
                            <td>{record.date}</td>
                            <td>{record.path}</td>
                        </tr>
                    })}
                </tbody>
            </table>
        </Spinner>;
    }
}