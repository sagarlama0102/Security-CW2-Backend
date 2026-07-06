import { logger } from './logger';

interface ActivityLog {
    userId?: string;
    action: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, any>;
    status: 'success' | 'failure';
}

// ===== ACTIVITY LOGGER =====
// logs important user actions for audit trail
// NEVER logs passwords, tokens or sensitive data
export const logActivity = (log: ActivityLog) => {
    const sanitizedLog = {
        timestamp: new Date().toISOString(),
        userId: log.userId || 'anonymous',
        action: log.action,
        ipAddress: log.ipAddress || 'unknown',
        userAgent: log.userAgent || 'unknown',
        status: log.status,
        details: log.details || {},
    };

    if (log.status === 'failure') {
        logger.warn(`ACTIVITY: ${log.action}`, sanitizedLog);
    } else {
        logger.info(`ACTIVITY: ${log.action}`, sanitizedLog);
    }
};

// ===== PREDEFINED ACTIVITY ACTIONS =====
export const ActivityActions = {
    // auth
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    LOGOUT: 'LOGOUT',
    REGISTER: 'REGISTER',
    PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
    PASSWORD_RESET_SUCCESS: 'PASSWORD_RESET_SUCCESS',
    PASSWORD_CHANGED: 'PASSWORD_CHANGED',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    // profile
    PROFILE_UPDATED: 'PROFILE_UPDATED',
    PROFILE_VIEWED: 'PROFILE_VIEWED',
    // property
    PROPERTY_CREATED: 'PROPERTY_CREATED',
    PROPERTY_UPDATED: 'PROPERTY_UPDATED',
    PROPERTY_DELETED: 'PROPERTY_DELETED',
    // booking
    BOOKING_CREATED: 'BOOKING_CREATED',
    BOOKING_CANCELLED: 'BOOKING_CANCELLED',
    // admin
    ADMIN_USER_DELETED: 'ADMIN_USER_DELETED',
    ADMIN_ROLE_CHANGED: 'ADMIN_ROLE_CHANGED',
    // security
    UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
};