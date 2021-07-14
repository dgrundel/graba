import React from 'react';
import { ActionButton, Text, Stack, TextField, PrimaryButton, Spinner, DefaultButton, Slider, TooltipHost, Icon, Toggle, Separator } from '@fluentui/react';
import { Feed } from 'hastycam.interface';
import { theme } from '../theme';
import { postJson } from '../fetch';
import { nanoid } from 'nanoid';
import { Grid } from './Grid';

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

const separatorStyles = {
    root: {
        '::before': { 
            background: theme.palette.neutralQuaternaryAlt,
        }
    }
};

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

        postJson<Feed>('http://localhost:4000/feed/', this.state.feed)
            .then(feed => {
                console.log('feed', feed);
                this.setState({ editing: false });
            })
            .catch((errs: any) => {
                if (Array.isArray(errs)) {
                    const err = errs.map(e => e.message).join(' ');
                    this.setState({ error: err });
                } else {
                    this.setState({ error: errs.toString() });
                }
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

    renderDataField(label: string, value?: string, tooltip?: string | JSX.Element) {
        if (!value) {
            return;
        }

        let labelElement = <Text style={{ color: theme.palette.neutralTertiary }}>
            {label} &nbsp;
        </Text>;
        
        if (tooltip) {
            const ttId = `tooltip-${nanoid(6)}`;
            labelElement = <div>
                <TooltipHost content={tooltip} id={ttId}>
                    <Text aria-describedby={ttId} style={{ color: theme.palette.neutralTertiary }}>
                        {label} <Icon iconName="Help" /> &nbsp;
                    </Text>
                </TooltipHost>
            </div>;
        }
        
        return <Stack horizontal>
            {labelElement}
            <Text>
                {value}
            </Text>
        </Stack>;
    }

    renderData() {
        return <Stack grow tokens={{ childrenGap: 's1', }}>
            {this.renderDataField('Stream URL', this.state.feed.streamUrl)}
            {this.renderDataField(
                'Max FPS', 
                this.state.feed.maxFps?.toString(),
                <span>
                    Set an upper bound for video frame rate.
                    Set lower to improve performance of video processing and viewing in browser.
                </span>
            )}
            {this.renderDataField(
                'Scale Factor', 
                this.state.feed.scaleFactor ? (this.state.feed.scaleFactor.toFixed(2) + 'x') : '',
                <span>
                    Scale the width and height of the video. 
                    Set lower to improve performance of video processing and viewing in browser.
                </span>
            )}
            {this.renderDataField(
                'Video quality', 
                this.state.feed.videoQuality ? this.state.feed.videoQuality.toString() : '',
                <span>Quality level of the video output. Range is 2-31 where <em>a lower number represents better quality</em>.</span>
            )}

            <Separator styles={separatorStyles} />
            
            {this.renderDataField(
                'Save video', 
                this.state.feed.saveVideo ? 'Enabled' : 'Disabled'
            )}

            {this.state.feed.saveVideo ? this.renderDataField(
                'Save path',
                this.state.feed.savePath
            ) : ''}

            <Separator styles={separatorStyles} />
            
            {this.renderDataField(
                'Motion detection', 
                this.state.feed.detectMotion ? 'Enabled' : 'Disabled'
            )}

            {this.state.feed.detectMotion ? this.renderDataField(
                'Threshold',
                this.state.feed.motionDetectionSettings?.diffThreshold?.toFixed(2) || ''
            ) : ''}
        </Stack>;
    }

    renderForm() {
        return <Stack grow tokens={{ childrenGap: 's1', }}>
            <TextField
                label="Feed name"
                value={this.state.feed.name}
                onChange={(e, name) => { this.setFeedData({ name }) }}
            />

            <Separator styles={separatorStyles} />

            <TextField
                label="Stream URL"
                value={this.state.feed.streamUrl}
                onChange={(e, streamUrl) => { this.setFeedData({ streamUrl }) }}
            />
            <Slider
                label="Max FPS"
                min={0}
                step={1}
                max={60}
                value={this.state.feed.maxFps || Feed.DEFAULT_MAX_FPS}
                showValue
                onChange={(maxFps) => { this.setFeedData({ maxFps }) }}
                valueFormat={(n) => n === 0 ? 'Unset' : n.toString()}
            />
            <Slider
                label="Scale factor"
                min={0}
                step={0.05}
                max={2}
                value={this.state.feed.scaleFactor}
                showValue
                onChange={(scaleFactor) => { this.setFeedData({ scaleFactor }) }}
                valueFormat={(n) => n === 0 ? 'Unset' : (n.toFixed(2) + 'x')}
            />
            <Slider
                label="Video quality"
                min={-31}
                step={1}
                max={-2}
                value={(this.state.feed.videoQuality ? this.state.feed.videoQuality : Feed.DEFAULT_VIDEO_QUALITY) * -1}
                showValue
                onChange={(videoQuality) => { this.setFeedData({ videoQuality: videoQuality * -1 }) }}
                valueFormat={(n) => (n * -1).toString()}
            />

            <Separator styles={separatorStyles} />

            <Toggle 
                label="Save video" 
                inlineLabel
                defaultChecked={this.state.feed.saveVideo === true}
                onChange={(e, saveVideo) => this.setFeedData({ saveVideo })}
            />

            <TextField
                label="Save Path"
                value={this.state.feed.savePath}
                onChange={(e, savePath) => { this.setFeedData({ savePath }) }}
            />

            <Separator styles={separatorStyles} />

            <Toggle 
                label="Detect motion" 
                inlineLabel
                defaultChecked={this.state.feed.detectMotion === true}
                onChange={(e, detectMotion) => this.setFeedData({ detectMotion })}
            />

            <Slider
                label="Motion detection threshold"
                min={0}
                step={0.01}
                max={1}
                value={this.state.feed.motionDetectionSettings ? this.state.feed.motionDetectionSettings.diffThreshold : 0}
                showValue
                onChange={(diffThreshold) => { this.setFeedData({ 
                    motionDetectionSettings: {
                        ...this.state.feed.motionDetectionSettings,
                        diffThreshold
                    }
                }) }}
                valueFormat={(n) => n.toFixed(2)}
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
        return <Grid rows="auto 1fr auto" style={{ height: '100%' }}>
            <Stack horizontal>
                    <Stack horizontal grow>
                        <Text variant="xLarge">{this.state.feed.name}</Text>
                    </Stack>
                    <Stack horizontal grow horizontalAlign="end">
                        <Text variant="small" style={{ color: theme.palette.neutralTertiary }}>id: {this.state.feed.id}</Text>
                    </Stack>
            </Stack>

            <div>
                {this.state.error ? <Text block style={{ color: theme.palette.redDark }}>{this.state.error}</Text> : ''}
                
                <Stack horizontal tokens={{ childrenGap: 'm', }}>
                    {this.state.editing ? this.renderForm() : this.renderData()}

                    <Stack style={{ textAlign: 'center' }}>
                        <img alt={this.state.feed.name} src={`http://localhost:4000/feed/still/${this.state.feed.id}`} style={{ maxWidth: '15vw', objectFit: 'contain' }}/>
                    </Stack>
                </Stack>
            </div>    
                
            <Stack horizontal>
                <Stack horizontal grow>
                    <ActionButton iconProps={{ iconName: 'Video' }} text="Watch Live" href={`http://localhost:4000/feed/stream/${this.state.feed.id}`} target="_blank" />
                    {this.renderEditButton()}
                </Stack>
                <Stack horizontal grow horizontalAlign="end">
                    <ActionButton iconProps={{ iconName: 'Trash' }} text="Delete Feed" onClick={this.delete}/>
                </Stack>
            </Stack>
            
        </Grid>;
    }
}