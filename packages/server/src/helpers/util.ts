process.on('SIGINT', () => process.exit());
process.on('SIGQUIT', () => process.exit());
process.on('SIGTERM', () => process.exit());

export const onExit = (handler: () => void): (() => void) => {
    process.on('exit', handler);

    return () => process.off('exit', handler);
}