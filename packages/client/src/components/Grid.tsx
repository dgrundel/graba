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

export class Grid extends React.Component<Props, State> {
    private readonly style: React.CSSProperties;

    constructor(props: Props) {
        super(props);

        // always set columns to something
        const columns = typeof props.columns === 'string' ? props.columns : `repeat(${props.columns || 1}, 1fr)`;
        // don't set rows if undefined
        const rows = typeof props.rows === 'number' ? `repeat(${props.rows}, 1fr)` : props.rows;

        const builtInStyle: CSSProperties = {
            display: 'grid',
            gap: typeof props.gap !== 'undefined' ? props.gap : DEFAULT_GAP,
            gridTemplateRows: rows,
            gridTemplateColumns: columns,
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