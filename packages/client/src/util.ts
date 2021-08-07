import { IColumn } from '@fluentui/react';

/**
 * humanSize stolen from https://github.com/andrewrk/node-human-size
 * 
 * Normally I would just install the module but it doesn't ship with 
 * types and it's sooooo tiny.
 */
const MAGS = ' KMGTPEZY';
export const humanSize = (bytes: number, precision?: number) => {
    var magnitude = Math.min(Math.log(bytes) / Math.log(1024) | 0, MAGS.length - 1);
    var result = bytes / Math.pow(1024, magnitude);
    var suffix = MAGS[magnitude].trim() + 'B';
    return result.toFixed(precision) + suffix;
};

export const col = <T>(fieldName: keyof T, name: string, props?: Partial<IColumn>): IColumn => ({
    name,
    fieldName: fieldName as string, 
    key: fieldName as string, 
    minWidth: 50, 
    maxWidth: 200, 
    isResizable: true,
    ...props,
});

const strCompare = (a: string, b: string, desc?: boolean) => {
    return desc === true
        ? b.localeCompare(a, undefined, {sensitivity: 'base'})
        : a.localeCompare(b, undefined, {sensitivity: 'base'});
};

export const sortObjects = <T>(items: T[], key: keyof T, desc?: boolean) => {
    return items.slice().sort((a, b) => {
        const aValue = a[key];
        const aType = typeof aValue;
        const bValue = b[key];
        const bType = typeof bValue;

        if (aType !== bType) {
            return strCompare(aType, bType, desc);
        }

        switch(aType) {
            case 'number':
            case 'boolean':
            case 'bigint':
                return desc === true
                    ? (bValue as unknown as number) - (aValue as unknown as number)
                    : (aValue as unknown as number) - (bValue as unknown as number);
            default:
                return strCompare(`${aValue}`, `${bValue}`, desc);
        }
    });
};