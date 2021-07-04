import React from 'react';
import { ActionButton, Text, Stack, TextField, Separator, PrimaryButton, Spinner, DefaultButton } from '@fluentui/react';
import { Feed } from 'hastycam.interface';
import { theme } from '../theme';
import { postJson } from '../fetch';

interface Props {
    feed: Feed;
    deleteFeed: (id: string) => void;
}

interface State {
    feed: Feed;
    editing: boolean;
    saving: boolean;
    error?: string;
}

export class FeedEditor extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            feed: props.feed,
            editing: props.feed.name.length === 0,
            saving: false,
        };

        this.delete = this.delete.bind(this);
        this.edit = this.edit.bind(this);
        this.cancelEdit = this.cancelEdit.bind(this);
        this.save = this.save.bind(this);
        this.setFeedData = this.setFeedData.bind(this);
    }

    delete() {
        this.props.deleteFeed(this.props.feed.id);
    }

    edit() {
        this.setState({ editing: true });
    }

    cancelEdit() {
        this.setState({ editing: false, error: undefined });
    }

    save() {
        this.setState({ saving: true, error: undefined });

        postJson<Feed>(`http://localhost:4000/config/feed/${this.state.feed.id}`, this.state.feed)
            .then(feed => {
                console.log('feed', feed);
                this.setState({ editing: false });
            })
            .catch(err => {
                this.setState({ error: err.toString() });
            })
            .finally(() => this.setState({ saving: false }));
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

    renderEditButton() {
        if (this.state.editing) {
            if (this.state.saving) {
                return <Spinner label="Saving..." ariaLive="assertive" labelPosition="right" />;
            } else {
                return <Stack horizontal tokens={{ childrenGap: 's1', }}>
                    <PrimaryButton iconProps={{ iconName: 'DeviceFloppy' }} text="Save Feed" onClick={this.save}/>
                    <DefaultButton iconProps={{ iconName: 'X' }} text="Cancel" onClick={this.cancelEdit}/>
                </Stack>;
            }
        }

        return <ActionButton iconProps={{ iconName: 'Pencil' }} text="Edit Feed" onClick={this.edit}/>;
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

                {this.state.error ? <Text block style={{ color: theme.palette.redDark }}>{this.state.error}</Text> : ''}
                
                {this.state.editing ? this.renderForm() : this.renderData()}
                
                <Stack horizontal>
                    <Stack horizontal grow>
                        {this.renderEditButton()}
                    </Stack>
                    <Stack horizontal grow horizontalAlign="end">
                        <ActionButton iconProps={{ iconName: 'Trash' }} text="Delete Feed" onClick={this.delete}/>
                    </Stack>
                </Stack>
            </Stack>
            
        </div>;
    }
}