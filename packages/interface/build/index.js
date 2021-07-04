"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFeed = void 0;
const validateNotEmpty = (obj, field, label) => {
    if (obj[field]) {
        return [];
    }
    return [
        { field, message: `${label || field} cannot be empty.` }
    ];
};
const validateFeed = (feed) => {
    return []
        .concat(validateNotEmpty(feed, 'id'))
        .concat(validateNotEmpty(feed, 'name', 'Feed name'))
        .concat(validateNotEmpty(feed, 'streamUrl', 'Stream URL'));
};
exports.validateFeed = validateFeed;
