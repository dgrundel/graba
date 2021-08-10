import { Dropdown, IDropdownOption, PrimaryButton, Stack } from '@fluentui/react';
import React, { CSSProperties, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Feed } from '../../../interface/build';
import { getJson } from '../fetch';
import { Centered } from './Centered';
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

    renderFeeds() {
        const dropdownOptions = this.state.feeds.map(f => ({ key: f.id, text: f.name }));

        return <Stack tokens={{ childrenGap: 's1', }}>
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
    }

    renderNoFeedMessage() {
        const linkProps = {
            component: PrimaryButton,
            iconProps: {
                iconName: 'Settings',
            },
        };

        return <Centered>
            <Stack tokens={{ childrenGap: 'm', }} style={{ textAlign: 'center' }}>
                <Stack.Item>No feeds configured.</Stack.Item>
                <Stack.Item>
                    <Link to="/config" {...linkProps}>Configure</Link>
                </Stack.Item>
            </Stack>
        </Centered>;
    }

    render() {

        return (
            <Spinner waitFor={this.loader}>
                {this.state.feeds.length === 0 ? this.renderNoFeedMessage() : this.renderFeeds() }
            </Spinner>
        );
    }
}