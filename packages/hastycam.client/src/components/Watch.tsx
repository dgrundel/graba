import React from 'react';

interface State {
    feeds: Record<string, boolean>;
}

class Component extends React.Component<{}, State> {

    constructor() {
        super({});

        this.state = {
            feeds: {}
        };
    }

    componentDidMount() {
        fetch('http://localhost:4000/feed/list')
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
            <div>
                <hr/>
                {Object.keys(this.state.feeds).map(name => <label>
                    <input type="checkbox" checked={this.state.feeds[name]} onChange={e => this.toggleActiveFeed(name, e.target.checked)} /> {name}
                </label>)}
                <hr/>
                {Object.keys(this.state.feeds).map(name => {
                    if (this.state.feeds[name]) {
                        return <img style={{ width: '30vw' }} alt={name} src={`http://localhost:4000/feed/view/${encodeURIComponent(name)}`}/>
                    } else {
                        return undefined;
                    }
                })}
            </div>
        );
    }
}

export const Watch = Component;