import React from 'react';
import { ActionButton, Text, Stack, TextField } from '@fluentui/react';
import { Feed } from 'hastycam.interface';
import { theme } from '../theme';

interface Props {
    feed: Feed;
    deleteFeed: (id: string) => void;
}

interface State extends Feed {
}

export class FeedEditor extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            ...props.feed,
        };

        this.delete = this.delete.bind(this);
    }

    delete() {
        this.props.deleteFeed(this.props.feed.id);
    }

    render() {
        return <div>
            <Text block variant="xLarge">
                {this.state.name}
            </Text>
            <Text block variant="small" style={{ color: theme.palette.neutralTertiary }}>
                {this.state.id}
            </Text>

            <TextField
                label="Feed Name"
                value={this.state.name}
                onChange={(e, value) => { this.setState({ name: value! }) }}
            />
            <TextField
                label="Stream URL"
                value={this.state.streamUrl}
                onChange={(e, value) => { this.setState({ streamUrl: value! }) }}
            />
            <Stack horizontal horizontalAlign="end">
                <ActionButton iconProps={{ iconName: 'Trash' }} text="Delete Feed" onClick={this.delete}/>
            </Stack>
        </div>;
    }
}