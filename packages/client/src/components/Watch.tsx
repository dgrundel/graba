import { Checkbox } from '@fluentui/react';
import React, { CSSProperties } from 'react';
import { Spinner } from './Spinner';
import './Watch.scss';

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
        const displayGridStyle = {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gridGap: '1rem',
            maxWidth: '100%',
        };

        const imgStyle = {
            width: '100%',
            height: '100%',
            objectFit: "cover",
        } as CSSProperties;

        return (
            <Spinner waitFor={this.loader}>
                {Object.keys(this.state.feeds).map(name => <Checkbox key={name} checkmarkIconProps={{ iconName: 'Check' }} label={name} checked={this.state.feeds[name]} onChange={(e, checked) => this.toggleActiveFeed(name, checked === true)} />)}
                <div style={displayGridStyle}>
                    {Object.keys(this.state.feeds).map(name => {
                        if (this.state.feeds[name]) {
                            return <img key={name} style={imgStyle} alt={name} src={`http://localhost:4000/feed/view/${encodeURIComponent(name)}`}/>
                        } else {
                            return undefined;
                        }
                    })}
                </div>
            </Spinner>
        );
    }
}