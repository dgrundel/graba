
export interface VideoRecord {
    id: string;
    feedId: string;
    path: string;
    startTime: number;
    endTime?: number;
    byteLength?: number;
    thumbnailPath?: string;
}