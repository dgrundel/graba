import { pid } from 'process';
import express from 'express';
import si from 'systeminformation';
import { SystemStats } from 'hastycam.interface';

export const router = express.Router();

// some SI APIs need to be called more than once 
// to be accurate, so call them once now
const warmup = Promise.all([
    si.currentLoad(),
    si.networkStats(),
]).then(() => new Promise(resolve => setTimeout(resolve, 200)));

router.get('/stats', async (req: any, res: any, next: () => void) => {
    await warmup;

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

    res.json(stats);
});

