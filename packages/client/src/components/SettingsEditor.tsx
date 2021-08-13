import React from 'react';
import { Text, Stack, TextField, Toggle, Separator } from '@fluentui/react';
import { Config } from 'graba.interface';
import { Spinner } from './Spinner';
import { theme } from '../theme';
import { getJson } from '../fetch';
import { Grid } from './Grid';

interface State {
    config: Config;
}

const separatorStyles = {
    root: {
        '::before': { 
            background: theme.palette.neutralQuaternaryAlt,
        }
    }
};

const Note = (props: { field: keyof Config; }) => {
    const content = Config.FIELD_TOOLTIPS[props.field] || null;
    if (content) {
        return <Text block variant="small" style={{ 
            color: theme.palette.neutralTertiary,
            marginTop: 0,
            marginBottom: theme.spacing.s1,
        }}>{content}</Text>
    }
    return null;
};

export class SettingsEditor extends React.Component<{}, State> {
    private readonly loader: Promise<Config>;

    constructor(props: any) {
        super(props);

        this.state = {
            config: {
                feeds: [],
            }
        };

        this.loader = getJson<Config>('http://localhost:4000/config');
    }

    componentDidMount() {
        this.loader.then((config: Config) => {
            this.setState({
                config
            });
        });
    }

    setConfigData(data: Partial<Config>) {
        this.setState(prev => ({
            config: {
                ...prev.config,
                ...data,
            }
        }))
    }

    renderMailConfig() {
        return <>
            <Text block variant="xLarge">Outgoing Mail</Text>

            <Stack tokens={{ childrenGap: 's2', }}>
                <Grid columns="3fr 1fr">
                    <div>
                        <TextField
                            label={Config.FIELD_NAMES.smtpServer}
                            value={this.state.config.smtpServer}
                            onChange={(e, smtpServer) => { this.setConfigData({ smtpServer }) }}
                        />
                        <Note field="smtpServer" />
                    </div>
                    <div>
                        <TextField
                            label={Config.FIELD_NAMES.smtpPort}
                            value={this.state.config.smtpPort ? this.state.config.smtpPort.toFixed(0) : undefined}
                            onChange={(e, value) => { 
                                if (value) {
                                    const smtpPort = +value;
                                    if (!isNaN(smtpPort)) {
                                        this.setConfigData({ smtpPort })
                                    }
                                }
                            }}
                        />
                        <Note field="smtpPort" />
                    </div>
                </Grid>

                <Toggle 
                    label={Config.FIELD_NAMES.smtpSecure} 
                    inlineLabel
                    defaultChecked={this.state.config.smtpSecure !== false}
                    onChange={(e, smtpSecure) => this.setConfigData({ smtpSecure })}
                />
                <Note field="smtpSecure" />

                <Grid columns={2}>
                    <div>
                        <TextField
                            label={Config.FIELD_NAMES.smtpUser}
                            value={this.state.config.smtpUser}
                            onChange={(e, smtpUser) => { this.setConfigData({ smtpUser }) }}
                        />
                        <Note field="smtpUser" />
                    </div>
                    <div>
                        <TextField
                            label={Config.FIELD_NAMES.smtpPassword}
                            value={this.state.config.smtpPassword}
                            onChange={(e, smtpPassword) => { this.setConfigData({ smtpPassword }) }}
                        />
                        <Note field="smtpPassword" />
                    </div>
                </Grid>
            </Stack>
        </>;
    }

    render() {
        return <Spinner waitFor={this.loader}>
            <Stack tokens={{ childrenGap: 'm', }}>
                {this.renderMailConfig()}

                <Separator styles={separatorStyles} />

            </Stack>
        </Spinner>;
    }
}