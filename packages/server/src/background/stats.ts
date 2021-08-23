import { pid } from 'process';
import si from 'systeminformation';
import { SystemStats } from 'graba.interface';
import { Chain } from '../helpers/Chain';
import { EventEmitter } from 'stream';
import { SystemStatAlert } from '../helpers/SystemStatAlert';

const STAT_UPDATE_INTERVAL_MS = 1000 * 60 * 10;

enum Events {
    Updated = 'SystemStats:updated'
};

const emitter = new EventEmitter();

const processor = async (stats: SystemStats, prev?: SystemStats): Promise<SystemStats> => {
    emitter.emit(Events.Updated, stats, prev);
    return stats;
};

/**
 * Some SI APIs need to be called more than once 
 * to be accurate, so call them once now
 * 
 * @returns an empty promise :(
 */
 const warmup = async (): Promise<undefined> => {
    // wait for the APIs that need warming
    await Promise.all([
        si.currentLoad(),
        si.networkStats(),
    ]);
    
    // arbitrary delay to allow SI to gather more data
    await new Promise(resolve => setTimeout(resolve, 1000));

    return undefined;
};

const chain = new Chain(processor, warmup());

/**
 * Grab updated stats and push them into the chain.
 */
const updateStats = async () => {
    const serverPid = pid;
    const load = await si.currentLoad();
    const memory = await si.mem();
    const temperatures = await si.cpuTemperature();
    const network = await si.networkStats();
    const disks = await si.fsSize();
    const processes = await si.processes();

    const stats: SystemStats = {
        serverPid,
        load,
        memory,
        temperatures: temperatures.main ? temperatures : undefined,
        network,
        disks,
        processes,
    };

    chain.put(stats);
};

/**
 * Adds a one-time listener for stats update, then triggers
 * a stats refresh, which in turn triggers the update event.
 * 
 * This has the benefit of pushing all stat updates through
 * a single channel (the chain.)
 * 
 * @returns promise that resolves to latest SystemStats object
 */
export const getStats = (): Promise<SystemStats> => new Promise(resolve => {
    emitter.once(Events.Updated, resolve);
    updateStats();
});

/**
 * Listen for stat updates. Updates happen both at regular
 * intervals and also whenever explicitly requested (e.g. by
 * the dashboard route handler.)
 * 
 * @param handler - listener invoked for each stats update
 * @returns - function that detaches the listener
 */
export const onStatUpdate = (handler: (stats: SystemStats, prev?: SystemStats) => void): (() => void) => {
    emitter.on(Events.Updated, handler);

    // return an off handler
    return () => emitter.off(Events.Updated, handler);
};

/**
 * Start background processes
 */
export const start = () => {
    // automatically update current stats at regular interval
    setInterval(updateStats, STAT_UPDATE_INTERVAL_MS);

    const alerts = new SystemStatAlert();
    onStatUpdate(alerts.onStatUpdate);
};