export interface SystemStats {
    serverPid: number;
    load: SystemStats.Load;
    processes: SystemStats.Processes;
    memory: SystemStats.Memory;
    disks: SystemStats.Disk[];
    network: SystemStats.Network[];
    temperatures?: SystemStats.Temperatures;
}

export namespace SystemStats {
    export interface Load {
        avgLoad: number;
        currentLoad: number; // %
        cpus: {
            load: number;  // %
        }[]
    };

    export interface Process {
        pid: number;
        parentPid: number;
        name: string;
        cpu: number; // %
        mem: number; // %
        command: string;
        params: string;
        path: string;
    };

    export interface Processes {
        list: Process[];
    };

    export interface Memory {
        free: number; // bytes
        used: number; // bytes
        total: number; // bytes
    };

    export interface Disk {
        mount: string;
        size: number; // bytes
        used: number; // bytes
        use: number; // %
    };

    export interface Network {
        iface: string;
        rx_bytes: number; // bytes
        tx_bytes: number; // bytes
        rx_sec: number; // bytes
        tx_sec: number; // bytes
    };

    export interface Temperatures {
        main: number;
        max: number;
        cores: number[];
    };
}