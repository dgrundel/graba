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