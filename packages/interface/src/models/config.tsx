import { Feed } from './feed';
import React from 'react';

export interface Config {
    feeds: Feed[];

    // outgoing mail server
    smtpServer?: string;
    smtpPort?: number;
    smtpSecure?: boolean;
    smtpUser?: string;
    smtpPassword?: string;
}

export namespace Config {
    export const FIELD_NAMES: Record<keyof Config, string> = {
        feeds: 'Feeds',
        smtpServer: 'SMTP server',
        smtpPort: 'SMTP port',
        smtpSecure: 'Use SSL for SMTP',
        smtpUser: 'SMTP username',
        smtpPassword: 'SMTP password',
    };
    
    export const FIELD_TOOLTIPS: Record<keyof Config, string | JSX.Element | undefined> = {
        feeds: undefined,
        smtpServer: <></>,
        smtpPort: <></>,
        smtpSecure: <>
            If enabled, use a secure connection to SMTP server.
        </>,
        smtpUser: <></>,
        smtpPassword: <></>,
    };
}