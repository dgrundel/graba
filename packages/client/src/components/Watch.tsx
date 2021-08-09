import { Dropdown, IDropdownOption, Stack } from '@fluentui/react';
import React, { CSSProperties, FormEvent } from 'react';
import { Feed } from '../../../interface/build';
import { getJson } from '../fetch';
import { Grid } from './Grid';
import { Spinner } from './Spinner';
import { StreamImg } from './StreamImg';
import './Watch.scss';

type FeedDisplay = Pick<Feed, 'name' | 'id'>;

interface State {
    feeds: FeedDisplay[];
    selectedFeeds: Set<string>;
}

const streamImgStyle = {
    width: '100%',
    height: '100%',
    objectFit: "cover",
} as CSSProperties;

export class Watch extends React.Component<{}, State> {
    private readonly loader: Promise<FeedDisplay[]>;

    constructor(props: any) {
        super(props);

        this.state = {
            feeds: [],
            selectedFeeds: new Set(),
        };

        this.loader = getJson<FeedDisplay[]>('http://localhost:4000/feed/list');

        this.toggleActiveFeed = this.toggleActiveFeed.bind(this);
    }

    componentDidMount() {
        this.loader.then(feeds => {
            this.setState({
                feeds,
                selectedFeeds: new Set(feeds.map(f => f.id)),
            })
        });
    }

    toggleActiveFeed(e: FormEvent<HTMLDivElement>, item?: IDropdownOption) {
        if (item) {
            const key = item.key as string;
            this.setState(prev => {
                const selectedFeeds = new Set(prev.selectedFeeds);
                if (item.selected) {
                    selectedFeeds.add(key);
                } else {
                    selectedFeeds.delete(key);
                }
                return {
                    selectedFeeds
                }
            });
        }
    }

    render() {
        const dropdownOptions = this.state.feeds.map(f => ({ key: f.id, text: f.name }));

        return (
            <Spinner waitFor={this.loader}>
                <Stack tokens={{ childrenGap: 's1', }}>
                    <Dropdown
                        placeholder="Select feeds"
                        label="Selected Feeds"
                        selectedKeys={Array.from(this.state.selectedFeeds)}
                        onChange={this.toggleActiveFeed}
                        multiSelect
                        options={dropdownOptions}
                    />

                    <Grid columns={2}>
                        {this.state.feeds.filter(f => this.state.selectedFeeds.has(f.id)).map(feed => {
                            const imgSrc = `http://localhost:4000/feed/stream/${encodeURIComponent(feed.id)}`;
                            return <StreamImg key={feed.id} style={streamImgStyle} alt={feed.name} src={imgSrc}/>;
                        })}
                    </Grid>
                </Stack>
            </Spinner>
        );
    }
}