import { createTheme, registerIcons } from '@fluentui/react';
import { IconCheck, IconPlus, IconTrash, IconChevronUp, IconChevronDown, IconChevronLeft, IconChevronRight, IconSettings, IconPlayerPlay, IconHome, IconVideo, IconDeviceFloppy, IconPencil, IconX, IconInfoCircle, IconHelp, IconPlayerRecord, IconAlertCircle, IconDownload, IconRun, TablerIconProps, IconSortAscending, IconSortDescending, IconCalendarOff, IconCalendar } from '@tabler/icons';
import { AppIcon } from './components/AppIcon';

const lightPalette = {
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
};

const darkPalette = {
    themePrimary: "#3a96dd",
    themeLighterAlt: "#020609",
    themeLighter: "#091823",
    themeLight: "#112d43",
    themeTertiary: "#235a85",
    themeSecondary: "#3385c3",
    themeDarkAlt: "#4ba0e1",
    themeDark: "#65aee6",
    themeDarker: "#8ac2ec",
    accent: "#3a96dd",

    neutralLighterAlt: '#282828',
    neutralLighter: '#313131',
    neutralLight: '#3f3f3f',
    neutralQuaternaryAlt: '#484848',
    neutralQuaternary: '#4f4f4f',
    neutralTertiaryAlt: '#6d6d6d',
    neutralTertiary: '#c8c8c8',
    neutralSecondary: '#d0d0d0',
    neutralPrimaryAlt: '#dadada',
    neutralPrimary: '#ffffff',
    neutralDark: '#f4f4f4',
    black: '#f8f8f8',
    white: '#1f1f1f',
};

export const theme = createTheme({
    palette: darkPalette,
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
        Calendar: <AppIcon icon={IconCalendar} style={fluentIconContainerStyle} iconProps={fluentIconProps} />,
        CheckMark: <AppIcon icon={IconCheck} style={fluentIconContainerStyle} iconProps={fluentIconProps} />,
        ChevronDown: <AppIcon icon={IconChevronDown} style={fluentIconContainerStyle} iconProps={fluentIconProps} />,
        ChevronLeft: <AppIcon icon={IconChevronLeft} style={fluentIconContainerStyle} iconProps={fluentIconProps} />,
        ChevronRight: <AppIcon icon={IconChevronRight} style={fluentIconContainerStyle} iconProps={fluentIconProps} />,
        ChevronUp: <AppIcon icon={IconChevronUp} style={fluentIconContainerStyle} iconProps={fluentIconProps} />,
        
        // used by Fluent, default styling
        ErrorBadge: <AppIcon icon={IconAlertCircle} />,

        // others
        CalendarOff: <AppIcon icon={IconCalendarOff} />,
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
        SortAscending: <AppIcon icon={IconSortAscending} />,
        SortDescending: <AppIcon icon={IconSortDescending} />,
        Trash: <AppIcon icon={IconTrash} />,
        Video: <AppIcon icon={IconVideo} />,
        X: <AppIcon icon={IconX} />,
    }
});