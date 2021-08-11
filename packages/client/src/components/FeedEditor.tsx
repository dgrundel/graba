import React from 'react';
import prettyMs from 'pretty-ms';
import { ActionButton, Text, Stack, TextField, PrimaryButton, Spinner, DefaultButton, Slider, TooltipHost, Icon, Toggle, Separator } from '@fluentui/react';
import { Feed } from 'graba.interface';
import { theme } from '../theme';
import { postJson } from '../fetch';
import { nanoid } from 'nanoid';
import { Grid } from './Grid';
import { RegionEditor } from './RegionEditor';
import { hideAuthInUrl } from '../util';

interface Props {
    feed: Feed;
    deleteFeed: (id: string) => void;
    updateConfig: (feed: Feed) => void;
}

interface State {
    feed: Feed;
    editing: boolean;
    saving: boolean;
    error?: string;
}

const feedFieldNames: Record<keyof Feed, string> = {
    id: 'id',
    name: 'Name',
    streamUrl: 'Stream URL',
    maxFps: 'Max FPS',
    scaleFactor: 'Scale factor',
    videoQuality: 'Video quality',
    saveVideo: 'Save video',
    savePath: 'Save path',
    onlySaveMotion: 'Only save when motion detected',
    motionEndTimeout: 'Motion timeout',
    detectMotion: 'Motion detection',
    motionSampleInterval: 'Motion sampling interval',
    motionDiffThreshold: 'Motion diff threshold',
    motionRegions: 'Motion regions',
};

const feedFieldTooltips: Record<keyof Feed, string | JSX.Element | undefined> = {
    id: undefined,
    name: undefined,
    streamUrl: undefined,
    maxFps: <>
        Set an upper bound for video frame rate.
        Lower values improve performance of background video processing and viewing in browser.
    </>,
    scaleFactor: <>
        Scale the width and height of the video.
        Lower values improve performance of background video processing and viewing in browser.
    </>,
    videoQuality: <>
        Quality level of the video output. 
        Range is 2-31 where a lower number represents better quality.
        <em>This value is passed to FFmpeg's <code>qscale</code> argument.</em>
    </>,
    saveVideo: undefined,
    savePath: undefined,
    onlySaveMotion: <>
        Requires motion detection enabled.
    </>,
    motionEndTimeout: <>
        When only saving video on motion detection, this is the <em>minimum</em> amount of 
        time to wait for more motion to happen before recording is stopped.
    </>,
    detectMotion: undefined,
    motionSampleInterval: <>
        Check every <em>n</em> pixels for motion.
        When set to a value greater than <strong>1</strong>, video frame pixel data will
        be sampled during motion detection. Larger values improve performance by lowering
        the number of pixels checked for motion but also reduce the effectiveness of Motion
        detection.
    </>,
    motionDiffThreshold: <>
        Percentage of pixels in a frame that must be different to be considered "motion".
        Lower values increase sensitivity of motion detection.
    </>,
    motionRegions: <>
        <strong>Optional.</strong> Click and drag to define motion detection regions in image.
        If no regions are set, motion detection will be performed on the entire video frame.
        Setting regions can also improve performance by limiting the amount of pixels on which motion 
        detection is performed.
    </>,
};

const separatorStyles = {
    root: {
        '::before': { 
            background: theme.palette.neutralQuaternaryAlt,
        }
    }
};

const noteStyles = { 
    color: theme.palette.neutralTertiary,
    marginTop: 0,
    marginBottom: theme.spacing.s1,
};

