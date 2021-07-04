import React from 'react';
import { ActionButton, Text, Stack, TextField } from '@fluentui/react';
import { Feed } from 'hastycam.interface';

interface Props {
    feed: Feed;
}

interface State extends Feed {
}

export class FeedEditor extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            name: props.feed.name,
            streamUrl: props.feed.streamUrl,
        };

        this.delete = this.delete.bind(this);
    }

    delete() {
        alert('oh no!');
    }

    render() {
        return <div>
            <Text block variant="xLarge">
                {this.state.name}
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