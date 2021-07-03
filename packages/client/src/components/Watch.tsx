import { Checkbox } from '@fluentui/react';
import React from 'react';
import { Spinner } from './Spinner';
interface State {
    feeds: Record<string, boolean>;
}

export class Watch extends React.Component<{}, State> {
    private readonly loader: Promise<any>;

    constructor(props: any) {
        super(props);

        this.state = {
            feeds: {}
        };

        this.loader = fetch('http://localhost:4000/feed/list')
            .then(response => response.json());
    }

    componentDidMount() {
        this.loader.then(names => {
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
                    <Checkbox checkmarkIconProps={{ iconName: 'FaCheck' }} label={name} checked={this.state.feeds[name]} onChange={(e, checked) => this.toggleActiveFeed(name, checked === true)} />
                </label>)}
                {Object.keys(this.state.feeds).map(name => {
                    if (this.state.feeds[name]) {
                        return <img style={{ width: '30vw' }} key={name} alt={name} src={`http://localhost:4000/feed/view/${encodeURIComponent(name)}`}/>
                    } else {
                        return undefined;
                    }
                })}
            </Spinner>
        );
    }
}