import winston from 'winston';
import path from 'path';

// _______ LOG LEVELS _______
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// _______ LOG COLORS _______
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

// _______ LOG FORMAT _______
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// _______ CONSOLE FORMAT (for development) _______
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

// _______ LOG FILE PATHS _______
const logsDir = path.join(__dirname, '../../logs');

// _______ WINSTON LOGGER _______
export const logger = winston.createLogger({
    levels,
    format,
    transports: [
        // error logs go to separate file
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
        }),
        // all logs go to combined file
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
        }),
        // console output in development
        new winston.transports.Console({
            format: consoleFormat,
        }),
    ],
});