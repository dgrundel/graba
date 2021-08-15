import { Feed } from './feed';
import React from 'react';
import { ErrorMessage, mergeErrors, validateIf, validateNotEmpty, validateNumberGreaterThanOrEqual, validateNumberLessThanOrEqual, validateNumeric } from '../validator/validators';

export interface Config {
    feeds: Feed[];

    // alert toggles
    enableEmailAlerts?: boolean;
    enableSMSAlerts?: boolean;

    // outgoing mail server
    smtpServer?: string;
    smtpPort?: number;
    smtpSecure?: boolean;
    smtpUser?: string;
    smtpPassword?: string;

    // email addresses
    emailFrom?: string;
    emailTo?: string;

    // twilio api credentials
    twilioAccountSid?: string;
    twilioAuthToken?: string;

    // sms/mms numbers
    smsFrom?: string;
    smsTo?: string;
}

export namespace Config {
    export const FIELD_NAMES: Record<keyof Config, string> = {
        feeds: 'Feeds',
        enableEmailAlerts: 'Enable email alerts',
        enableSMSAlerts: 'Enable SMS/MMS alerts',
        smtpServer: 'SMTP server',
        smtpPort: 'SMTP port',
        smtpSecure: 'Use SSL for SMTP',
        smtpUser: 'SMTP username',
        smtpPassword: 'SMTP password',
        emailFrom: 'Email from',
        emailTo: 'Email to',
        twilioAccountSid: 'Twilio Account SID',
        twilioAuthToken: 'Twilio Auth Token',
        smsFrom: 'SMS/MMS from',
        smsTo: 'SMS/MMS to',
    };
    
    export const FIELD_TOOLTIPS: Record<keyof Config, string | JSX.Element | undefined> = {
        feeds: undefined,
        enableEmailAlerts: undefined,
        enableSMSAlerts: undefined,
        smtpServer: undefined,
        smtpPort: <>
            Port used by your SMTP server.
            Defaults to 465 for SSL connections, 587 otherwise.
        </>,
        smtpSecure: <>
            If enabled, use a secure connection to SMTP server.
        </>,
        smtpUser: undefined,
        smtpPassword: undefined,
        emailFrom: <>
            The address displayed in the "From" header for messages
            sent by this server.
        </>,
        emailTo: <>
            Where to send email alerts. Probably your personal email address.
        </>,
        twilioAccountSid: <>
            Twilio account required for SMS/MMS.
            Find your account SID at twilio.com/console
        </>,
        twilioAuthToken: <>
            Twilio account required for SMS/MMS.
            Find your auth token at twilio.com/console
        </>,
        smsFrom: <>
            The phone number from which SMS/MMS messages will be sent.
            Should probably match your Twilio number.
        </>,
        smsTo: <>
            The phone number to which alert SMS/MMS message will be sent.
            Probably your actual mobile phone number.
        </>,
    };
}

const keyAndLabel = (k: keyof Config): [keyof Config, string] => {
    return [k, Config.FIELD_NAMES[k]];
}

export const validateConfig = (config: Partial<Config>): ErrorMessage[] => {
    return mergeErrors(
        ...validateIf(
            typeof config.smtpPort !== 'undefined',
            [
                validateNumeric(config, ...keyAndLabel('smtpPort')),
            ]
        ),
    );
}
