"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNumeric = exports.validateNotEmpty = exports.mergeErrors = void 0;
const isEmptyString = (value) => {
    return (typeof value === 'string' && value.length === 0);
};
const validate = (condition, field, message) => {
    return condition ? undefined : { field, message };
};
/**
 * Exported Utils
 */
const mergeErrors = (...args) => {
    return args.filter(e => typeof e !== 'undefined');
};
exports.mergeErrors = mergeErrors;
/**
 * Validators
 */
const validateNotEmpty = (obj, field, label) => {
    const condition = obj[field];
    return validate(condition, field, `${label || field} cannot be empty.`);
};
exports.validateNotEmpty = validateNotEmpty;
const validateNumeric = (obj, field, label) => {
    const value = obj[field];
    if (typeof value !== 'undefined' && !isEmptyString(value)) {
        const condition = !isNaN(+value); // passes for empty string
        return validate(condition, field, `${label || field} must be a number.`);
    }
};
exports.validateNumeric = validateNumeric;
