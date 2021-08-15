export interface ValidationErrorDetails {
    target: string;
    code: string;
    message: string;
    prefix?: string;
    suffix?: string;
    blockedWord?: string;
}
