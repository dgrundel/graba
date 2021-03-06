import React from 'react';
import { IconButton, Modal as FluentModal, Stack } from '@fluentui/react';
import { Grid } from './Grid';
import { theme } from '../theme';

interface Props {
    open?: boolean
    onCancel?: () => void;
    buttons?: React.ReactNode;
}

interface State {
}

export class Modal extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const rows = `${this.props.onCancel ? 'auto' : ''} 1fr ${this.props.buttons ? 'auto' : ''}`;
        const header = this.props.onCancel 
            ? <div style={{ textAlign: 'right' }}>
                <IconButton
                    iconProps={{ iconName: 'X' }}
                    ariaLabel="Close modal"
                    onClick={this.props.onCancel}
                />
            </div>
            : undefined;
        const footer = this.props.buttons
            ? <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 's1', }}>
                {this.props.buttons}
            </Stack>
            : undefined;

        return <FluentModal
            isOpen={this.props.open}
            onDismiss={this.props.onCancel}
            isBlocking={true}
            containerClassName="foo"
        >
            <Grid rows={rows} style={{ minHeight: '180px', padding: theme.spacing.s1 }}>
                {header}
                <div>{this.props.children}</div>
                {footer}
            </Grid>
        </FluentModal>;
    }
}