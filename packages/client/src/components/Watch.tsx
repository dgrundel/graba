import { Dropdown, IDropdownOption, Stack } from '@fluentui/react';
import React, { CSSProperties, FormEvent } from 'react';
import { getJson } from '../fetch';
import { Spinner } from './Spinner';
import './Watch.scss';

interface State {
    feeds: Record<string, boolean>;
}

export class Watch extends React.Component<{}, State> {
    private readonly loader: Promise<string[]>;

    constructor(props: any) {
        super(props);

        this.state = {
            feeds: {}
        };

        this.loader = getJson<string[]>('http://localhost:4000/feed/list');

        this.toggleActiveFeed = this.toggleActiveFeed.bind(this);
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

    toggleActiveFeed(e: FormEvent<HTMLDivElement>, item?: IDropdownOption) {
        if (item) {
            this.setState(prev => ({
                feeds: {
                    ...prev.feeds,
                    [item.key as string]: item.selected === true,
                }
            }));
        }
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

        const dropdownOptions = Object.keys(this.state.feeds).map(name => ({ key: name, text: name }));

        return (
            <Spinner waitFor={this.loader}>
                <Stack tokens={{ childrenGap: 's1', }}>
                    <Dropdown
                        placeholder="Select feeds"
                        label="Selected Feeds"
                        selectedKeys={Object.keys(this.state.feeds).filter(name => this.state.feeds[name])}
                        onChange={this.toggleActiveFeed}
                        multiSelect
                        options={dropdownOptions}
                    />

                    <div style={displayGridStyle}>
                        {Object.keys(this.state.feeds).map(name => {
                            if (this.state.feeds[name]) {
                                return <img key={name} style={imgStyle} alt={name} src={`http://localhost:4000/feed/view/${encodeURIComponent(name)}`}/>
                            } else {
                                return undefined;
                            }
                        })}
                    </div>
                </Stack>
            </Spinner>
        );
    }
}