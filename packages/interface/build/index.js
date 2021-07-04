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
        .concat(validateNotEmpty(feed, 'name'))
        .concat(validateNotEmpty(feed, 'streamUrl'));
};
exports.validateFeed = validateFeed;
