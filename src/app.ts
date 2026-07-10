import express, { Application, Request, Response } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { connectDatabase } from './database/mongodb';
import { PORT } from './config';
import cors from "cors";
import path from 'path';
import { HttpError } from './errors/http-error';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';

dotenv.config();
console.log(process.env.PORT);

import authRoutes from "./routes/auth.route";
import adminRoutes from './routes/admin/admin.route';
import propertyRoutes from './routes/property.route';
import adminPropertyRoutes from './routes/admin/property.route';
import adminBookingRoutes from "./routes/admin/booking.route";
import bookingRoutes from "./routes/booking.route";
import favouriteRoutes from "./routes/favourite.route";
import { generalLimiter } from "./middlewares/rate-limit.middleware";
import mfaRoutes from './routes/mfa.route';

const app: Application = express();

// _____SECURITY HEADERS ______
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "blob:"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
    },
    xPoweredBy: false, // explicitly remove X-Powered-By
}));

// ____ CORS _____

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3003",
    process.env.CLIENT_URI || ""
].filter(Boolean);

let corsOptions = {
    origin: (origin: string | undefined, callback: Function) => {
        // allow requests with no origin (mobile apps, curl, postman)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    optionsSuccessStatus: 200,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
}
app.use(cors(corsOptions));

// _____HTTPS ENFORCEMENT_____
app.use((req: Request, res: Response, next: Function) => {
    if (process.env.NODE_ENV === 'production' && !req.secure) {
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
});

// _____ BODY PARSING ____
app.use(bodyParser.json({ limit: '10kb' })); // limit body size to prevent large payload attacks
app.use(bodyParser.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// _____ SANITIZATION _____
app.use(mongoSanitize()); // strips $ and . from req.body, req.params, req.query to prevent NoSQL injection

// ____ STATIC FILES ____
app.use("/uploads", express.static(path.join(__dirname, '../uploads')));

app.use(generalLimiter)

// ____ ROUTES ____
app.use('/api/auth', authRoutes);
app.use('/api/admin/users', adminRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/admin/properties', adminPropertyRoutes);
app.use("/api/admin/bookings", adminBookingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/favourites", favouriteRoutes);
app.use('/api/mfa', mfaRoutes);

app.get('/', (req: Request, res: Response) => {
    return res.status(200).json({ success: "true", message: "Welcome to the RentEase API" });
});

// _____ GLOBAL ERROR HANDLER ____
app.use((err: Error, req: Request, res: Response, next: Function) => {
    if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: "Internal Server Error" });
});

export default app;