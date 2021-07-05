export interface ErrorMessage {
    field: string;
    message: string;
}

const isEmptyString = (value?: any): boolean => {
    return (typeof value === 'string' && value.length === 0);
}

const validate = (condition: boolean, field: string, message: string): ErrorMessage | undefined => {
    return condition ? undefined : { field, message };
}

/**
 * Exported Utils
 */

export const mergeErrors = (...args: (ErrorMessage | undefined)[]): ErrorMessage[] => {
    return args.filter(e => typeof e !== 'undefined') as ErrorMessage[];
};

/**
 * Validators
 */

export const validateNotEmpty = (obj: Record<string, any>, field: string, label?: string): ErrorMessage | undefined => {
    const condition = obj[field];
    return validate(condition, field, `${label || field} cannot be empty.`);
};

export const validateNumeric = (obj: Record<string, any>, field: string, label?: string): ErrorMessage | undefined => {
    const value = obj[field];
    if (typeof value !== 'undefined' && !isEmptyString(value)) {
        const condition = !isNaN(+value); // passes for empty string
        return validate(condition, field, `${label || field} must be a number.`);
    }
};
