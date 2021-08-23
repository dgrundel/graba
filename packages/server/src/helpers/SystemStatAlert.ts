import { SystemStats } from 'graba.interface';
import { config } from '../background/config';
import { sendEmail } from './functional/sendEmail';
import { sendSms } from './functional/sendSms';
import { throttle } from 'throttle-debounce';

const ONE_MINUTE = 1000 * 60;
const DISK_SPACE_THROTTLE = ONE_MINUTE * 20;

export class SystemStatAlert {
    constructor() {
        this.onStatUpdate = this.onStatUpdate.bind(this);

        this.checkDiskSpace = throttle(DISK_SPACE_THROTTLE, this.checkDiskSpace.bind(this));
    }

    onStatUpdate(stats: SystemStats) {
        if (config.enableDiskSpaceAlerts) {
            this.checkDiskSpace(stats);
        }
    }

    checkDiskSpace(stats: SystemStats) {
        const threshold = config.diskSpaceAlertThreshold;

        if (typeof threshold !== 'undefined') {
            const messages: string[] = [];

            stats.disks.forEach(disk => {
                const percentUsed = disk.used / disk.size;
                if (percentUsed > threshold) {
                    messages.push(`Disk usage for disk "${disk.mount}" is ${(percentUsed * 100).toFixed(2)}%.`);
                }
            });
    
            if (messages.length > 0) {
                this.broadcast(
                    `System alert`,
                    `## System Alert\n\n${messages.join('\n')}`,
                    `<h2>System Alert</h2><p>${messages.join('</p><p>')}</p>`
                );
            }
        }
    }

    broadcast(subject: string, text: string, html: string) {
        sendSms({ body: text, });
        sendEmail({ subject, text, html, });
    }
}