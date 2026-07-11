import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

export const verifyCaptcha = async (
    req: Request, res: Response, next: NextFunction
) => {
    try {
        // read secret inside the function so dotenv has definitely loaded
        const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

        const captchaToken = req.body.captchaToken;

        if (!captchaToken) {
            return res.status(400).json({
                success: false,
                message: 'CAPTCHA token is required'
            });
        }

        // verify with Google
        const response = await axios.post(RECAPTCHA_VERIFY_URL, null, {
            params: {
                secret: RECAPTCHA_SECRET_KEY,
                response: captchaToken,
            }
        });

        const { success } = response.data;

        if (!success) {
            return res.status(400).json({
                success: false,
                message: 'CAPTCHA verification failed. Please try again'
            });
        }

        next();
    } catch (error: any) {
        console.error('CAPTCHA verification error:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: 'CAPTCHA verification error'
        });
    }
};