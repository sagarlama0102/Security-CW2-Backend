// import dotenv from "dotenv";
// dotenv.config();

// export const PORT: number = 
//     process.env.PORT ? parseInt(process.env.PORT) : 4000;
// export const MONGODB_URI: string = 
//     process.env.MONGODB_URI || 'mongodb://localhost:27017/rentease_backend';
// // Application level constants, with fallbacks 
// // if .env variables are not set

// export const JWT_SECRET: string = 
//     process.env.JWT_SECRET || 'default_secret';


import dotenv from "dotenv";
dotenv.config();

export const PORT: number =
    process.env.PORT ? parseInt(process.env.PORT) : 4000;

export const MONGODB_URI: string =
    process.env.MONGODB_URI || 'mongodb://localhost:27017/rentease_backend';

// JWT_SECRET must be set in .env — no insecure fallback
export const JWT_SECRET: string = (() => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("FATAL: JWT_SECRET environment variable is not set");
    }
    return secret;
})();