export const AUTH_ERRORS = {
    EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
} as const;

export type AuthErrorCode = (typeof AUTH_ERRORS)[keyof typeof AUTH_ERRORS];

export type AuthError = {
    code: AuthErrorCode;
    message: string;
};

export function emailAlreadyExistsError(): AuthError {
    return {
        code: AUTH_ERRORS.EMAIL_ALREADY_EXISTS,
        message: "Email already exists",
    };
}