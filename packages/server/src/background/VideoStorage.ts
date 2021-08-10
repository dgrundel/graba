import conf from 'conf';
import path from 'path';
import { nanoid } from 'nanoid';
import { Feed, VideoRecord } from 'graba.interface';

const MAX_FILE_NAME_LENGTH = 255 - 4; // 4 chars for file ext

interface VideoStorage {
    records: {
        [id: string]: VideoRecord
    }
}

const store = new conf<VideoStorage>({
    configName: 'videoStorage',
    defaults: {
        records: {}
    }
});

const generateId = (feed: Feed, date: number) => {
    const id = nanoid(6);
    const dateString = new Date(date).toISOString().replace(/\W+/g, '-');
    const partialId = `_${feed.id}_${dateString}_${id}`;

    const maxChars = (MAX_FILE_NAME_LENGTH - partialId.length);
    let feedStr = feed.name.replace(/\W+/g, '-');
    if (feedStr.length > maxChars) {
        feedStr = feedStr.slice(0, maxChars);
    }

    return feedStr + partialId;
}

export const getAllVideoRecords = (): VideoRecord[] => {
    const records = store.get('records');

    return Object.values(records);
};

export const getRecordById = (id: string): VideoRecord => {
    const records = store.get('records');

    return records[id];
};

export const deleteRecordById = (id: string) => {
    const records = store.get('records');

    delete records[id];

    store.set('records', records);
};

export const updateRecord = (updates: Omit<Partial<VideoRecord>, 'id'> & Pick<VideoRecord, 'id'>) => {
    const records = store.get('records');
    
    const id = updates.id;
    const existing = records[id];
    
    records[id] = {
        ...existing,
        ...updates,
    };

    store.set('records', records);
};

export const createVideoRecord = (feed: Feed): VideoRecord => {
    if (!feed.savePath) {
        throw new Error(`Save path is empty for feed ${feed.name} [${feed.id}]`);
    }

    const now = Date.now();

    const id = generateId(feed, now);
    const filePath = path.join(feed.savePath, id + '.mkv');
    
    const record: VideoRecord = {
        id,
        feedId: feed.id,
        path: filePath,
        startTime: now,
    };

    const records = store.get('records');
    records[record.id] = record;
    store.set('records', records);

    return record;
}