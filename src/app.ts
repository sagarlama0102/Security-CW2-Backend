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

dotenv.config();
console.log(process.env.PORT);

import authRoutes from "./routes/auth.route";
import adminRoutes from './routes/admin/admin.route';
import propertyRoutes from './routes/property.route';
import adminPropertyRoutes from './routes/admin/property.route';
import adminBookingRoutes from "./routes/admin/booking.route";
import bookingRoutes from "./routes/booking.route";
import favouriteRoutes from "./routes/favourite.route";

const app: Application = express();

// _____SECURITY HEADERS ______
app.use(helmet()); // sets 15+ secure HTTP headers automatically
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
    }
}));
app.use(helmet.hsts({
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
}));

// ____ CORS _____
let corsOptions = {
    origin: ["http://localhost:3000", "http://localhost:3003"],
    optionsSuccessStatus: 200,
    credentials: true,
}
app.use(cors(corsOptions));

// _____ BODY PARSING ____
app.use(bodyParser.json({ limit: '10kb' })); // limit body size to prevent large payload attacks
app.use(bodyParser.urlencoded({ extended: true, limit: '10kb' }));

// _____ SANITIZATION _____
app.use(mongoSanitize()); // strips $ and . from req.body, req.params, req.query to prevent NoSQL injection

// ____ STATIC FILES ____
app.use("/uploads", express.static(path.join(__dirname, '../uploads')));

// ____ ROUTES ____
app.use('/api/auth', authRoutes);
app.use('/api/admin/users', adminRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/admin/properties', adminPropertyRoutes);
app.use("/api/admin/bookings", adminBookingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/favourites", favouriteRoutes);

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