import React from 'react';
import { ActionButton, Text, Stack, TextField, Separator, PrimaryButton } from '@fluentui/react';
import { Feed } from 'hastycam.interface';
import { theme } from '../theme';

interface Props {
    feed: Feed;
    deleteFeed: (id: string) => void;
}

interface State {
    feed: Feed;
    editing: boolean;
}

export class FeedEditor extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            feed: props.feed,
            editing: props.feed.name.length === 0,
        };

        this.delete = this.delete.bind(this);
        this.edit = this.edit.bind(this);
        this.save = this.save.bind(this);
        this.setFeedData = this.setFeedData.bind(this);
    }

    delete() {
        this.props.deleteFeed(this.props.feed.id);
    }

    edit() {
        this.setState({ editing: true });
    }

    save() {
        this.setState({ editing: false });
    }

    setFeedData(data: Partial<Feed>) {
        this.setState(prev => ({
            feed: {
                ...prev.feed,
                ...data,
            }
        }))
    }

    renderData() {
        return <Stack tokens={{ childrenGap: 's1', }}>
            <Stack>
                <Text style={{ color: theme.palette.neutralTertiary }}>
                    Feed name &nbsp;
                </Text>
                <Text>
                    {this.state.feed.name}
                </Text>
            </Stack>
            <Stack>
                <Text style={{ color: theme.palette.neutralTertiary }}>
                    Stream URL &nbsp;
                </Text>
                <Text>
                    {this.state.feed.streamUrl}
                </Text>
            </Stack>
        </Stack>;
    }

    renderForm() {
        return <Stack>
            <TextField
                label="Feed Name"
                value={this.state.feed.name}
                onChange={(e, name) => { this.setFeedData({ name }) }}
            />
            <TextField
                label="Stream URL"
                value={this.state.feed.streamUrl}
                onChange={(e, streamUrl) => { this.setFeedData({ streamUrl }) }}
            />
        </Stack>;
    }

    render() {
        return <div>
            <Stack tokens={{ childrenGap: 'm', }}>
                <Text block variant="xLarge">
                    {this.state.feed.name}

                    <Text variant="small" style={{ color: theme.palette.neutralTertiary }}>
                        &nbsp; {this.state.feed.id}
                    </Text>
                </Text>
                
                {this.state.editing ? this.renderForm() : this.renderData()}
                
                <Stack horizontal>
                    <Stack horizontal grow>
                        {this.state.editing
                            ? <PrimaryButton iconProps={{ iconName: 'DeviceFloppy' }} text="Save Feed" onClick={this.save}/>
                            : <ActionButton iconProps={{ iconName: 'Pencil' }} text="Edit Feed" onClick={this.edit}/>}
                    </Stack>
                    <Stack horizontal grow horizontalAlign="end">
                        <ActionButton iconProps={{ iconName: 'Trash' }} text="Delete Feed" onClick={this.delete}/>
                    </Stack>
                </Stack>
            </Stack>
            
        </div>;
    }
}