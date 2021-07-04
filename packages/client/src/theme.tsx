import { createTheme, Icon, registerIcons } from '@fluentui/react';
import { IconCheck, IconPlus, IconTrash, IconChevronUp, IconChevronDown, IconChevronLeft, IconChevronRight, IconSettings, IconPlayerPlay, IconHome, IconVideo, IconDeviceFloppy, IconPencil, IconX } from '@tabler/icons';
import { CSSProperties } from 'react';

// const generated = ({
//     palette: {
//         themePrimary: '#54ebbb',
//         themeLighterAlt: '#030907',
//         themeLighter: '#0e261e',
//         themeLight: '#194638',
//         themeTertiary: '#338d70',
//         themeSecondary: '#4acea5',
//         themeDarkAlt: '#64edc1',
//         themeDark: '#7befcb',
//         themeDarker: '#9cf4d8',
//         neutralLighterAlt: '#323130',
//         neutralLighter: '#31302f',
//         neutralLight: '#2f2e2d',
//         neutralQuaternaryAlt: '#2c2b2a',
//         neutralQuaternary: '#2a2928',
//         neutralTertiaryAlt: '#282726',
//         neutralTertiary: '#c8c8c8',
//         neutralSecondary: '#d0d0d0',
//         neutralPrimaryAlt: '#dadada',
//         neutralPrimary: '#ffffff',
//         neutralDark: '#f4f4f4',
//         black: '#f8f8f8',
//         white: '#323130',
//     }
// });

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
        fontFamily: "'BrisaSansThin', sans-serif",
        fontWeight: 'regular',
        fontSize: '15px',
        letterSpacing: '0.03rem',
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
        large: {
            fontSize: '20px',
            fontWeight: 'semibold',
        },
        xLarge: {
            fontSize: '22px',
            fontWeight: 'bold',
        },
    },
});

const iconProps = {
    style: {
        width: '100%',
        height: '100%',
    } as CSSProperties,
    stroke: 1.25,
    size: 16,
}

const fluentIconProps = {
    ...iconProps,
    style: {
        ...iconProps.style,
        position: 'relative', 
        top: '.15rem',
    } as CSSProperties
}

registerIcons({
    icons: {
        // used by Fluent
        CheckMark: <IconCheck {...fluentIconProps} />,
        ChevronDown: <IconChevronDown {...fluentIconProps} />,
        ChevronLeft: <IconChevronLeft {...fluentIconProps} />,
        ChevronRight: <IconChevronRight {...fluentIconProps} />,
        ChevronUp: <IconChevronUp {...fluentIconProps} />,

        // others
        DeviceFloppy: <IconDeviceFloppy {...iconProps} />,
        Home: <IconHome {...iconProps} />,
        Pencil: <IconPencil {...iconProps} />,
        PlayerPlay: <IconPlayerPlay {...iconProps} />,
        Plus: <IconPlus {...iconProps} />,
        Settings: <IconSettings {...iconProps} />,
        Trash: <IconTrash {...iconProps} />,
        Video: <IconVideo {...iconProps} />,
        X: <IconX {...iconProps} />,
    }
});