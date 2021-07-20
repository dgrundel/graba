import conf from 'conf';
import path from 'path';
import { nanoid } from 'nanoid';
import { Feed } from 'hastycam.interface';

const MAX_FILE_NAME_LENGTH = 255;

interface VideoRecords {
    [feedId: string]: {
        path: string;
        date: string;
    }[]
}

const store = new conf<VideoRecords>({
    configName: 'videoStorage',
    defaults: {}
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

export const createFile = (feed: Feed): string => {
    if (!feed.savePath) {
        throw new Error(`Save path is empty for feed ${feed.name} [${feed.id}]`);
    }
    
    const records = store.get(feed.id, []);

    const date = new Date();
    const fileName = generateFileName(date, feed);
    const filePath = path.join(feed.savePath, fileName);

    records.push({
        path: filePath,
        date: date.toISOString(),
    });

    store.set(feed.id, records);

    return filePath;
}