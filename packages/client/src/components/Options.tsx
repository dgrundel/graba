import React from 'react';
import { Config } from 'hastycam.interface';
import { Spinner } from './Spinner';
import './Options.scss';

interface State {
    config?: Config;
}

export class Options extends React.Component<{}, State> {
    private readonly loader: Promise<void>;

    constructor() {
        super({});

        this.state = {};
        this.loader = fetch('http://localhost:4000/config')
            .then(response => response.json())
            .then(config => {
                this.setState({
                    config
                });
            });
    }

    render() {
        return <Spinner waitFor={this.loader}>
            <h2>Feeds</h2>

            {this.state.config?.feeds.map(feed => <div className="feed-edit-box">
                <label className="block-label">
                    <span>Feed Name</span>
                    <input type="text" value={feed.name} />
                </label>
                <label className="block-label">
                    <span>Stream URL</span>
                    <input type="text" value={feed.streamUrl} />
                </label>
                <button>Delete Feed</button>
            </div>)}

            <button>Add Feed</button>
        </Spinner>;
    }
}