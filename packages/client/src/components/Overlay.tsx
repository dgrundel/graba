import React from 'react';
import { theme } from '../theme';

interface Props {
    element?: React.ReactNode;
    position?: 'tl' | 'tr' | 'bl' | 'br';
    spacing?: string;
    style?: React.CSSProperties;
}

interface State {
}

const DEFAULT_POSITION = 'br';
const DEFAULT_SPACING = theme.spacing.s1;

export class Overlay extends React.Component<Props, State> {
    private readonly style: React.CSSProperties;
    private readonly innerStyle: React.CSSProperties;

    constructor(props: Props) {
        super(props);

        this.style = {
            display: 'inline-block',
            position: 'relative',
            ...props.style,
        };

        const position = props.position || DEFAULT_POSITION;
        const spacing = props.spacing || DEFAULT_SPACING;
        this.innerStyle = {
            position: 'absolute',
            top: position === 'tl' || position === 'tr' ? spacing : undefined,
            bottom: position === 'bl' || position === 'br' ? spacing : undefined,
            left: position === 'tl' || position === 'bl' ? spacing : undefined,
            right: position === 'tr' || position === 'br' ? spacing : undefined,
        };
    }

    render() {
        if (!this.props.element) {
            return this.props.children;
        }

        return <div style={this.style}>
            {this.props.children}
            <div style={this.innerStyle}>{this.props.element}</div>
        </div>;
    }
}