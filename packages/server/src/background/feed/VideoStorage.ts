import conf from 'conf';
import path from 'path';
import { nanoid } from 'nanoid';
import { Feed, VideoRecord } from 'hastycam.interface';

const MAX_FILE_NAME_LENGTH = 255;

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

const generateFileName = (date: Date, feed: Feed) => {
    const randomId = nanoid(4);
    const dateString = date.toISOString().replace(/\W+/g, '-');
    const partialName = `_${feed.id}_${randomId}_${dateString}.jpegstream`;

    const maxChars = (MAX_FILE_NAME_LENGTH - partialName.length);
    let feedNameString = feed.name.replace(/\W+/g, '-');
    if (feedNameString.length > maxChars) {
        feedNameString = feedNameString.slice(0, maxChars);
    }

    return feedNameString + partialName;
}

export const getAllVideoRecords = (): VideoRecord[] => {
    const records = store.get('records');

    return Object.values(records);
};

export const createVideoRecord = (feed: Feed): VideoRecord => {
    if (!feed.savePath) {
        throw new Error(`Save path is empty for feed ${feed.name} [${feed.id}]`);
    }

    const date = new Date();
    const fileName = generateFileName(date, feed);
    const filePath = path.join(feed.savePath, fileName);

    const record = {
        id: nanoid(),
        feedId: feed.id,
        path: filePath,
        date: +(new Date()),
    };

    const records = store.get('records');
    records[record.id] = record;
    store.set('records', records);

    return record;
}