import { IFontStyles } from '@fluentui/react';
import { TablerIcon, TablerIconProps } from '@tabler/icons';
import React from 'react';
import { theme } from '../theme';

const baseIconProps = {
    style: {
        width: '100%',
        height: '100%',
    } as React.CSSProperties,
    stroke: 1.5,
    size: 16,
}

interface Props {
    icon: TablerIcon;
    size?: keyof IFontStyles;
    iconProps?: TablerIconProps;
    style?: React.CSSProperties;
}

interface State {
}

export class AppIcon extends React.Component<Props, State> {
    render() {
        const size = this.props.size || 'mediumPlus';

        const containerStyle: React.CSSProperties = {
            display: 'inline-block',
            verticalAlign: 'bottom',
            width: theme.fonts[size].fontSize,
            height: theme.fonts[size].fontSize,
            lineHeight: theme.fonts[size].fontSize,
            ...this.props.style,
        };

        const iconProps = {
            ...baseIconProps,
            ...this.props.iconProps,
            style: {
                ...baseIconProps.style,
                ...this.props.iconProps?.style,
            }
        };
        return <div style={containerStyle}><this.props.icon {...iconProps} /></div>;
    }
}