import { Feed } from './feed';
import React from 'react';
import { ErrorMessage, mergeErrors, validateIf, validateNotEmpty, validateNumberGreaterThanOrEqual, validateNumberLessThanOrEqual, validateNumeric } from '../validator/validators';

export interface Config {
    feeds: Feed[];

    // outgoing mail server
    smtpServer?: string;
    smtpPort?: number;
    smtpSecure?: boolean;
    smtpUser?: string;
    smtpPassword?: string;

    emailFrom?: string;
    emailTo?: string;
}

export namespace Config {
    export const FIELD_NAMES: Record<keyof Config, string> = {
        feeds: 'Feeds',
        smtpServer: 'SMTP server',
        smtpPort: 'SMTP port',
        smtpSecure: 'Use SSL for SMTP',
        smtpUser: 'SMTP username',
        smtpPassword: 'SMTP password',
        emailFrom: 'Email from',
        emailTo: 'Email to',
    };
    
    export const FIELD_TOOLTIPS: Record<keyof Config, string | JSX.Element | undefined> = {
        feeds: undefined,
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
