import { createTheme, registerIcons } from '@fluentui/react';
import { IconCheck, IconPlus, IconTrash, IconChevronUp, IconChevronDown, IconChevronLeft, IconChevronRight, IconSettings, IconPlayerPlay, IconHome, IconVideo, IconDeviceFloppy, IconPencil, IconX, IconInfoCircle, IconHelp, IconPlayerRecord, IconAlertCircle, IconDownload, IconRun, TablerIconProps } from '@tabler/icons';
import { AppIcon } from './components/AppIcon';

const generated = {
    palette: {
        themePrimary: '#0078d4',
        themeLighterAlt: '#eff6fc',
        themeLighter: '#deecf9',
        themeLight: '#c7e0f4',
        themeTertiary: '#71afe5',
        themeSecondary: '#2b88d8',
        themeDarkAlt: '#106ebe',
        themeDark: '#005a9e',
        themeDarker: '#004578',
        neutralLighterAlt: '#faf9f8',
        neutralLighter: '#f3f2f1',
        neutralLight: '#edebe9',
        neutralQuaternaryAlt: '#e1dfdd',
        neutralQuaternary: '#d0d0d0',
        neutralTertiaryAlt: '#c8c6c4',
        neutralTertiary: '#a19f9d',
        neutralSecondary: '#605e5c',
        neutralPrimaryAlt: '#3b3a39',
        neutralPrimary: '#323130',
        neutralDark: '#201f1e',
        black: '#000000',
        white: '#ffffff',
    }
};

export const theme = createTheme({
    ...generated,
    defaultFontStyle: { 
        fontFamily: "'AileronLight', sans-serif",
        fontWeight: 'regular',
        fontSize: '15px',
    },
    fonts: {
        xSmall: {
            fontSize: '9px',
        },
        small: {
            fontSize: '12px',
        },
        medium: {
            fontSize: '15px',
        },
        mediumPlus: {
            fontSize: '16px',
        },
        large: {
            fontSize: '20px',
            fontWeight: 'semibold',
        },
        xLarge: {
            fontSize: '22px',
            fontWeight: 'bold',
        },
        xxLarge: {
            fontSize: '26px',
            fontWeight: 'bold',
        },
    },
});

const fluentIconProps: TablerIconProps = {
    style: {
        position: 'relative', 
        top: '.15rem',
    }
}

const fluentIconContainerStyle = { verticalAlign: 'baseline' };

registerIcons({
    icons: {
        // used by Fluent, needs special styling
        CheckMark: <AppIcon icon={IconCheck} style={fluentIconContainerStyle} iconProps={fluentIconProps} />,
        ChevronDown: <AppIcon icon={IconChevronDown} style={fluentIconContainerStyle} iconProps={fluentIconProps} />,
        ChevronLeft: <AppIcon icon={IconChevronLeft} style={fluentIconContainerStyle} iconProps={fluentIconProps} />,
        ChevronRight: <AppIcon icon={IconChevronRight} style={fluentIconContainerStyle} iconProps={fluentIconProps} />,
        ChevronUp: <AppIcon icon={IconChevronUp} style={fluentIconContainerStyle} iconProps={fluentIconProps} />,
        
        // used by Fluent, default styling
        ErrorBadge: <AppIcon icon={IconAlertCircle} />,

        // others
        DeviceFloppy: <AppIcon icon={IconDeviceFloppy} />,
        Download: <AppIcon icon={IconDownload} />,
        Help: <AppIcon icon={IconHelp} />,
        Home: <AppIcon icon={IconHome} />,
        InfoCircle: <AppIcon icon={IconInfoCircle} />,
        Pencil: <AppIcon icon={IconPencil} />,
        PlayerPlay: <AppIcon icon={IconPlayerPlay} />,
        PlayerRecord: <AppIcon icon={IconPlayerRecord} />,
        Plus: <AppIcon icon={IconPlus} />,
        Run: <AppIcon icon={IconRun} />,
        Settings: <AppIcon icon={IconSettings} />,
        Trash: <AppIcon icon={IconTrash} />,
        Video: <AppIcon icon={IconVideo} />,
        X: <AppIcon icon={IconX} />,
    }
});