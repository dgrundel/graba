import React from 'react';
import { Text, Stack, TextField, Toggle, Separator, MessageBar, MessageBarType, PrimaryButton, Spinner as FluentSpinner } from '@fluentui/react';
import { Config } from 'graba.interface';
import { Spinner } from './Spinner';
import { theme } from '../theme';
import { getJson, postJson } from '../fetch';
import { Grid } from './Grid';

interface State {
    config: Config;
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
            },
            saving: false,
        };

        this.loader = getJson<Config>('http://localhost:4000/config');

        this.save = this.save.bind(this);
    }

    componentDidMount() {
        this.loader.then((config: Config) => {
            this.setState({
                config
            });
        });
    }

    save() {
        this.setState({ saving: true, error: undefined });

        postJson<Config>('/config/', this.state.config)
            .then(config => {
                this.setState({ config });
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

    setConfigData(data: Partial<Config>) {
        this.setState(prev => ({
            config: {
                ...prev.config,
                ...data,
            }
        }))
    }

    renderEmailAlertConfig() {
        return <>
            <Text block variant="xLarge">Email Alerts</Text>

            <Toggle 
                label={Config.FIELD_NAMES.enableEmailAlerts} 
                inlineLabel
                checked={this.state.config.enableEmailAlerts === true}
                onChange={(e, enableEmailAlerts) => this.setConfigData({ enableEmailAlerts })}
                disabled={this.state.saving}
            />
            <Note field="enableEmailAlerts" />
            
            <Text block variant="large">Outgoing Mail (SMTP) Server</Text>

            <Stack tokens={{ childrenGap: 's2', }}>
                <Grid columns="3fr 1fr">
                    <div>
                        <TextField
                            label={Config.FIELD_NAMES.smtpServer}
                            value={this.state.config.smtpServer}
                            onChange={(e, smtpServer) => { this.setConfigData({ smtpServer }) }}
                            disabled={this.state.saving}
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
                            disabled={this.state.saving}
                        />
                        <Note field="smtpPort" />
                    </div>
                </Grid>

                <Toggle 
                    label={Config.FIELD_NAMES.smtpSecure} 
                    inlineLabel
                    checked={this.state.config.smtpSecure !== false}
                    onChange={(e, smtpSecure) => this.setConfigData({ smtpSecure })}
                    disabled={this.state.saving}
                />
                <Note field="smtpSecure" />

                <Grid columns={2}>
                    <div>
                        <TextField
                            label={Config.FIELD_NAMES.smtpUser}
                            value={this.state.config.smtpUser}
                            onChange={(e, smtpUser) => { this.setConfigData({ smtpUser }) }}
                            disabled={this.state.saving}
                        />
                        <Note field="smtpUser" />
                    </div>
                    <div>
                        <TextField
                            type="password"
                            canRevealPassword
                            revealPasswordAriaLabel={`Show ${Config.FIELD_NAMES.smtpPassword}`}
                            label={Config.FIELD_NAMES.smtpPassword}
                            value={this.state.config.smtpPassword}
                            onChange={(e, smtpPassword) => { this.setConfigData({ smtpPassword }) }}
                            disabled={this.state.saving}
                        />
                        <Note field="smtpPassword" />
                    </div>
                </Grid>
            </Stack>

            <Text block variant="large">Email Addresses</Text>

            <Stack tokens={{ childrenGap: 's2', }}>
                <Grid columns={2}>
                    <div>
                        <TextField
                            label={Config.FIELD_NAMES.emailTo}
                            value={this.state.config.emailTo}
                            onChange={(e, emailTo) => { this.setConfigData({ emailTo }) }}
                            disabled={this.state.saving}
                        />
                        <Note field="emailTo" />
                    </div>
                    <div>
                        <TextField
                            label={Config.FIELD_NAMES.emailFrom}
                            value={this.state.config.emailFrom}
                            onChange={(e, emailFrom) => { this.setConfigData({ emailFrom }) }}
                            disabled={this.state.saving}
                        />
                        <Note field="emailFrom" />
                    </div>
                </Grid>
            </Stack>
        </>;
    }

    renderSMSAlertConfig() {
        return <>
            <Text block variant="xLarge">SMS/MMS Alerts</Text>

            <Toggle 
                label={Config.FIELD_NAMES.enableSMSAlerts} 
                inlineLabel
                checked={this.state.config.enableSMSAlerts === true}
                onChange={(e, enableSMSAlerts) => this.setConfigData({ enableSMSAlerts })}
                disabled={this.state.saving}
            />
            <Note field="enableSMSAlerts" />
            
            <Text block variant="large">Twilio Settings</Text>
            
            <Stack tokens={{ childrenGap: 's2', }}>
                <Grid columns={2}>
                    <div>
                        <TextField
                            type="password"
                            canRevealPassword
                            revealPasswordAriaLabel={`Show ${Config.FIELD_NAMES.twilioAccountSid}`}
                            label={Config.FIELD_NAMES.twilioAccountSid}
                            value={this.state.config.twilioAccountSid}
                            onChange={(e, twilioAccountSid) => { this.setConfigData({ twilioAccountSid }) }}
                            disabled={this.state.saving}
                        />
                        <Note field="twilioAccountSid" />
                    </div>
                    <div>
                        <TextField
                            type="password"
                            canRevealPassword
                            revealPasswordAriaLabel={`Show ${Config.FIELD_NAMES.twilioAuthToken}`}
                            label={Config.FIELD_NAMES.twilioAuthToken}
                            value={this.state.config.twilioAuthToken}
                            onChange={(e, twilioAuthToken) => { this.setConfigData({ twilioAuthToken }) }}
                            disabled={this.state.saving}
                        />
                        <Note field="twilioAuthToken" />
                    </div>
                </Grid>
            </Stack>

            <Text block variant="large">Phone Numbers</Text>

            <Stack tokens={{ childrenGap: 's2', }}>
                <Grid columns={2}>
                    <div>
                        <TextField
                            label={Config.FIELD_NAMES.smsTo}
                            value={this.state.config.smsTo}
                            onChange={(e, smsTo) => { this.setConfigData({ smsTo }) }}
                            disabled={this.state.saving}
                        />
                        <Note field="smsTo" />
                    </div>
                    <div>
                        <TextField
                            label={Config.FIELD_NAMES.smsFrom}
                            value={this.state.config.smsFrom}
                            onChange={(e, smsFrom) => { this.setConfigData({ smsFrom }) }}
                            disabled={this.state.saving}
                        />
                        <Note field="smsFrom" />
                    </div>
                </Grid>
            </Stack>
        </>;
    }

    renderSaveButton() {
        return <Stack horizontal>
            {this.state.saving
                ? <FluentSpinner label="Saving..." ariaLive="assertive" labelPosition="right" />
                : <PrimaryButton iconProps={{ iconName: 'DeviceFloppy' }} text="Save Settings" onClick={this.save}/>}
        </Stack>
    }

    render() {
        return <Spinner waitFor={this.loader}>
            <Stack tokens={{ childrenGap: 'm', }}>
                {this.state.error 
                    ? <MessageBar messageBarType={MessageBarType.error}>{this.state.error}</MessageBar>
                    : undefined}

                {this.renderSaveButton()}
                
                <Separator styles={separatorStyles} />

                {this.renderEmailAlertConfig()}

                <Separator styles={separatorStyles} />

                {this.renderSMSAlertConfig()}

                <Separator styles={separatorStyles} />

                {this.renderSaveButton()}
            </Stack>
        </Spinner>;
    }
}