export interface ErrorMessage {
    field: string;
    message: string;
}

const validateNotEmpty = (obj: any, field: string, label?: string): ErrorMessage[] => {
    if (obj[field]) {
        return [];
    }

    return [
        { field, message: `${label || field} cannot be empty.` }
    ];
};

export interface Feed {
    id: string;
    name: string;
    streamUrl: string;
    stillUrl?: string;
}

export const validateFeed = (feed: Partial<Feed>): ErrorMessage[] => {
    return ([] as ErrorMessage[])
        .concat(validateNotEmpty(feed, 'id'))
        .concat(validateNotEmpty(feed, 'name', 'Feed name'))
        .concat(validateNotEmpty(feed, 'streamUrl', 'Stream URL'));
}

export interface Config {
    feeds: Feed[];
}