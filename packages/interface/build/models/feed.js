"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFeed = exports.Feed = void 0;
const validators_1 = require("../validator/validators");
var Feed;
(function (Feed) {
    Feed.DEFAULT_VIDEO_QUALITY = 24;
    Feed.DEFAULT_MAX_FPS = 16;
})(Feed = exports.Feed || (exports.Feed = {}));
const validateFeed = (feed) => {
    return validators_1.mergeErrors(validators_1.validateNotEmpty(feed, 'id'), validators_1.validateNotEmpty(feed, 'name', 'Feed name'), validators_1.validateNotEmpty(feed, 'streamUrl', 'Stream URL'), validators_1.validateNumeric(feed, 'maxFps', 'Max FPS'), validators_1.validateNumeric(feed, 'scaleFactor', 'Scale factor'), ...validators_1.validateIf(validators_1.validateNumeric(feed, 'videoQuality', 'Video quality'), validators_1.validateNumberGreaterThanOrEqual(feed, 'videoQuality', 2, 'Video quality'), validators_1.validateNumberLessThanOrEqual(feed, 'videoQuality', 31, 'Video quality')));
};
exports.validateFeed = validateFeed;