export interface ErrorMessage {
    field: string;
    message: string;
}
/**
 * Exported Utils
 */
export declare const mergeErrors: (...args: (ErrorMessage | undefined)[]) => ErrorMessage[];
/**
 * Validators
 */
export declare const validateNotEmpty: (obj: Record<string, any>, field: string, label?: string | undefined) => ErrorMessage | undefined;
export declare const validateNumeric: (obj: Record<string, any>, field: string, label?: string | undefined) => ErrorMessage | undefined;
