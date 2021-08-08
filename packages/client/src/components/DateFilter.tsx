import { DatePicker, IconButton, Stack } from '@fluentui/react';
import React from 'react';

interface Props<T> {
    items: T[];
    itemRangeStart: (t: T) => Date | undefined;
    itemRangeEnd: (t: T) => Date | undefined;
    itemSetVisibility: (t: T, visible: boolean) => void;
    onFilter: (items: T[]) => void;
    start?: Date;
    end?: Date;
}

interface State {
    start?: Date;
    end?: Date;
}

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

export class DateFilter<T> extends React.Component<Props<T>, State> {
    constructor(props: Props<T>) {
        super(props);

        this.state = {
            start: props.start,
            end: props.end,
        };
    }

    componentDidMount() {
        this.updateFilter(this.state.start, this.state.end);
    }

    updateFilter(start?: Date, end?: Date) {
        const startN = start ? start.getTime() : undefined;
        // add one day minus 1ms to the end date so we get the full day included in range
        const endN = end ? (end.getTime() + ONE_DAY_MS - 1) : undefined;

        const itemRangeStart = this.props.itemRangeStart;
        const itemRangeEnd = this.props.itemRangeEnd;
        const itemSetVisibility = this.props.itemSetVisibility;

        const items = this.props.items.map(item => {
            const itemStart = itemRangeStart(item);
            const itemEnd = itemRangeEnd(item);

            const itemStartN = itemStart ? +itemStart.getTime() : -Infinity;
            const itemEndN = itemEnd ? itemEnd.getTime() : +Infinity;

            const startInRange = startN ? itemStartN >= startN : true;
            const endInRange = endN ? itemEndN <= endN : true;

            itemSetVisibility(item, startInRange && endInRange);
            return item;
        });

        this.props.onFilter(items);
        this.setState({ start, end });
    }

    render() {
        const start = this.state.start;
        const end = this.state.end;

        const onSelectStart = (date: Date | null | undefined) => this.updateFilter(date || undefined, end);
        const onSelectEnd = (date: Date | null | undefined) => this.updateFilter(start, date || undefined);
        const iconOnClick = () => this.updateFilter(undefined, undefined);
        
        const datePickerStyles = {
            statusMessage: {
                display: 'none',
            }
        };

        return <Stack horizontal verticalAlign={'end'} tokens={{ childrenGap: 's2', }}>
            <DatePicker
                label="Filter by date"
                placeholder="Select start date"
                ariaLabel="Filter by date start"
                value={start}
                maxDate={end}
                onSelectDate={onSelectStart}
                styles={datePickerStyles}
            />
            <DatePicker
                placeholder="Select end date"
                ariaLabel="Filter by date end"
                value={end}
                minDate={start}
                onSelectDate={onSelectEnd}
                styles={datePickerStyles}
            />
            <IconButton iconProps={{ iconName: "CalendarOff", "aria-label": "Clear" }} onClick={iconOnClick}/>
        </Stack>;
    }
}