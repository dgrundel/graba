export interface SystemStats {
    load: {
        avgLoad: number;
        currentLoad: number; // %
        cpus: {
            load: number;  // %
        }[]
    };
    memory: {
        free: number; // bytes
        used: number; // bytes
        total: number; // bytes
    };
    disks: {
        mount: string;
        size: number; // bytes
        used: number; // bytes
        use: number; // %
    }[];
    network: {
        iface: string;
        rx_bytes: number; // bytes
        tx_bytes: number; // bytes
        rx_sec: number; // bytes
        tx_sec: number; // bytes
    }[];
    temperatures?: {
        main: number;
        max: number;
        cores: number[];
    };
}