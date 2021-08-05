import React from 'react';

interface Props {
    style?: React.CSSProperties;
}

interface State {
}

const outerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateRows: '[top] 1fr [middle] auto [bottom] 1fr',
    gridTemplateColumns: '[left] 1fr [center] auto [right] 1fr',
    height: '100%',
    width: '100%',
}
const innerStyle: React.CSSProperties = {
    gridRow: 'middle / span 1',
    gridColumn: 'center / span 1',
};

export class Centered extends React.Component<Props, State> {
    render() {
        const mergedInnerStyle: React.CSSProperties = {
            ...innerStyle,
            ...this.props.style
        };

        return <div style={outerStyle}>
            <div style={mergedInnerStyle}>{this.props.children}</div>
        </div>;
    }
}