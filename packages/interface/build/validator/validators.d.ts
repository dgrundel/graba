export interface ErrorMessage {
    field: string;
    message: string;
}
declare type ValidationResult = ErrorMessage | undefined;
/**
 * Exported Utils
 */
export declare const mergeErrors: (...args: ValidationResult[]) => ErrorMessage[];
export declare const validateIf: (result: ValidationResult | boolean, dependents: ValidationResult[]) => ErrorMessage[];
export declare const createValidator: (condition: (...args: any[]) => boolean, field: string, message: string) => (...args: any[]) => ValidationResult;
/**
 * Validators
 */
export declare const validateNotEmpty: <T>(obj: T, field: keyof T, label?: string | undefined) => ValidationResult;
export declare const validateNumeric: <T>(obj: T, field: keyof T, label?: string | undefined) => ValidationResult;
export declare const validateNumberGreaterThanOrEqual: <T>(obj: T, field: keyof T, min: number, label?: string | undefined) => ValidationResult;
export declare const validateNumberLessThanOrEqual: <T>(obj: T, field: keyof T, max: number, label?: string | undefined) => ValidationResult;
export {};
