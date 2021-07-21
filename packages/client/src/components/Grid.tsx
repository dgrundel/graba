import React, { CSSProperties } from 'react';
import { theme } from '../theme';

interface Props {
    columns?: number | string;
    rows?: number | string;
    gap?: string;
    style?: React.CSSProperties;
}

interface State {
}

const DEFAULT_GAP = theme.spacing.m;

const templateToStr = (template?: number | string): string => {
    if (typeof template === 'string') {
        return template;
    }
    
    return `repeat(${template || 1}, 1fr)`;
}

export class Grid extends React.Component<Props, State> {
    private readonly style: React.CSSProperties;

    constructor(props: Props) {
        super(props);

        const builtInStyle: CSSProperties = {
            display: 'grid',
            gap: typeof props.gap !== 'undefined' ? props.gap : DEFAULT_GAP,
            gridTemplateRows: templateToStr(props.rows),
            gridTemplateColumns: templateToStr(props.columns),
        };

        this.style = {
            ...builtInStyle,
            ...props.style,
        };
    }

    render() {
        return <div style={this.style}>{this.props.children}</div>;
    }
}