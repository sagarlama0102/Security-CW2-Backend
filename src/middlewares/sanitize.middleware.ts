import { Request, Response, NextFunction } from 'express';

/**
 * Recursively strips MongoDB operator characters ($ and .) from object keys.
 * Prevents NoSQL injection attacks such as:
 *   { "email": { "$gt": "" } }  → bypasses authentication
 *   { "email": { "$ne": null } } → matches any user
 */
const sanitizeObject = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;

    // handle arrays
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    // handle plain objects
    if (typeof obj === 'object') {
        const sanitized: any = {};
        for (const key of Object.keys(obj)) {
            // reject keys starting with $ or containing .
            if (key.startsWith('$') || key.includes('.')) {
                continue; // drop the dangerous key entirely
            }
            sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
    }

    // primitives pass through unchanged
    return obj;
};

/**
 * Express 5 compatible NoSQL injection sanitizer.
 * Note: req.query is read-only in Express 5, so we mutate its
 * properties in place rather than reassigning the object.
 */
export const sanitizeRequest = (
    req: Request, res: Response, next: NextFunction
) => {
    // req.body is writable
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }

    // req.params is writable
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }

    // req.query is READ-ONLY in Express 5 - mutate keys in place
    if (req.query) {
        for (const key of Object.keys(req.query)) {
            if (key.startsWith('$') || key.includes('.')) {
                delete (req.query as any)[key];
            }
        }
    }

    next();
};