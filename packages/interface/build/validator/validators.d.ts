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
/**
 * Validators
 */
export declare const validateNotEmpty: (obj: Record<string, any>, field: string, label?: string | undefined) => ValidationResult;
export declare const validateNumeric: (obj: Record<string, any>, field: string, label?: string | undefined) => ValidationResult;
export declare const validateNumberGreaterThanOrEqual: (obj: Record<string, any>, field: string, min: number, label?: string | undefined) => ValidationResult;
export declare const validateNumberLessThanOrEqual: (obj: Record<string, any>, field: string, max: number, label?: string | undefined) => ValidationResult;
export {};
