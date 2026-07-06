import { Request, Response, NextFunction } from 'express';
import zxcvbn from 'zxcvbn';

// ____ PASSWORD POLICY RULES ____
const PASSWORD_RULES = {
    minLength: 12,
    maxLength: 128,
    requireUppercase: /[A-Z]/,
    requireLowercase: /[a-z]/,
    requireNumbers: /[0-9]/,
    requireSymbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
};

export const validatePasswordStrength = (password: string): {
    isValid: boolean;
    errors: string[];
    score: number;
} => {
    const errors: string[] = [];

    if (password.length < PASSWORD_RULES.minLength) {
        errors.push(`Password must be at least ${PASSWORD_RULES.minLength} characters long`);
    }
    if (password.length > PASSWORD_RULES.maxLength) {
        errors.push(`Password must be less than ${PASSWORD_RULES.maxLength} characters`);
    }
    if (!PASSWORD_RULES.requireUppercase.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!PASSWORD_RULES.requireLowercase.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!PASSWORD_RULES.requireNumbers.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!PASSWORD_RULES.requireSymbols.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    // zxcvbn score: 0 = terrible, 4 = very strong
    const strengthResult = zxcvbn(password);
    if (strengthResult.score < 2) {
        errors.push('Password is too weak. Try mixing words, numbers and symbols');
    }

    return {
        isValid: errors.length === 0,
        errors,
        score: strengthResult.score,
    };
};

// ____ MIDDLEWARE _____
export const passwordPolicyMiddleware = (
    req: Request, res: Response, next: NextFunction
) => {
    const password = req.body.password;
    if (!password) return next();

    const { isValid, errors, score } = validatePasswordStrength(password);

    if (!isValid) {
        return res.status(400).json({
            success: false,
            message: 'Password does not meet security requirements',
            errors,
            passwordScore: score,
        });
    }
    next();
};