const Note = (props: { field: keyof Feed; }) => {
    const content = feedFieldTooltips[props.field] || null;
    if (content) {
        return <Text block variant="small" style={noteStyles}>{content}</Text>
    }
    return null;
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

        postJson<Feed>('/feed/', this.state.feed)
            .then(feed => {
                this.setState({
                    feed,
                    editing: false
                });
                this.props.updateConfig(feed);
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

    renderFeedValue<K extends keyof Feed>(key: K, displayFn?: (value: Feed[K]) => string | React.ReactNode) {
        const v = this.state.feed[key];
        const value = displayFn ? displayFn(v) : v;
        const label = feedFieldNames[key];
        const tooltip = feedFieldTooltips[key];

        if (!value) {
            return;
        }

        let labelElement;
        if (tooltip) {
            const ttId = `tooltip-${nanoid(4)}`;
            labelElement = <div>
                <TooltipHost content={tooltip} id={ttId}>
                    <Text aria-describedby={ttId} style={{ color: theme.palette.neutralTertiary }}>
                        {label} <Icon iconName="Help" /> &nbsp;
                    </Text>
                </TooltipHost>
            </div>;
        } else {
            labelElement = <Text style={{ color: theme.palette.neutralTertiary }}>
                {label} &nbsp;
            </Text>;
        }
        
        return <Stack horizontal>
            {labelElement}
            <Text>{value}</Text>
        </Stack>;
    }

    renderData() {
        return <Stack horizontal tokens={{ childrenGap: 'm', }}>
            <Stack grow tokens={{ childrenGap: 's1', }}>

                {this.renderFeedValue('streamUrl', hideAuthInUrl)}
                {this.renderFeedValue('maxFps')}
                {this.renderFeedValue('scaleFactor')}
                {this.renderFeedValue('videoQuality')}

                <Separator styles={separatorStyles} />
                
                {this.renderFeedValue('saveVideo', value => value ? 'Enabled' : 'Disabled')}
                {this.state.feed.saveVideo && this.state.feed.detectMotion ? 
                    <>
                        {this.renderFeedValue('onlySaveMotion', value => value ? 'Enabled' : 'Disabled')}
                        {this.renderFeedValue('motionEndTimeout', value => typeof value === 'number' ? prettyMs(value * 1000) : '')}
                    </>
                    : undefined}
                {this.state.feed.saveVideo ? this.renderFeedValue('savePath') : ''}

                <Separator styles={separatorStyles} />
                
                {this.renderFeedValue('detectMotion', value => value ? 'Enabled' : 'Disabled')}
                {this.state.feed.detectMotion ? this.renderFeedValue(
                    'motionSampleInterval',
                    interval => interval?.toFixed(0) || '',
                ) : ''}
                {this.state.feed.detectMotion ? this.renderFeedValue(
                    'motionDiffThreshold',
                    interval => interval?.toFixed(4) || '',
                ) : ''}
            </Stack>

            <img alt={this.state.feed.name} src={`http://localhost:4000/feed/still/${this.state.feed.id}`} style={{ maxWidth: '15vw', objectFit: 'contain' }}/>
        </Stack>;
    }

    renderForm() {
        return <Stack horizontal tokens={{ childrenGap: 'm', }}>
            <Stack grow tokens={{ childrenGap: 's1', }}>
                <TextField
                    label={feedFieldNames.name}
                    value={this.state.feed.name}
                    onChange={(e, name) => { this.setFeedData({ name }) }}
                />
                <Note field={'name'}/>

                <Separator styles={separatorStyles} />

                <Text block variant="large">Stream</Text>

                <TextField
                    label={feedFieldNames.streamUrl}
                    value={this.state.feed.streamUrl}
                    onChange={(e, streamUrl) => { this.setFeedData({ streamUrl }) }}
                />
                <Note field={'streamUrl'}/>

                <Slider
                    label={feedFieldNames.maxFps}
                    min={0}
                    step={1}
                    max={60}
                    value={this.state.feed.maxFps || Feed.DEFAULT_MAX_FPS}
                    showValue
                    onChange={(maxFps) => { this.setFeedData({ maxFps }) }}
                    valueFormat={(n) => n === 0 ? 'Unset' : n.toString()}
                />
                <Note field={'maxFps'}/>

                <Slider
                    label={feedFieldNames.scaleFactor}
                    min={0}
                    step={0.05}
                    max={2}
                    value={this.state.feed.scaleFactor}
                    showValue
                    onChange={(scaleFactor) => { this.setFeedData({ scaleFactor }) }}
                    valueFormat={(n) => n === 0 ? 'Unset' : (n.toFixed(2) + 'x')}
                />
                <Note field={'scaleFactor'}/>

                <Slider
                    label={feedFieldNames.videoQuality}
                    min={-31}
                    step={1}
                    max={-2}
                    value={(this.state.feed.videoQuality ? this.state.feed.videoQuality : Feed.DEFAULT_VIDEO_QUALITY) * -1}
                    showValue
                    onChange={(videoQuality) => { this.setFeedData({ videoQuality: videoQuality * -1 }) }}
                    valueFormat={(n) => (n * -1).toString()}
                />
                <Note field={'videoQuality'}/>

                <Separator styles={separatorStyles} />

                <Text block variant="large">Storage</Text>

                <Toggle 
                    label={feedFieldNames.saveVideo} 
                    inlineLabel
                    defaultChecked={this.state.feed.saveVideo === true}
                    onChange={(e, saveVideo) => this.setFeedData({ saveVideo })}
                />
                <Note field={'saveVideo'}/>

                <TextField
                    label={feedFieldNames.savePath}
                    value={this.state.feed.savePath}
                    onChange={(e, savePath) => { this.setFeedData({ savePath }) }}
                />
                <Note field={'savePath'}/>

                <Toggle 
                    label={feedFieldNames.onlySaveMotion}
                    disabled={!(this.state.feed.saveVideo && this.state.feed.detectMotion)}
                    inlineLabel
                    defaultChecked={this.state.feed.onlySaveMotion === true}
                    onChange={(e, onlySaveMotion) => this.setFeedData({ onlySaveMotion })}
                />
                <Note field={'onlySaveMotion'}/>

                <Slider
                    label={feedFieldNames.motionEndTimeout}
                    disabled={this.state.feed.detectMotion !== true}
                    min={Feed.MIN_MOTION_END_TIMEOUT}
                    step={1}
                    max={60 * 10} // 10 min
                    value={this.state.feed.motionEndTimeout || Feed.MIN_MOTION_END_TIMEOUT}
                    showValue
                    onChange={(motionEndTimeout) => { this.setFeedData({ motionEndTimeout }) }}
                    valueFormat={(n) => prettyMs(n * 1000)}
                />
                <Note field={'motionEndTimeout'}/>

                <Separator styles={separatorStyles} />

                <Text block variant="large">Motion Detection</Text>

                <Toggle 
                    label={feedFieldNames.detectMotion} 
                    inlineLabel
                    defaultChecked={this.state.feed.detectMotion === true}
                    onChange={(e, detectMotion) => this.setFeedData({ detectMotion })}
                />
                <Note field={'detectMotion'}/>

                <Slider
                    label={feedFieldNames.motionSampleInterval}
                    disabled={this.state.feed.detectMotion !== true}
                    min={1}
                    step={1}
                    max={64}
                    value={this.state.feed.motionSampleInterval || 1}
                    showValue
                    onChange={(motionSampleInterval) => { this.setFeedData({ motionSampleInterval }) }}
                    valueFormat={(n) => n.toFixed(0)}
                />
                <Note field={'motionSampleInterval'}/>
                
                <Slider
                    label={feedFieldNames.motionDiffThreshold}
                    disabled={this.state.feed.detectMotion !== true}
                    min={0.0}
                    step={0.0005}
                    max={1.0}
                    value={this.state.feed.motionDiffThreshold || 0}
                    showValue
                    onChange={(motionDiffThreshold) => { this.setFeedData({ motionDiffThreshold }) }}
                    valueFormat={(n) => (n * 100).toFixed(2) + '%'}
                />
                <Note field={'motionDiffThreshold'}/>


                {this.state.feed.detectMotion ? <>
                    <Separator styles={separatorStyles} />

                    <Text block variant="mediumPlus">Motion Region Editor</Text>
                    <Note field={'motionRegions'}/>

                    <RegionEditor
                        feed={this.state.feed}
                        onChange={motionRegions => { this.setFeedData({ motionRegions }) }}
                    />
                </> : undefined}
            </Stack>
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
                {this.state.editing ? this.renderForm() : this.renderData()}
            </div>    
                
            <Stack horizontal>
                <Stack horizontal grow>
                    {this.renderEditButton()}
                </Stack>
                <Stack horizontal grow horizontalAlign="end">
                    <ActionButton iconProps={{ iconName: 'Video' }} text="Watch Live" href={`http://localhost:4000/feed/stream/${this.state.feed.id}`} target="_blank" />
                    <ActionButton iconProps={{ iconName: 'Trash' }} text="Delete Feed" onClick={this.delete}/>
                </Stack>
            </Stack>
            
        </Grid>;
    }
}