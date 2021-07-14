"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNumberLessThanOrEqual = exports.validateNumberGreaterThanOrEqual = exports.validateNumeric = exports.validateNotEmpty = exports.validateIf = exports.mergeErrors = void 0;
const isEmptyString = (value) => {
    return (typeof value === 'string' && value.length === 0);
};
const validate = (condition, field, message) => {
    return condition ? undefined : { field, message };
};
const isSuccess = (result) => {
    return typeof result === 'undefined' || (Array.isArray(result) && result.length === 0);
};
/**
 * Exported Utils
 */
const mergeErrors = (...args) => {
    return args.filter(e => typeof e !== 'undefined');
};
exports.mergeErrors = mergeErrors;
const validateIf = (result, dependents) => {
    const condition = typeof result === 'boolean' ? result : isSuccess(result);
    const onConditionFalse = typeof result === 'boolean' ? [] : exports.mergeErrors(result);
    return condition ? exports.mergeErrors(...dependents) : onConditionFalse;
};
exports.validateIf = validateIf;
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
const validateNumberGreaterThanOrEqual = (obj, field, min, label) => {
    const value = +(obj[field]);
    const condition = value >= min;
    return validate(condition, field, `${label || field} must be greater than or equal to ${min}.`);
};
exports.validateNumberGreaterThanOrEqual = validateNumberGreaterThanOrEqual;
const validateNumberLessThanOrEqual = (obj, field, max, label) => {
    const value = +(obj[field]);
    const condition = value <= max;
    return validate(condition, field, `${label || field} must be less than or equal to ${max}`);
};
exports.validateNumberLessThanOrEqual = validateNumberLessThanOrEqual;
