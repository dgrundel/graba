import React from 'react';
import { Spinner } from './Spinner';

interface State {
    feeds: Record<string, boolean>;
}

export class Watch extends React.Component<{}, State> {
    private readonly loader: Promise<any>;

    constructor() {
        super({});

        this.state = {
            feeds: {}
        };

        this.loader = fetch('http://localhost:4000/feed/list')
            .then(response => response.json())
            .then(names => {
                this.setState({
                    feeds: names.reduce((map: Record<string, boolean>, name: string) => {
                        map[name] = true;
                        return map;
                    }, {})
                })
            });
    }

    toggleActiveFeed(name: string, isActive: boolean) {
        this.setState(prev => ({
            feeds: {
                ...prev.feeds,
                [name]: isActive,
            }
        }));
    }

    render() {
        return (
            <Spinner waitFor={this.loader}>
                {Object.keys(this.state.feeds).map(name => <label style={{ display: 'block', margin: '.25rem' }}>
                    <input type="checkbox" checked={this.state.feeds[name]} onChange={e => this.toggleActiveFeed(name, e.target.checked)} /> {name}
                </label>)}
                {Object.keys(this.state.feeds).map(name => {
                    if (this.state.feeds[name]) {
                        return <img style={{ width: '30vw' }} alt={name} src={`http://localhost:4000/feed/view/${encodeURIComponent(name)}`}/>
                    } else {
                        return undefined;
                    }
                })}
            </Spinner>
        );
    }
}