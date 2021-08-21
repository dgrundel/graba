process.on('SIGINT', () => process.exit());
process.on('SIGQUIT', () => process.exit());
process.on('SIGTERM', () => process.exit());

export const onExit = (handler: () => void): (() => void) => {
    process.on('exit', handler);

    return () => process.off('exit', handler);
}

const DEFAULT_SHORT_NAME_LEN = 120;
export const shortName = (s: string, maxLength: number = DEFAULT_SHORT_NAME_LEN): string => {
    let scrubbed = s.replace(/\W+/g, '-').replace(/\-+/, '-');
    
    return scrubbed.length > maxLength
        ? scrubbed.slice(0, maxLength)
        : scrubbed;
};
