export interface ErrorMessage {
    field: string;
    message: string;
}

type ValidationResult = ErrorMessage | undefined;

const isEmptyString = (value?: any): boolean => {
    return (typeof value === 'string' && value.length === 0);
}

const validate = (condition: boolean, field: string, message: string): ValidationResult => {
    return condition ? undefined : { field, message };
}

const isSuccess = (result: ValidationResult): boolean => {
    return typeof result === 'undefined' || (Array.isArray(result) && result.length === 0);
};

/**
 * Exported Utils
 */

export const mergeErrors = (...args: ValidationResult[]): ErrorMessage[] => {
    return args.filter(e => typeof e !== 'undefined') as ErrorMessage[];
};

export const validateIf = (result: ValidationResult | boolean, dependents: ValidationResult[]): ErrorMessage[] => {
    const condition = typeof result === 'boolean' ? result : isSuccess(result);
    const onConditionFalse = typeof result === 'boolean' ? [] : mergeErrors(result);
    
    return condition ? mergeErrors(...dependents) : onConditionFalse;
};

/**
 * Validators
 */

export const validateNotEmpty = (obj: Record<string, any>, field: string, label?: string): ValidationResult => {
    const condition = obj[field];
    return validate(condition, field, `${label || field} cannot be empty.`);
};

export const validateNumeric = (obj: Record<string, any>, field: string, label?: string): ValidationResult => {
    const value = obj[field];
    if (typeof value !== 'undefined' && !isEmptyString(value)) {
        const condition = !isNaN(+value); // passes for empty string
        return validate(condition, field, `${label || field} must be a number.`);
    }
};

export const validateNumberGreaterThanOrEqual = (obj: Record<string, any>, field: string, min: number, label?: string): ValidationResult => {
    const value = +(obj[field]);
    const condition = value >= min;
    
    return validate(condition, field, `${label || field} must be greater than or equal to ${min}.`);
};

export const validateNumberLessThanOrEqual = (obj: Record<string, any>, field: string, max: number, label?: string): ValidationResult => {
    const value = +(obj[field]);
    const condition = value <= max;
    
    return validate(condition, field, `${label || field} must be less than or equal to ${max}`);
};

