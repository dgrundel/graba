import { Dropdown, IconButton, IDropdownOption, Stack } from '@fluentui/react';
import React, { FormEvent } from 'react';
import { sortObjects } from '../util';

interface Props<T> {
    items: T[];
    sortableBy: {
        [Property in keyof Partial<T>]: string
    }
    onSort: (updated: T[]) => void;
    sortBy: keyof T;
    desc?: boolean;
}

interface State<T> {
    sortBy: keyof T;
    desc: boolean;
}

export class Sorter<T> extends React.Component<Props<T>, State<T>> {
    constructor(props: Props<T>) {
        super(props);

        this.state = {
            sortBy: props.sortBy,
            desc: props.desc === true,
        };
    }

    componentDidMount() {
        this.updateSort(this.state.sortBy, this.state.desc);
    }

    updateSort(sortBy: keyof T, desc: boolean) {
        const items = sortObjects(this.props.items, sortBy, desc);
        this.props.onSort(items);

        this.setState({ sortBy, desc });
    }

    render() {
        const sortBy = this.state.sortBy;
        const desc = this.state.desc;

        const dropdownOnChange = (e: FormEvent<HTMLDivElement>, item?: IDropdownOption) => this.updateSort(item!.key as keyof T, desc);
        const dropdownOptions: IDropdownOption[] = Object.keys(this.props.sortableBy).map((key: string) => ({ 
            key: key,
            text: this.props.sortableBy[key as keyof T],
        }));

        const iconOnClick = () => this.updateSort(sortBy, !desc);
        const iconName = desc ? "SortAscending" : "SortDescending";
        
        return <Stack horizontal verticalAlign={'end'} tokens={{ childrenGap: 's2', }}>
            <Dropdown
                    placeholder="Sort by"
                    label="Sort by"
                    selectedKey={this.state.sortBy as string}
                    onChange={dropdownOnChange}
                    multiSelect={false}
                    options={dropdownOptions}
                    dropdownWidth="auto"
            />
            <IconButton iconProps={{ iconName }} onClick={iconOnClick}/>
        </Stack>;
    }
}